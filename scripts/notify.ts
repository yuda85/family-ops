/**
 * Notification runner.
 *
 * A thin shell around `plan()`: read the family, ask what should go out right
 * now, skip anything already sent, deliver via FCM, record what was sent.
 *
 * The trigger is deliberately outside this file (GitHub Actions cron today).
 * Moving to a different scheduler means replacing the caller, nothing here.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT='{...}' npx tsx scripts/notify.ts [--dry-run]
 *   FIREBASE_SERVICE_ACCOUNT='{...}' npx tsx scripts/notify.ts --test
 *
 * --test sends one notification to every registered device immediately. It
 * exists because at most hours of the day nothing is due, so a normal run
 * proves nothing about whether the delivery path actually works.
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

import { plan, planChanges, type PlannerData, type PushNotification } from '../src/app/core/notifications/planner';
import { toDateStr } from '../src/app/core/schedule/date-utils';
import type { Activity, Meal, Override } from '../src/app/core/schedule/schedule.models';

const DRY_RUN = process.argv.includes('--dry-run');
const TEST = process.argv.includes('--test');

/** Where a tapped notification should open. */
const APP_URL = process.env['APP_URL'] ?? 'https://yuda85.github.io/family-ops/';

/** Dated documents older than this are irrelevant to anything being sent. */
const LOOKBACK_DAYS = 2;

async function main(): Promise<void> {
  const raw = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');

  initializeApp({ credential: cert(JSON.parse(raw)) });
  const db = getFirestore();
  const now = new Date();

  const families = await db.collection('families').get();
  let sent = 0;

  for (const family of families.docs) {
    sent += TEST ? await sendTest(db, family.id) : await runFamily(db, family.id, now);
  }

  console.log(`${families.size} families, ${sent} notifications ${DRY_RUN ? 'planned' : 'sent'}`);
}

/**
 * Proves the delivery path end to end without waiting for something to be due.
 * Deliberately skips the log, so it can be run as many times as needed.
 */
async function sendTest(db: Firestore, familyId: string): Promise<number> {
  const base = db.collection('families').doc(familyId);
  const members = await base.collection('members').get();

  await deliver(base, {
    key: 'test',
    userIds: members.docs.map((d) => d.id),
    title: 'בדיקה',
    body: 'אם ההודעה הזו הגיעה, ההתראות עובדות.',
  });
  return 1;
}

async function runFamily(db: Firestore, familyId: string, now: Date): Promise<number> {
  const base = db.collection('families').doc(familyId);
  const since = shiftDays(toDateStr(now), -LOOKBACK_DAYS);

  const [members, children, activities, overrides, meals] = await Promise.all([
    base.collection('members').get(),
    base.collection('children').get(),
    base.collection('activities').get(),
    base.collection('overrides').where('date', '>=', since).get(),
    base.collection('meals').where('date', '>=', since).get(),
  ]);

  const data: PlannerData = {
    members: members.docs.map((d) => ({ id: d.id, displayName: d.data()['displayName'] ?? '' })),
    children: children.docs.map((d) => ({ id: d.id, name: d.data()['name'] ?? '' })),
    activities: activities.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity),
    overrides: overrides.docs.map((d) => ({ id: d.id, ...d.data() }) as Override),
    meals: meals.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal),
  };

  const changes = overrides.docs
    .map((doc) => {
      const value = doc.data();
      const createdAt = value['createdAt'];
      return {
        id: doc.id,
        createdAtMs: createdAt?.toMillis?.() ?? 0,
        createdBy: value['createdBy'] ?? undefined,
        summary: describeChange(value as Override, data),
      };
    })
    .filter((c) => c.createdAtMs > 0);

  const notifications = [
    ...plan(now, data),
    ...planChanges(now, changes, data.members),
  ];

  let sent = 0;
  for (const notification of notifications) {
    if (await alreadySent(base, notification.key)) continue;
    await deliver(base, notification);
    await markSent(base, notification.key);
    sent++;
  }
  return sent;
}

/**
 * The log is what makes a delayed or repeated run safe: every notification has
 * a stable key, and a key is only ever delivered once.
 */
async function alreadySent(
  base: FirebaseFirestore.DocumentReference,
  key: string
): Promise<boolean> {
  const doc = await base.collection('notificationLog').doc(encodeKey(key)).get();
  return doc.exists;
}

async function markSent(base: FirebaseFirestore.DocumentReference, key: string): Promise<void> {
  if (DRY_RUN) return;
  await base.collection('notificationLog').doc(encodeKey(key)).set({ key, sentAt: new Date() });
}

async function deliver(
  base: FirebaseFirestore.DocumentReference,
  notification: PushNotification
): Promise<void> {
  const tokens: string[] = [];

  for (const userId of notification.userIds) {
    const doc = await base.collection('pushTokens').doc(userId).get();
    const list = (doc.data()?.['tokens'] as string[] | undefined) ?? [];
    tokens.push(...list);
  }

  if (!tokens.length) {
    console.log(`[skip: no tokens] ${notification.key}`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] ${notification.key} -> ${tokens.length} devices\n${notification.body}`);
    return;
  }

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title: notification.title, body: notification.body },
    webpush: {
      fcmOptions: { link: APP_URL },
      notification: { icon: `${APP_URL}icon-192.png`, lang: 'he', dir: 'rtl' },
    },
  });

  await pruneDeadTokens(base, notification.userIds, tokens, response);
  console.log(`${notification.key}: ${response.successCount}/${tokens.length}`);
}

/** A token that the server rejects as unregistered will never work again. */
async function pruneDeadTokens(
  base: FirebaseFirestore.DocumentReference,
  userIds: string[],
  tokens: string[],
  response: { responses: Array<{ success: boolean; error?: { code: string } }> }
): Promise<void> {
  const dead = new Set(
    tokens.filter((_, i) => {
      const error = response.responses[i]?.error?.code;
      return (
        error === 'messaging/registration-token-not-registered' ||
        error === 'messaging/invalid-registration-token'
      );
    })
  );
  if (!dead.size) return;

  for (const userId of userIds) {
    const ref = base.collection('pushTokens').doc(userId);
    const current = ((await ref.get()).data()?.['tokens'] as string[] | undefined) ?? [];
    const alive = current.filter((t) => !dead.has(t));
    if (alive.length !== current.length) await ref.set({ tokens: alive }, { merge: true });
  }
}

function describeChange(override: Override, data: PlannerData): string {
  const activity = data.activities.find((a) => a.id === override.activityId);
  const what = activity?.title ?? override.title ?? 'אירוע';
  const when = override.date;

  switch (override.type) {
    case 'cancelled':
      return `${what} לא מתקיים ב-${when}${override.reason ? ` — ${override.reason}` : ''}`;
    case 'driverChanged': {
      const driver = data.members.find((m) => m.id === override.driverId);
      return driver ? `${driver.displayName} מסיע ל${what} ב-${when}` : `אין מסיע ל${what} ב-${when}`;
    }
    case 'moved':
      return `${what} הוזז ל-${override.startTime} ב-${when}`;
    case 'added':
      return `נוסף: ${what} ב-${when}`;
  }
}

/** Firestore document ids cannot contain '/'. */
function encodeKey(key: string): string {
  return key.replace(/\//g, '_');
}

function shiftDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * One-time seeding of the recurring schedule.
 *
 * Reads `seed/schedule.json` and writes children and activities into
 * Firestore. Document ids are derived from the content, so running it twice
 * updates rather than duplicates - safe to re-run after a correction.
 *
 * It refuses to write placeholder text. Anything still marked `??` in the JSON
 * has to be filled in first; a schedule with guessed values is worse than no
 * schedule.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT='{...}' npx tsx scripts/seed.ts --family <id> [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import type { Activity, PrepItem, TimeStr } from '../src/app/core/schedule/schedule.models';

const SEED_FILE = 'seed/schedule.json';
const PLACEHOLDER = '??';
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

interface SeedChild {
  /** Stable document id. Lowercase ascii, used in activity references. */
  id: string;
  name: string;
  color: string;
  order: number;
}

interface SeedActivity {
  childId: string;
  title: string;
  daysOfWeek: number[];
  startTime: TimeStr;
  endTime?: TimeStr;
  departureTime?: TimeStr;
  /** Day-of-week to member document id. */
  drivers?: Record<string, string>;
  prepItems?: PrepItem[];
}

interface SeedFile {
  children: SeedChild[];
  activities: SeedActivity[];
}

async function main(): Promise<void> {
  const familyId = argValue('--family');
  const dryRun = process.argv.includes('--dry-run');

  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as SeedFile;
  validate(seed);

  if (dryRun) {
    report(seed);
    console.log('\nDry run: nothing written.');
    return;
  }

  // A dry run only checks the file; a real write needs a family and credentials.
  if (!familyId) throw new Error('Pass --family <familyId>');

  const raw = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  initializeApp({ credential: cert(JSON.parse(raw)) });

  const db = getFirestore();
  const base = db.collection('families').doc(familyId);
  if (!(await base.get()).exists) throw new Error(`No family ${familyId}`);

  const batch = db.batch();

  for (const child of seed.children) {
    batch.set(
      base.collection('children').doc(child.id),
      { name: child.name, color: child.color, order: child.order },
      { merge: true }
    );
  }

  for (const activity of seed.activities) {
    const payload: Omit<Activity, 'id'> = {
      childId: activity.childId,
      title: activity.title,
      daysOfWeek: [...activity.daysOfWeek].sort((a, b) => a - b),
      startTime: activity.startTime,
      ...(activity.endTime ? { endTime: activity.endTime } : {}),
      ...(activity.departureTime ? { departureTime: activity.departureTime } : {}),
      drivers: Object.fromEntries(
        Object.entries(activity.drivers ?? {}).map(([day, id]) => [Number(day), id])
      ),
      prepItems: activity.prepItems ?? [],
    };
    batch.set(base.collection('activities').doc(activityId(activity)), payload, { merge: true });
  }

  await batch.commit();
  report(seed);
  console.log(`\nWritten to families/${familyId}.`);
}

/**
 * Content-derived id, so re-running after an edit updates the same document
 * instead of leaving a duplicate behind.
 */
function activityId(activity: SeedActivity): string {
  const slug = activity.title.replace(/\s+/g, '-');
  return `${activity.childId}-${slug}`;
}

function validate(seed: SeedFile): void {
  const problems: string[] = [];
  const childIds = new Set(seed.children.map((c) => c.id));

  for (const child of seed.children) {
    if (child.name.includes(PLACEHOLDER)) problems.push(`child ${child.id}: name still ${PLACEHOLDER}`);
  }

  for (const [index, activity] of seed.activities.entries()) {
    const where = `activity ${index} (${activity.title})`;
    if (activity.title.includes(PLACEHOLDER)) problems.push(`${where}: title still ${PLACEHOLDER}`);
    if (!childIds.has(activity.childId)) problems.push(`${where}: unknown child ${activity.childId}`);
    if (!activity.daysOfWeek.length) problems.push(`${where}: no days`);
    if (activity.daysOfWeek.some((d) => d < 0 || d > 6)) problems.push(`${where}: day out of range`);

    for (const [label, value] of [
      ['startTime', activity.startTime],
      ['endTime', activity.endTime],
      ['departureTime', activity.departureTime],
    ] as const) {
      if (value !== undefined && !TIME.test(value)) problems.push(`${where}: bad ${label} "${value}"`);
    }

    if (activity.departureTime && activity.endTime && activity.departureTime >= activity.startTime) {
      problems.push(`${where}: departure ${activity.departureTime} is not before start ${activity.startTime}`);
    }

    for (const day of Object.keys(activity.drivers ?? {})) {
      if (!activity.daysOfWeek.includes(Number(day))) {
        problems.push(`${where}: driver set for day ${day}, which it does not run on`);
      }
    }
  }

  if (problems.length) {
    console.error('Seed file is not ready:\n' + problems.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }
}

function report(seed: SeedFile): void {
  const names = new Map(seed.children.map((c) => [c.id, c.name]));
  console.log(`${seed.children.length} children, ${seed.activities.length} activities\n`);

  for (const child of seed.children) {
    console.log(`${child.name} (${child.color})`);
    for (const activity of seed.activities.filter((a) => a.childId === child.id)) {
      const days = activity.daysOfWeek.map((d) => DAYS[d]).join(',');
      const departure = activity.departureTime ? ` leave ${activity.departureTime}` : '';
      console.log(`  ${activity.title.padEnd(16)} ${days.padEnd(14)} ${activity.startTime}${departure}`);
    }
  }
  void names;
}

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

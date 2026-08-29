import { buildDayView } from '../schedule/day-builder';
import { addDays, toDateStr, toMinutes, toTimeStr } from '../schedule/date-utils';
import type {
  Activity,
  DayEntry,
  DayView,
  Meal,
  Override,
} from '../schedule/schedule.models';

/**
 * Decides what should be pushed at a given moment.
 *
 * Pure by design: no network, no Firestore, no ambient clock. The trigger that
 * calls it is replaceable (GitHub Actions today, a Worker cron tomorrow)
 * without touching any of this logic, and every rule below is unit-testable
 * against a frozen clock.
 */

export interface Person {
  id: string;
  displayName: string;
}

export interface Child {
  id: string;
  name: string;
}

export interface PlannerData {
  members: Person[];
  children: Child[];
  activities: Activity[];
  overrides: Override[];
  meals: Meal[];
}

export interface PushNotification {
  /** Stable per (date, rule, target). The runner uses it to never repeat. */
  key: string;
  userIds: string[];
  title: string;
  body: string;
}

/** Fixed times of day, in Israel wall clock. */
const EVENING_BRIEF_AT = '21:00';
const MORNING_DIGEST_AT = '07:00';

/** Two departures closer than this are announced together. */
const MERGE_WINDOW_MINUTES = 30;

/**
 * How late a rule may still fire. The trigger can be delayed, and a briefing
 * that arrives twenty minutes late is still useful - but "leave now" is not,
 * so it gets the tightest tolerance.
 */
const GRACE_MINUTES = {
  eveningBrief: 60,
  morningDigest: 60,
  departure2h: 30,
  departure10m: 12,
  prep: 60,
  change: 15,
} as const;

export function plan(now: Date, data: PlannerData): PushNotification[] {
  const date = toDateStr(now);
  const minutes = toMinutes(toTimeStr(now));
  const everyone = data.members.map((m) => m.id);

  const today = buildDayView(date, data);
  const tomorrow = buildDayView(addDays(date, 1), data);

  const out: PushNotification[] = [];

  if (due(minutes, toMinutes(EVENING_BRIEF_AT), GRACE_MINUTES.eveningBrief)) {
    out.push({
      key: `${date}:evening-brief`,
      userIds: everyone,
      title: 'מה מחר',
      body: briefBody(tomorrow, data),
    });
  }

  if (due(minutes, toMinutes(MORNING_DIGEST_AT), GRACE_MINUTES.morningDigest)) {
    const body = departuresBody(today, data);
    if (body) {
      out.push({ key: `${date}:morning-digest`, userIds: everyone, title: 'היציאות של היום', body });
    }
  }

  out.push(...departureAlerts(date, minutes, today, data));
  out.push(...prepAlerts(date, minutes, today, tomorrow, data));

  return out;
}

/**
 * Notifies the other parent about a change one of them just made. Driven by
 * document timestamps rather than a database trigger, which is what a polling
 * runner can actually observe.
 */
export function planChanges(
  now: Date,
  changes: Array<{ id: string; createdAtMs: number; createdBy?: string; summary: string }>,
  members: Person[]
): PushNotification[] {
  const cutoff = now.getTime() - GRACE_MINUTES.change * 60_000;

  return changes
    .filter((c) => c.createdAtMs >= cutoff)
    .map((change) => ({
      key: `change:${change.id}`,
      userIds: members.filter((m) => m.id !== change.createdBy).map((m) => m.id),
      title: 'עדכון בלוז',
      body: change.summary,
    }))
    .filter((n) => n.userIds.length > 0);
}

// ============================================
// Rules
// ============================================

function departureAlerts(
  date: string,
  minutes: number,
  day: DayView,
  data: PlannerData
): PushNotification[] {
  const out: PushNotification[] = [];

  for (const [driverId, drives] of groupDrivesByDriver(day)) {
    for (const group of mergeAdjacent(drives)) {
      const at = toMinutes(group[0].departureTime!);
      const names = group.map((e) => childName(data, e.childId)).filter(Boolean);
      const titles = group.map((e) => e.title).join(' ו');
      const places = [...new Set(group.map((e) => e.location).filter(Boolean))].join(' ו');
      const where = places ? ` · ${places}` : '';
      const who = names.length ? ` את ${names.join(' ו')}` : '';
      const groupKey = group.map((e) => e.id).join('+');

      if (due(minutes, at - 120, GRACE_MINUTES.departure2h)) {
        out.push({
          key: `${date}:departure-2h:${groupKey}`,
          userIds: [driverId],
          title: 'בעוד שעתיים יציאה',
          body: `${group[0].departureTime} — ${titles}${who}${where}`,
        });
      }

      if (due(minutes, at - 10, GRACE_MINUTES.departure10m)) {
        out.push({
          key: `${date}:departure-10m:${groupKey}`,
          userIds: [driverId],
          title: 'צא עכשיו',
          body: `${titles}${who}${where} · יציאה ${group[0].departureTime}`,
        });
      }
    }
  }

  return out;
}

/**
 * Prep tasks are announced at their offset before the activity. An item due
 * the evening before belongs to tomorrow's entry, so both days are scanned.
 */
function prepAlerts(
  date: string,
  minutes: number,
  today: DayView,
  tomorrow: DayView,
  data: PlannerData
): PushNotification[] {
  const everyone = data.members.map((m) => m.id);
  const out: PushNotification[] = [];

  const scan = (day: DayView, dayOffset: number) => {
    for (const entry of day.entries) {
      if (entry.cancelled) continue;
      for (const [index, item] of entry.prepItems.entries()) {
        const at = toMinutes(entry.startTime) + dayOffset * 1440 - item.hoursBefore * 60;
        if (!due(minutes, at, GRACE_MINUTES.prep)) continue;
        out.push({
          key: `${date}:prep:${entry.id}:${index}`,
          userIds: everyone,
          title: 'להכין',
          body: `${item.text} — ${entry.title}, ${childName(data, entry.childId)}`,
        });
      }
    }
  };

  scan(today, 0);
  scan(tomorrow, 1);
  return out;
}

// ============================================
// Message bodies
// ============================================

function briefBody(day: DayView, data: PlannerData): string {
  const live = day.entries.filter((e) => !e.cancelled);
  if (!live.length && !day.meal) return 'מחר פנוי.';

  const lines: string[] = [];
  if (day.holiday?.cancelsSchool) lines.push(`${day.holiday.name} — אין לימודים`);

  for (const entry of live) {
    const driver = memberName(data, entry.driverId);
    const leave = entry.departureTime ? ` (יציאה ${entry.departureTime}${driver ? `, ${driver}` : ''})` : '';
    const place = entry.location ? ` · ${entry.location}` : '';
    lines.push(`${entry.startTime} ${entry.title} · ${childName(data, entry.childId)}${place}${leave}`);
  }

  if (day.meal) {
    const start = day.meal.startCookingAt ? ` — להתחיל ${day.meal.startCookingAt}` : '';
    lines.push(`ארוחת ערב: ${day.meal.title}${start}`);
  }

  const presence = day.presence
    .map((p) => {
      const name = memberName(data, p.memberId);
      if (!name) return null;
      if (p.worksFromHome) return `${name} בבית`;
      return p.returnTime ? `${name} חוזר ${p.returnTime}` : null;
    })
    .filter(Boolean);
  if (presence.length) lines.push(presence.join(' · '));

  const unassigned = day.conflicts.filter((c) => c.kind === 'noDriver').length;
  if (unassigned) lines.push(`⚠ ${unassigned} הסעות ללא מסיע`);

  return lines.join('\n');
}

function departuresBody(day: DayView, data: PlannerData): string | null {
  const drives = day.entries.filter((e) => !e.cancelled && e.departureTime);
  if (!drives.length) return null;

  return drives
    .map((entry) => {
      const driver = memberName(data, entry.driverId) ?? 'אין מסיע';
      return `${entry.departureTime} ${entry.title} · ${childName(data, entry.childId)} · ${driver}`;
    })
    .join('\n');
}

// ============================================
// Helpers
// ============================================

/**
 * True when `target` has arrived and has not yet gone stale. The grace window
 * lets a delayed trigger still deliver; the runner's log stops it repeating.
 */
function due(nowMinutes: number, target: number, graceMinutes: number): boolean {
  return nowMinutes >= target && nowMinutes - target <= graceMinutes;
}

function groupDrivesByDriver(day: DayView): Map<string, DayEntry[]> {
  const byDriver = new Map<string, DayEntry[]>();

  for (const entry of day.entries) {
    if (entry.cancelled || !entry.departureTime || !entry.driverId) continue;
    const list = byDriver.get(entry.driverId) ?? [];
    list.push(entry);
    byDriver.set(entry.driverId, list);
  }

  for (const list of byDriver.values()) {
    list.sort((a, b) => toMinutes(a.departureTime!) - toMinutes(b.departureTime!));
  }
  return byDriver;
}

/** Runs of departures close enough together to announce as one. */
function mergeAdjacent(drives: DayEntry[]): DayEntry[][] {
  const groups: DayEntry[][] = [];

  for (const entry of drives) {
    const current = groups[groups.length - 1];
    const gap = current
      ? toMinutes(entry.departureTime!) - toMinutes(current[current.length - 1].departureTime!)
      : Infinity;

    if (current && gap < MERGE_WINDOW_MINUTES) current.push(entry);
    else groups.push([entry]);
  }

  return groups;
}

function childName(data: PlannerData, id: string): string {
  return data.children.find((c) => c.id === id)?.name ?? '';
}

function memberName(data: PlannerData, id?: string | null): string | null {
  if (!id) return null;
  return data.members.find((m) => m.id === id)?.displayName ?? null;
}

export const __testing = { due, mergeAdjacent };

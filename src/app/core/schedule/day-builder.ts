import type {
  Activity,
  Availability,
  Conflict,
  DayWorkOverride,
  DateStr,
  DayEntry,
  DayShape,
  DayView,
  DayMeal,
  Meal,
  MealPlan,
  MemberPresence,
  Override,
} from './schedule.models';
import { dateStrToUtc, dayOfWeekOf, toMinutes, withinRange } from './date-utils';
import { getHolidayInfo } from './holidays';

export interface DayInput {
  activities: Activity[];
  overrides: Override[];
  meals: Meal[];
  mealPlans?: MealPlan[];
  availability?: Availability[];
  availabilityDays?: DayWorkOverride[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Home by this hour and the afternoon is covered. */
const EARLY_BY = '15:00';
/** Home only after this and the afternoon needs arranging. */
const LATE_FROM = '17:00';

/**
 * The single source of truth for "what is happening on this date".
 *
 * Pure: no Firestore, no network, no clock. The UI calls it to render, and the
 * notification sender calls it to decide what to push - so both always agree.
 */
export function buildDayView(date: DateStr, input: DayInput): DayView {
  const dayOfWeek = dayOfWeekOf(date);
  const holiday = getHolidayInfo(date);
  const dayOverrides = input.overrides.filter((o) => o.date === date);

  const entries: DayEntry[] = [];

  for (const activity of input.activities) {
    if (!activity.daysOfWeek.includes(dayOfWeek)) continue;
    if (!withinRange(date, activity.activeFrom, activity.activeUntil)) continue;

    const overrides = dayOverrides.filter((o) => o.activityId === activity.id);
    const cancelling = overrides.find((o) => o.type === 'cancelled');
    // An explicit non-cancelling override on a holiday means "yes, this one is
    // still on" - the parent said so directly, which beats the calendar.
    const explicitlyKept = overrides.some((o) => o.type !== 'cancelled');

    let entry: DayEntry = {
      id: activity.id,
      activityId: activity.id,
      childId: activity.childId,
      title: activity.title,
      location: activity.location,
      startTime: activity.startTime,
      endTime: activity.endTime,
      departureTime: activity.departureTime,
      driverId: activity.drivers[dayOfWeek] ?? null,
      cancelled: false,
      prepItems: activity.prepItems ?? [],
    };

    if (holiday?.cancelsSchool && !explicitlyKept) {
      entry.cancelled = true;
      entry.cancelReason = holiday.name;
    }

    for (const override of overrides) {
      entry = applyOverride(entry, override);
    }

    const relocation = overrides.find((o) => o.movedToDate && o.movedToDate !== date);
    if (relocation) {
      entry.cancelled = true;
      entry.movedToDate = relocation.movedToDate;
      entry.cancelReason = relocation.reason ?? `הועבר ל-${relocation.movedToDate}`;
    }
    if (cancelling) {
      entry.cancelled = true;
      entry.cancelReason = cancelling.reason ?? entry.cancelReason;
    }

    entries.push(entry);
  }

  // Occurrences relocated onto this date from another one.
  for (const override of input.overrides) {
    if (override.movedToDate !== date) continue;
    const activity = input.activities.find((a) => a.id === override.activityId);
    if (!activity) continue;

    entries.push({
      id: `${activity.id}@${override.id}`,
      activityId: activity.id,
      overrideId: override.id,
      childId: activity.childId,
      title: activity.title,
      location: activity.location,
      startTime: override.startTime ?? activity.startTime,
      endTime: override.endTime ?? activity.endTime,
      departureTime: override.departureTime ?? activity.departureTime,
      driverId: override.driverId ?? activity.drivers[dayOfWeek] ?? null,
      cancelled: false,
      movedFromDate: override.date,
      prepItems: activity.prepItems ?? [],
    });
  }

  // One-off events live only as overrides; they have no template behind them.
  for (const override of dayOverrides) {
    if (override.type !== 'added') continue;
    entries.push({
      id: override.id,
      overrideId: override.id,
      childId: override.childId ?? '',
      title: override.title ?? '',
      location: override.location,
      startTime: override.startTime ?? '00:00',
      endTime: override.endTime,
      departureTime: override.departureTime,
      driverId: override.driverId ?? null,
      cancelled: false,
      prepItems: override.prepItems ?? [],
    });
  }

  entries.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  const presence = presenceFor(date, dayOfWeek, input);

  return {
    date,
    dayOfWeek,
    holiday,
    entries,
    meal: mealFor(date, dayOfWeek, input),
    conflicts: findConflicts(entries),
    presence,
    shape: shapeOf(presence),
  };
}

/**
 * Plan and override combined. A one-off with no plan behind it still works,
 * and an override can either change the dinner or say there isn't one.
 */
function mealFor(date: DateStr, dayOfWeek: number, input: DayInput): DayMeal | undefined {
  const override = input.meals.find((m) => m.date === date);
  const plan = (input.mealPlans ?? []).find((p) => planRunsOn(p, date, dayOfWeek));

  if (override?.cancelled) return undefined;

  if (override && (override.title || plan)) {
    return {
      title: override.title ?? plan!.title,
      startCookingAt: override.startCookingAt ?? plan?.startCookingAt,
      planId: plan?.id,
      cadence: plan?.cadence,
    };
  }

  if (plan) {
    return {
      title: plan.title,
      startCookingAt: plan.startCookingAt,
      planId: plan.id,
      cadence: plan.cadence,
    };
  }

  return undefined;
}

function planRunsOn(plan: MealPlan, date: DateStr, dayOfWeek: number): boolean {
  if (plan.dayOfWeek !== dayOfWeek) return false;
  if (!withinRange(date, plan.activeFrom, plan.activeUntil)) return false;
  if (plan.cadence === 'weekly') return true;

  // Compared by calendar week rather than by raw day difference, so the
  // rhythm holds even if the anchor was recorded on a different weekday.
  const delta = weekIndex(date) - weekIndex(plan.anchorDate);
  return delta % 2 === 0;
}

/** Weeks since the epoch, counting from Sunday. */
function weekIndex(date: DateStr): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfWeek = dateStrToUtc(date).getTime() - dayOfWeekOf(date) * dayMs;
  return Math.round(startOfWeek / WEEK_MS);
}

/** The usual week, with this date's deviations applied on top. */
function presenceFor(date: DateStr, dayOfWeek: number, input: DayInput): MemberPresence[] {
  const byMember = new Map<string, MemberPresence>();

  for (const entry of input.availability ?? []) {
    const work = entry.days?.[dayOfWeek];
    if (work) byMember.set(entry.id, { memberId: entry.id, ...work });
  }

  for (const override of input.availabilityDays ?? []) {
    if (override.date !== date) continue;
    if (override.cleared) {
      byMember.delete(override.memberId);
      continue;
    }
    byMember.set(override.memberId, {
      memberId: override.memberId,
      worksFromHome: override.worksFromHome,
      ...(override.returnTime ? { returnTime: override.returnTime } : {}),
    });
  }

  return [...byMember.values()];
}

/**
 * The single question this answers: is anyone around this afternoon? Someone
 * at home settles it; otherwise the earliest return decides.
 */
function shapeOf(presence: MemberPresence[]): DayShape {
  if (!presence.length) return 'unknown';
  if (presence.some((p) => p.worksFromHome)) return 'home';

  const returns = presence.map((p) => p.returnTime).filter((t): t is string => !!t);
  if (!returns.length) return 'unknown';

  const earliest = returns.reduce((a, b) => (toMinutes(a) <= toMinutes(b) ? a : b));
  if (toMinutes(earliest) <= toMinutes(EARLY_BY)) return 'early';
  if (toMinutes(earliest) >= toMinutes(LATE_FROM)) return 'late';
  return 'mid';
}

function applyOverride(entry: DayEntry, override: Override): DayEntry {
  const next: DayEntry = { ...entry, overrideId: override.id };

  switch (override.type) {
    case 'moved':
      if (override.startTime && override.startTime !== entry.startTime) {
        next.movedFrom = { startTime: entry.startTime, endTime: entry.endTime };
        next.startTime = override.startTime;
      }
      if (override.endTime !== undefined) next.endTime = override.endTime;
      if (override.location !== undefined) next.location = override.location;
      if (override.departureTime !== undefined) next.departureTime = override.departureTime;
      if (override.driverId !== undefined) next.driverId = override.driverId;
      // An explicit reschedule overrides a calendar-driven cancellation.
      next.cancelled = false;
      next.cancelReason = undefined;
      break;

    case 'driverChanged':
      if (override.driverId !== undefined) next.driverId = override.driverId;
      next.cancelled = false;
      next.cancelReason = undefined;
      break;

    case 'cancelled':
      next.cancelled = true;
      next.cancelReason = override.reason;
      break;

    case 'added':
      break;
  }

  return next;
}

/**
 * Two things are worth shouting about: a drive nobody owns, and one parent
 * expected in two places at once.
 */
function findConflicts(entries: DayEntry[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const drives = entries.filter((e) => !e.cancelled && e.departureTime);

  for (const entry of drives) {
    if (entry.driverId === null) {
      conflicts.push({
        kind: 'noDriver',
        entryIds: [entry.id],
        message: `אין מסיע ל${entry.title}`,
      });
    }
  }

  for (let i = 0; i < drives.length; i++) {
    for (let j = i + 1; j < drives.length; j++) {
      const a = drives[i];
      const b = drives[j];
      if (!a.driverId || a.driverId !== b.driverId) continue;
      if (!overlaps(a, b)) continue;
      // Two children due at the same place at the same time is one trip, not
      // a clash - the sibling run is the normal case, not a problem.
      if (a.location && a.location === b.location) continue;
      conflicts.push({
        kind: 'driverDoubleBooked',
        entryIds: [a.id, b.id],
        driverId: a.driverId,
        message: `אותו מסיע ל${a.title} ול${b.title} באותה שעה`,
      });
    }
  }

  return conflicts;
}

/** The travel window: from leaving home until the activity starts. */
function overlaps(a: DayEntry, b: DayEntry): boolean {
  const aStart = toMinutes(a.departureTime!);
  const aEnd = toMinutes(a.startTime);
  const bStart = toMinutes(b.departureTime!);
  const bEnd = toMinutes(b.startTime);
  return aStart < bEnd && bStart < aEnd;
}

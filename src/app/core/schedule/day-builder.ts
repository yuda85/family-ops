import type {
  Activity,
  Conflict,
  DateStr,
  DayEntry,
  DayView,
  Meal,
  Override,
} from './schedule.models';
import { dayOfWeekOf, toMinutes, withinRange } from './date-utils';
import { getHolidayInfo } from './holidays';

export interface DayInput {
  activities: Activity[];
  overrides: Override[];
  meals: Meal[];
}

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
    if (cancelling) {
      entry.cancelled = true;
      entry.cancelReason = cancelling.reason ?? entry.cancelReason;
    }

    entries.push(entry);
  }

  // One-off events live only as overrides; they have no template behind them.
  for (const override of dayOverrides) {
    if (override.type !== 'added') continue;
    entries.push({
      id: override.id,
      overrideId: override.id,
      childId: override.childId ?? '',
      title: override.title ?? '',
      startTime: override.startTime ?? '00:00',
      endTime: override.endTime,
      departureTime: override.departureTime,
      driverId: override.driverId ?? null,
      cancelled: false,
      prepItems: override.prepItems ?? [],
    });
  }

  entries.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  return {
    date,
    dayOfWeek,
    holiday,
    entries,
    meal: input.meals.find((m) => m.date === date),
    conflicts: findConflicts(entries),
  };
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

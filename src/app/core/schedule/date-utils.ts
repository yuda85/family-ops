import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { DateStr, TimeStr } from './schedule.models';

/**
 * The family lives in one timezone. Everything the user sees is Israel wall
 * time, including when the notification sender runs on a UTC machine.
 */
export const TIMEZONE = 'Asia/Jerusalem';

/** Calendar date in Israel for a given instant. */
export function toDateStr(instant: Date): DateStr {
  return formatInTimeZone(instant, TIMEZONE, 'yyyy-MM-dd');
}

/** Wall-clock time in Israel for a given instant. */
export function toTimeStr(instant: Date): TimeStr {
  return formatInTimeZone(instant, TIMEZONE, 'HH:mm');
}

/** Israel-local Date, for day-of-week and calendar math. */
export function toZoned(instant: Date): Date {
  return toZonedTime(instant, TIMEZONE);
}

/**
 * Day of week for a calendar date. Parsed as UTC so the result never shifts
 * with the runner's local timezone or a DST boundary.
 */
export function dayOfWeekOf(date: DateStr): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Midnight UTC of a calendar date. Use only for date arithmetic. */
export function dateStrToUtc(date: DateStr): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: DateStr, days: number): DateStr {
  const base = dateStrToUtc(date);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Minutes since midnight. "16:05" -> 965 */
export function toMinutes(time: TimeStr): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(minutes: number): TimeStr {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** True when `date` falls inside an optional [from, until] window. */
export function withinRange(date: DateStr, from?: DateStr, until?: DateStr): boolean {
  if (from && date < from) return false;
  if (until && date > until) return false;
  return true;
}

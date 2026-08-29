import { HDate, flags, getHolidaysOnDate } from '@hebcal/core';
import type { DateStr, HolidayInfo } from './schedule.models';
import { dateStrToUtc } from './date-utils';

/**
 * Hebrew calendar lookup. Holidays are never written to the database - they
 * are a property of the date itself, computed on demand.
 *
 * Israeli schedule (`il = true`): one day of yom tov, not two.
 */
export function getHolidayInfo(date: DateStr): HolidayInfo | undefined {
  const [y, m, d] = date.split('-').map(Number);
  const events = getHolidaysOnDate(new HDate(new Date(y, m - 1, d)), true);
  if (!events?.length) return undefined;

  // Prefer the event that actually affects the day over minor observances.
  const ranked = [...events].sort((a, b) => rank(b) - rank(a));
  const primary = ranked[0];
  const f = primary.getFlags();

  const isYomTov = hasFlag(f, flags.CHAG);
  const isCholHamoed = hasFlag(f, flags.CHOL_HAMOED);
  const isErev = hasFlag(f, flags.EREV);

  return {
    name: primary.render('he'),
    isYomTov,
    isCholHamoed,
    isErev,
    // Chol hamoed and erev chag vary by school; only yom tov is a certainty.
    cancelsSchool: isYomTov,
  };
}

/** True when the given calendar date is Saturday. */
export function isShabbat(date: DateStr): boolean {
  return dateStrToUtc(date).getUTCDay() === 6;
}

function hasFlag(value: number, flag: number): boolean {
  return (value & flag) !== 0;
}

function rank(event: { getFlags(): number }): number {
  const f = event.getFlags();
  if (hasFlag(f, flags.CHAG)) return 4;
  if (hasFlag(f, flags.CHOL_HAMOED)) return 3;
  if (hasFlag(f, flags.EREV)) return 2;
  if (hasFlag(f, flags.MODERN_HOLIDAY)) return 1;
  return 0;
}

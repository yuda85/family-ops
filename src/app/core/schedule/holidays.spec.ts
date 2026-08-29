import { describe, expect, it } from 'vitest';
import { getHolidayInfo } from './holidays';

describe('getHolidayInfo', () => {
  it('reports a yom tov and that school is out', () => {
    const pesach = getHolidayInfo('2027-04-22');

    expect(pesach?.name).toContain('פֶּסַח');
    expect(pesach?.isYomTov).toBe(true);
    expect(pesach?.cancelsSchool).toBe(true);
  });

  it('reports erev chag without claiming school is cancelled', () => {
    const erev = getHolidayInfo('2027-04-21');

    expect(erev?.isErev).toBe(true);
    expect(erev?.cancelsSchool).toBe(false);
  });

  it('keeps the modern holidays that change the day', () => {
    expect(getHolidayInfo('2027-05-12')?.name).toContain('הָעַצְמָאוּת');
    expect(getHolidayInfo('2027-05-11')?.name).toContain('הַזִּכָּרוֹן');
  });

  it('keeps Purim and Chanukah, when school is out but the calendar calls them minor', () => {
    expect(getHolidayInfo('2027-03-23')?.name).toContain('פּוּרִים');
    expect(getHolidayInfo('2026-12-05')?.name).toContain('חֲנוּכָּה');
  });

  it('drops commemorations that leave the schedule untouched', () => {
    // Ben-Gurion Day. Real, in the calendar, and changes nothing about the
    // day - a banner that mentions it teaches everyone to ignore banners.
    expect(getHolidayInfo('2026-11-16')).toBeUndefined();
  });

  it('returns nothing on an ordinary day', () => {
    expect(getHolidayInfo('2026-11-15')).toBeUndefined();
  });
});

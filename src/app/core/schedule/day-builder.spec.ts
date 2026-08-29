import { describe, expect, it } from 'vitest';
import { buildDayView, type DayInput } from './day-builder';
import type { Activity, Override } from './schedule.models';

// Plain weeks with no holidays: 2026-11-15 Sunday, 2026-11-18 Wednesday.
const SUNDAY = '2026-11-15';
const WEDNESDAY = '2026-11-18';

function activity(over: Partial<Activity> = {}): Activity {
  return {
    id: 'act-gym',
    childId: 'noa',
    title: 'התעמלות',
    daysOfWeek: [0, 3],
    startTime: '16:00',
    endTime: '17:30',
    departureTime: '15:35',
    drivers: { 0: 'dad', 3: 'mom' },
    prepItems: [{ text: 'לארוז בגדי התעמלות', hoursBefore: 12 }],
    ...over,
  };
}

function input(over: Partial<DayInput> = {}): DayInput {
  return { activities: [activity()], overrides: [], meals: [], ...over };
}

describe('buildDayView', () => {
  it('emits an activity on a day it recurs, with that day\'s driver', () => {
    const view = buildDayView(SUNDAY, input());

    expect(view.dayOfWeek).toBe(0);
    expect(view.entries).toHaveLength(1);
    expect(view.entries[0].title).toBe('התעמלות');
    expect(view.entries[0].driverId).toBe('dad');
    expect(view.entries[0].cancelled).toBe(false);
  });

  it('picks the driver for the specific weekday', () => {
    const view = buildDayView(WEDNESDAY, input());
    expect(view.entries[0].driverId).toBe('mom');
  });

  it('skips days the activity does not recur on', () => {
    // 2026-11-16 is a Monday, not in daysOfWeek.
    expect(buildDayView('2026-11-16', input()).entries).toHaveLength(0);
  });

  it('respects the active window', () => {
    const scoped = input({ activities: [activity({ activeFrom: '2026-12-01' })] });
    expect(buildDayView(SUNDAY, scoped).entries).toHaveLength(0);
  });

  it('keeps a cancelled activity visible instead of hiding it', () => {
    const cancel: Override = {
      id: 'ovr-1',
      date: SUNDAY,
      type: 'cancelled',
      activityId: 'act-gym',
      reason: 'נועה חולה',
    };
    const view = buildDayView(SUNDAY, input({ overrides: [cancel] }));

    expect(view.entries).toHaveLength(1);
    expect(view.entries[0].cancelled).toBe(true);
    expect(view.entries[0].cancelReason).toBe('נועה חולה');
  });

  it('marks activities cancelled on yom tov, still visible, with the holiday name', () => {
    // 2026-04-02 is the first day of Pesach (Israeli schedule), a Thursday.
    const pesach = buildDayView('2026-04-02', input({ activities: [activity({ daysOfWeek: [4] })] }));

    expect(pesach.holiday?.cancelsSchool).toBe(true);
    expect(pesach.entries).toHaveLength(1);
    expect(pesach.entries[0].cancelled).toBe(true);
    expect(pesach.entries[0].cancelReason).toBe(pesach.holiday?.name);
  });

  it('lets an explicit override win over the holiday cancellation', () => {
    const moved: Override = {
      id: 'ovr-2',
      date: '2026-04-02',
      type: 'moved',
      activityId: 'act-gym',
      startTime: '10:00',
    };
    const view = buildDayView(
      '2026-04-02',
      input({ activities: [activity({ daysOfWeek: [4] })], overrides: [moved] })
    );

    expect(view.entries[0].cancelled).toBe(false);
    expect(view.entries[0].startTime).toBe('10:00');
    expect(view.entries[0].movedFrom?.startTime).toBe('16:00');
  });

  it('applies a driver change without touching the template', () => {
    const swap: Override = {
      id: 'ovr-3',
      date: SUNDAY,
      type: 'driverChanged',
      activityId: 'act-gym',
      driverId: 'mom',
    };
    const view = buildDayView(SUNDAY, input({ overrides: [swap] }));

    expect(view.entries[0].driverId).toBe('mom');
    expect(view.conflicts).toHaveLength(0);
  });

  it('adds a one-off event that has no template behind it', () => {
    const dentist: Override = {
      id: 'ovr-4',
      date: SUNDAY,
      type: 'added',
      childId: 'dan',
      title: 'רופא שיניים',
      startTime: '09:00',
      departureTime: '08:30',
      driverId: 'dad',
    };
    const view = buildDayView(SUNDAY, input({ overrides: [dentist] }));

    expect(view.entries.map((e) => e.title)).toEqual(['רופא שיניים', 'התעמלות']);
  });

  it('reports a drive nobody owns', () => {
    const orphan = input({ activities: [activity({ drivers: {} })] });
    const view = buildDayView(SUNDAY, orphan);

    expect(view.conflicts).toHaveLength(1);
    expect(view.conflicts[0].kind).toBe('noDriver');
  });

  it('reports one parent expected in two places at once', () => {
    const clash = input({
      activities: [
        activity(),
        activity({ id: 'act-swim', childId: 'yael', title: 'שחייה', drivers: { 0: 'dad' } }),
      ],
    });
    const view = buildDayView(SUNDAY, clash);

    const doubles = view.conflicts.filter((c) => c.kind === 'driverDoubleBooked');
    expect(doubles).toHaveLength(1);
    expect(doubles[0].driverId).toBe('dad');
  });

  it('does not call a sibling run a clash', () => {
    // Two children, same place, same time: one journey.
    const siblings = input({
      activities: [
        activity({ id: 'climb-a', childId: 'noa', title: 'קיר טיפוס', location: 'רמת ישי' }),
        activity({ id: 'climb-b', childId: 'dan', title: 'קיר טיפוס', location: 'רמת ישי' }),
      ],
    });

    expect(buildDayView(SUNDAY, siblings).conflicts).toHaveLength(0);
  });

  it('still flags the same driver due in two different places', () => {
    const split = input({
      activities: [
        activity({ location: 'שמשית' }),
        activity({ id: 'other', childId: 'dan', title: "נינג'ה", location: 'רמת ישי' }),
      ],
    });

    const clashes = buildDayView(SUNDAY, split).conflicts.filter(
      (c) => c.kind === 'driverDoubleBooked'
    );
    expect(clashes).toHaveLength(1);
  });

  it('ignores cancelled entries when looking for conflicts', () => {
    const clash = input({
      activities: [
        activity(),
        activity({ id: 'act-swim', childId: 'yael', title: 'שחייה', drivers: { 0: 'dad' } }),
      ],
      overrides: [{ id: 'ovr-5', date: SUNDAY, type: 'cancelled', activityId: 'act-swim' }],
    });

    expect(buildDayView(SUNDAY, clash).conflicts).toHaveLength(0);
  });

  it('attaches the meal for the date', () => {
    const view = buildDayView(
      SUNDAY,
      input({
        meals: [
          { id: 'meal-1', date: SUNDAY, title: 'שניצל', startCookingAt: '18:00' },
          { id: 'meal-2', date: WEDNESDAY, title: 'פסטה' },
        ],
      })
    );

    expect(view.meal?.title).toBe('שניצל');
  });

  it('sorts entries by start time', () => {
    const view = buildDayView(
      SUNDAY,
      input({
        activities: [
          activity({ id: 'a-late', title: 'מאוחר', startTime: '18:00', departureTime: '17:40' }),
          activity({ id: 'a-early', title: 'מוקדם', startTime: '08:00', departureTime: '07:40' }),
        ],
      })
    );

    expect(view.entries.map((e) => e.title)).toEqual(['מוקדם', 'מאוחר']);
  });
});

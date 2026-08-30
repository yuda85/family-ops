import { describe, expect, it } from 'vitest';
import { buildDayView, type DayInput } from './day-builder';
import type {
  Activity,
  Availability,
  ChoreEntry,
  ChorePlan,
  DayWorkOverride,
  MealPlan,
  Override,
} from './schedule.models';

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

  it('lets a one-week driver swap stand without disturbing the arrangement', () => {
    const swap: Override = {
      id: 'ovr-3b',
      date: SUNDAY,
      type: 'driverChanged',
      activityId: 'act-gym',
      driverId: 'mom',
    };
    const data = input({ overrides: [swap] });

    expect(buildDayView(SUNDAY, data).entries[0].driverId).toBe('mom');
    // The following week goes back to whoever the template says.
    expect(buildDayView('2026-11-22', data).entries[0].driverId).toBe('dad');
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

  describe('moving one occurrence to another date', () => {
    // Sunday's gym, pushed to Tuesday 2026-11-17 at 18:00.
    const moved: Override = {
      id: 'ovr-move',
      date: SUNDAY,
      type: 'moved',
      activityId: 'act-gym',
      movedToDate: '2026-11-17',
      startTime: '18:00',
    };

    it('keeps it visible on the original day, struck through, saying where it went', () => {
      const view = buildDayView(SUNDAY, input({ overrides: [moved] }));

      expect(view.entries).toHaveLength(1);
      expect(view.entries[0].cancelled).toBe(true);
      expect(view.entries[0].movedToDate).toBe('2026-11-17');
      expect(view.entries[0].cancelReason).toContain('2026-11-17');
    });

    it('shows it on the day it moved to, at the new time', () => {
      const view = buildDayView('2026-11-17', input({ overrides: [moved] }));

      expect(view.entries).toHaveLength(1);
      expect(view.entries[0].title).toBe('התעמלות');
      expect(view.entries[0].startTime).toBe('18:00');
      expect(view.entries[0].movedFromDate).toBe(SUNDAY);
      expect(view.entries[0].cancelled).toBe(false);
    });

    it('does not ask for a driver on the day it left', () => {
      expect(buildDayView(SUNDAY, input({ overrides: [moved] })).conflicts).toHaveLength(0);
    });

    it('leaves every other week alone', () => {
      // The following Sunday still runs as the template says.
      const next = buildDayView('2026-11-22', input({ overrides: [moved] }));

      expect(next.entries).toHaveLength(1);
      expect(next.entries[0].cancelled).toBe(false);
      expect(next.entries[0].startTime).toBe('16:00');
    });
  });

  describe('who is around', () => {
    const availability: Availability[] = [
      { id: 'dad', days: { 0: { worksFromHome: true }, 1: { worksFromHome: false, returnTime: '18:30' } } },
      { id: 'mom', days: { 1: { worksFromHome: false, returnTime: '14:30' } } },
    ];

    it('reports only the members with something recorded for that day', () => {
      const view = buildDayView(SUNDAY, { ...input(), availability });

      expect(view.presence).toEqual([{ memberId: 'dad', worksFromHome: true }]);
    });

    it('calls it a home day when someone is at home, whatever the others do', () => {
      expect(buildDayView(SUNDAY, { ...input(), availability }).shape).toBe('home');
    });

    it('takes the earliest return when nobody is home', () => {
      // Monday: 18:30 and 14:30 - the early one settles the afternoon.
      expect(buildDayView('2026-11-16', { ...input(), availability }).shape).toBe('early');
    });

    it('calls it a late day when even the earliest return is late', () => {
      const bothLate: Availability[] = [
        { id: 'dad', days: { 1: { worksFromHome: false, returnTime: '18:30' } } },
        { id: 'mom', days: { 1: { worksFromHome: false, returnTime: '17:45' } } },
      ];
      expect(buildDayView('2026-11-16', { ...input(), availability: bothLate }).shape).toBe('late');
    });

    it('lets one date override the usual week', () => {
      const wfhTuesday: DayWorkOverride[] = [
        { id: '1', date: '2026-11-17', memberId: 'dad', worksFromHome: true },
      ];
      const data = { ...input(), availability, availabilityDays: wfhTuesday };

      // Tuesday has nothing in the pattern; the override puts dad at home.
      expect(buildDayView('2026-11-17', data).presence).toEqual([
        { memberId: 'dad', worksFromHome: true },
      ]);
      expect(buildDayView('2026-11-17', data).shape).toBe('home');
    });

    it('replaces what the pattern says for that date only', () => {
      const lateMonday: DayWorkOverride[] = [
        { id: '2', date: '2026-11-16', memberId: 'mom', worksFromHome: false, returnTime: '19:30' },
      ];
      const data = { ...input(), availability, availabilityDays: lateMonday };

      // Mom's pattern says 14:30 on Mondays; this week she is back at 19:30,
      // which with dad at 18:30 makes it a late day.
      expect(buildDayView('2026-11-16', data).shape).toBe('late');
      // The following Monday is back to the pattern.
      expect(buildDayView('2026-11-23', data).shape).toBe('early');
    });

    it('can say nothing is recorded for a date the pattern covers', () => {
      const cleared: DayWorkOverride[] = [
        { id: '3', date: SUNDAY, memberId: 'dad', worksFromHome: false, cleared: true },
      ];
      const view = buildDayView(SUNDAY, { ...input(), availability, availabilityDays: cleared });

      expect(view.presence).toEqual([]);
      expect(view.shape).toBe('unknown');
    });

    it('says nothing rather than guessing when no one filled it in', () => {
      const view = buildDayView(SUNDAY, input());

      expect(view.presence).toEqual([]);
      expect(view.shape).toBe('unknown');
    });
  });

  describe('chores', () => {
    const daily: ChorePlan = { id: 'c-dish', title: 'לפרוק מדיח', cadence: 'daily' };
    const weekly: ChorePlan = {
      id: 'c-wash',
      title: 'כביסה',
      cadence: 'weekly',
      dayOfWeek: 0,
      assigneeId: 'mom',
    };

    it('brings a daily chore round every day', () => {
      for (const date of [SUNDAY, '2026-11-16', '2026-11-17']) {
        expect(buildDayView(date, input({ chorePlans: [daily] })).chores).toHaveLength(1);
      }
    });

    it('brings a weekly chore only on its day, with its assignee', () => {
      const on = buildDayView(SUNDAY, input({ chorePlans: [weekly] }));
      const off = buildDayView('2026-11-16', input({ chorePlans: [weekly] }));

      expect(on.chores[0].title).toBe('כביסה');
      expect(on.chores[0].assigneeId).toBe('mom');
      expect(off.chores).toHaveLength(0);
    });

    it('leaves a chore unassigned when nobody owns it', () => {
      expect(buildDayView(SUNDAY, input({ chorePlans: [daily] })).chores[0].assigneeId).toBeNull();
    });

    it('marks done for one date only', () => {
      const entries: ChoreEntry[] = [{ id: 'e1', date: SUNDAY, planId: 'c-dish', done: true }];
      const data = input({ chorePlans: [daily], choreEntries: entries });

      expect(buildDayView(SUNDAY, data).chores[0].done).toBe(true);
      expect(buildDayView('2026-11-16', data).chores[0].done).toBe(false);
    });

    it('lets one date rename a chore or hand it to someone else', () => {
      const entries: ChoreEntry[] = [
        { id: 'e2', date: SUNDAY, planId: 'c-wash', title: 'כביסה כהה', assigneeId: 'dad' },
      ];
      const data = input({ chorePlans: [weekly], choreEntries: entries });

      expect(buildDayView(SUNDAY, data).chores[0].title).toBe('כביסה כהה');
      expect(buildDayView(SUNDAY, data).chores[0].assigneeId).toBe('dad');
      // Next week is back to the plan.
      expect(buildDayView('2026-11-22', data).chores[0].title).toBe('כביסה');
    });

    it('distinguishes clearing the assignee from leaving it alone', () => {
      const cleared: ChoreEntry[] = [
        { id: 'e3', date: SUNDAY, planId: 'c-wash', assigneeId: null },
      ];
      const data = input({ chorePlans: [weekly], choreEntries: cleared });

      expect(buildDayView(SUNDAY, data).chores[0].assigneeId).toBeNull();
    });

    it('lets one date drop a repeating chore without touching the plan', () => {
      const entries: ChoreEntry[] = [
        { id: 'e4', date: SUNDAY, planId: 'c-dish', cancelled: true },
      ];
      const data = input({ chorePlans: [daily], choreEntries: entries });

      expect(buildDayView(SUNDAY, data).chores).toHaveLength(0);
      expect(buildDayView('2026-11-16', data).chores).toHaveLength(1);
    });

    it('carries a one-off that has no plan behind it', () => {
      const entries: ChoreEntry[] = [
        { id: 'e5', date: SUNDAY, title: 'לשטוף את הבית', assigneeId: 'dad' },
      ];
      const view = buildDayView(SUNDAY, input({ choreEntries: entries }));

      expect(view.chores).toHaveLength(1);
      expect(view.chores[0].planId).toBeUndefined();
      expect(buildDayView('2026-11-16', input({ choreEntries: entries })).chores).toHaveLength(0);
    });

    it('respects the window a chore plan is active for', () => {
      const ended: ChorePlan = { ...daily, activeUntil: '2026-11-16' };
      const data = input({ chorePlans: [ended] });

      expect(buildDayView(SUNDAY, data).chores).toHaveLength(1);
      expect(buildDayView('2026-11-17', data).chores).toHaveLength(0);
    });
  });

  describe('dinner', () => {
    const weekly: MealPlan = {
      id: 'plan-pasta',
      title: 'פסטה',
      dayOfWeek: 0,
      cadence: 'weekly',
      anchorDate: SUNDAY,
      startCookingAt: '18:00',
    };
    const fortnightly: MealPlan = { ...weekly, id: 'plan-fish', title: 'דגים', cadence: 'fortnightly' };

    it('comes round every week when the plan says weekly', () => {
      for (const date of [SUNDAY, '2026-11-22', '2026-11-29']) {
        expect(buildDayView(date, input({ mealPlans: [weekly] })).meal?.title).toBe('פסטה');
      }
    });

    it('skips every other week when the plan says fortnightly', () => {
      const on = buildDayView(SUNDAY, input({ mealPlans: [fortnightly] }));
      const off = buildDayView('2026-11-22', input({ mealPlans: [fortnightly] }));
      const onAgain = buildDayView('2026-11-29', input({ mealPlans: [fortnightly] }));

      expect(on.meal?.title).toBe('דגים');
      expect(off.meal).toBeUndefined();
      expect(onAgain.meal?.title).toBe('דגים');
    });

    it('holds the fortnightly rhythm backwards as well as forwards', () => {
      // A week before the anchor is an off week.
      expect(buildDayView('2026-11-08', input({ mealPlans: [fortnightly] })).meal).toBeUndefined();
      expect(buildDayView('2026-11-01', input({ mealPlans: [fortnightly] })).meal?.title).toBe('דגים');
    });

    it('stays off the days the plan does not fall on', () => {
      expect(buildDayView('2026-11-16', input({ mealPlans: [weekly] })).meal).toBeUndefined();
    });

    it('lets one date override the plan without disturbing the others', () => {
      const withOverride = input({
        mealPlans: [weekly],
        meals: [{ id: SUNDAY, date: SUNDAY, title: 'פיצה' }],
      });

      expect(buildDayView(SUNDAY, withOverride).meal?.title).toBe('פיצה');
      expect(buildDayView('2026-11-22', withOverride).meal?.title).toBe('פסטה');
    });

    it('lets one date skip the plan entirely', () => {
      const skipped = input({
        mealPlans: [weekly],
        meals: [{ id: SUNDAY, date: SUNDAY, cancelled: true }],
      });

      expect(buildDayView(SUNDAY, skipped).meal).toBeUndefined();
      expect(buildDayView('2026-11-22', skipped).meal?.title).toBe('פסטה');
    });

    it('respects the window a plan is active for', () => {
      const ended: MealPlan = { ...weekly, activeUntil: '2026-11-20' };

      expect(buildDayView(SUNDAY, input({ mealPlans: [ended] })).meal?.title).toBe('פסטה');
      expect(buildDayView('2026-11-22', input({ mealPlans: [ended] })).meal).toBeUndefined();
    });

    it('decides the rhythm by calendar week, not by the day gap', () => {
      // Anchor recorded on the Friday of the same week as SUNDAY. Because the
      // comparison is week to week, a mid-week anchor still lands the plan in
      // that week rather than drifting by the number of days between them.
      const midWeekAnchor: MealPlan = { ...fortnightly, anchorDate: '2026-11-20' };

      expect(buildDayView(SUNDAY, input({ mealPlans: [midWeekAnchor] })).meal?.title).toBe('דגים');
      expect(buildDayView('2026-11-22', input({ mealPlans: [midWeekAnchor] })).meal).toBeUndefined();
      expect(buildDayView('2026-11-29', input({ mealPlans: [midWeekAnchor] })).meal?.title).toBe('דגים');
    });

    it('says where a dinner came from, so an edit can ask about scope', () => {
      const view = buildDayView(SUNDAY, input({ mealPlans: [fortnightly] }));

      expect(view.meal?.planId).toBe('plan-fish');
      expect(view.meal?.cadence).toBe('fortnightly');
    });

    it('leaves a one-off with no plan behind it', () => {
      const view = buildDayView(SUNDAY, input({ meals: [{ id: SUNDAY, date: SUNDAY, title: 'סושי' }] }));

      expect(view.meal?.title).toBe('סושי');
      expect(view.meal?.planId).toBeUndefined();
    });
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

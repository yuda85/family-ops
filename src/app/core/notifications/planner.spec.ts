import { describe, expect, it } from 'vitest';
import { plan, planChanges, type PlannerData } from './planner';
import type { Activity } from '../schedule/schedule.models';

// 2026-11-15 is a plain Sunday with no holiday. Israel is UTC+2 in November.
const SUNDAY = '2026-11-15';

function at(time: string): Date {
  return new Date(`${SUNDAY}T${time}:00+02:00`);
}

const MEMBERS = [
  { id: 'dad', displayName: 'אבא' },
  { id: 'mom', displayName: 'אמא' },
];

const CHILDREN = [
  { id: 'noa', name: 'נועה' },
  { id: 'dan', name: 'דן' },
];

function gym(over: Partial<Activity> = {}): Activity {
  return {
    id: 'gym',
    childId: 'noa',
    title: 'התעמלות',
    daysOfWeek: [0],
    startTime: '16:00',
    endTime: '17:30',
    departureTime: '15:35',
    drivers: { 0: 'dad' },
    prepItems: [],
    ...over,
  };
}

function data(over: Partial<PlannerData> = {}): PlannerData {
  return {
    members: MEMBERS,
    children: CHILDREN,
    activities: [gym()],
    overrides: [],
    meals: [],
    ...over,
  };
}

function keys(now: Date, input = data()): string[] {
  return plan(now, input).map((n) => n.key);
}

describe('plan', () => {
  describe('evening brief', () => {
    it('goes to both parents at 21:00 and describes tomorrow', () => {
      const [brief, ...rest] = plan(at('21:00'), data());

      expect(rest).toHaveLength(0);
      expect(brief.key).toBe(`${SUNDAY}:evening-brief`);
      expect(brief.userIds).toEqual(['dad', 'mom']);
      // Monday has no activities in this fixture.
      expect(brief.body).toBe('מחר פנוי.');
    });

    it('lists tomorrow\'s activity, driver and departure', () => {
      const monday = data({ activities: [gym({ daysOfWeek: [1] })] });
      const [brief] = plan(at('21:00'), monday);

      expect(brief.body).toContain('16:00 התעמלות · נועה');
      expect(brief.body).toContain('יציאה 15:35');
    });

    it('does not fire before its time', () => {
      expect(keys(at('20:00'))).not.toContain(`${SUNDAY}:evening-brief`);
    });

    it('still fires when the trigger is a few minutes late', () => {
      expect(keys(at('21:07'))).toContain(`${SUNDAY}:evening-brief`);
    });

    it('gives up once it is hours stale', () => {
      expect(keys(at('23:30'))).not.toContain(`${SUNDAY}:evening-brief`);
    });
  });

  describe('morning digest', () => {
    it('sends one combined message about the day\'s departures', () => {
      const [digest] = plan(at('07:00'), data());

      expect(digest.key).toBe(`${SUNDAY}:morning-digest`);
      expect(digest.userIds).toEqual(['dad', 'mom']);
      expect(digest.body).toBe('15:35 התעמלות · נועה · אבא');
    });

    it('is skipped on a day with no drives', () => {
      const noDrives = data({ activities: [gym({ departureTime: undefined })] });
      expect(keys(at('07:00'), noDrives)).not.toContain(`${SUNDAY}:morning-digest`);
    });
  });

  describe('departure alerts', () => {
    it('warns the driver two hours out, and nobody else', () => {
      const notes = plan(at('13:35'), data());

      expect(notes).toHaveLength(1);
      expect(notes[0].key).toBe(`${SUNDAY}:departure-2h:gym`);
      expect(notes[0].userIds).toEqual(['dad']);
    });

    it('tells the driver to leave ten minutes out', () => {
      const notes = plan(at('15:25'), data());

      expect(notes[0].key).toBe(`${SUNDAY}:departure-10m:gym`);
      expect(notes[0].title).toBe('צא עכשיו');
      expect(notes[0].userIds).toEqual(['dad']);
    });

    it('drops a leave-now alert that is already too stale to act on', () => {
      expect(keys(at('15:45'))).toHaveLength(0);
    });

    it('says nothing about a drive with no driver', () => {
      const orphan = data({ activities: [gym({ drivers: {} })] });
      expect(keys(at('15:25'), orphan)).toHaveLength(0);
    });

    it('says nothing about a cancelled activity', () => {
      const cancelled = data({
        overrides: [{ id: 'o1', date: SUNDAY, type: 'cancelled', activityId: 'gym' }],
      });
      expect(keys(at('15:25'), cancelled)).toHaveLength(0);
    });

    it('merges two departures close together into one alert', () => {
      const twoDrives = data({
        activities: [
          gym(),
          gym({ id: 'ball', childId: 'dan', title: 'כדורסל', departureTime: '15:50', startTime: '16:15' }),
        ],
      });
      const notes = plan(at('15:25'), twoDrives);

      expect(notes).toHaveLength(1);
      expect(notes[0].body).toContain('התעמלות וכדורסל');
      expect(notes[0].body).toContain('נועה ודן');
    });

    it('keeps distant departures separate', () => {
      const spread = data({
        activities: [
          gym(),
          gym({ id: 'ball', childId: 'dan', title: 'כדורסל', departureTime: '18:00', startTime: '18:30' }),
        ],
      });

      expect(plan(at('15:25'), spread)).toHaveLength(1);
      expect(plan(at('17:50'), spread)).toHaveLength(1);
    });

    it('alerts each driver separately', () => {
      const split = data({
        activities: [
          gym(),
          gym({ id: 'ball', childId: 'dan', title: 'כדורסל', drivers: { 0: 'mom' } }),
        ],
      });
      const notes = plan(at('15:25'), split);

      expect(notes.map((n) => n.userIds).flat().sort()).toEqual(['dad', 'mom']);
    });
  });

  describe('prep alerts', () => {
    it('fires at the offset before the activity', () => {
      const withPrep = data({
        activities: [gym({ prepItems: [{ text: 'לארוז בגדי התעמלות', hoursBefore: 2 }] })],
      });
      const prep = plan(at('14:00'), withPrep).find((n) => n.key === `${SUNDAY}:prep:gym:0`);

      expect(prep).toBeDefined();
      expect(prep!.body).toContain('לארוז בגדי התעמלות');
      expect(prep!.userIds).toEqual(['dad', 'mom']);
    });

    it('reaches back from tomorrow for an evening-before task', () => {
      // Monday 16:00 activity, 20 hours before = Sunday 20:00.
      const evening = data({
        activities: [
          gym({ daysOfWeek: [1], prepItems: [{ text: 'להוציא עוף מהפריזר', hoursBefore: 20 }] }),
        ],
      });
      const notes = plan(at('20:00'), evening);

      expect(notes.map((n) => n.body).join()).toContain('להוציא עוף מהפריזר');
    });
  });
});

describe('planChanges', () => {
  const now = at('18:00');

  it('tells the other parent, not the one who made the change', () => {
    const notes = planChanges(
      now,
      [
        {
          id: 'o9',
          createdAtMs: now.getTime() - 60_000,
          createdBy: 'mom',
          summary: 'אמא ביטלה כדורסל היום',
        },
      ],
      MEMBERS
    );

    expect(notes).toHaveLength(1);
    expect(notes[0].userIds).toEqual(['dad']);
    expect(notes[0].key).toBe('change:o9');
  });

  it('ignores changes older than the catch-up window', () => {
    const stale = planChanges(
      now,
      [{ id: 'o8', createdAtMs: now.getTime() - 60 * 60_000, createdBy: 'mom', summary: 'ישן' }],
      MEMBERS
    );

    expect(stale).toHaveLength(0);
  });
});

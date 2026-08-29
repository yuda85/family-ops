import { describe, expect, it } from 'vitest';
import { activityId, parseSeed, summarise, validate, type Seed } from './seed-schedule';

function seed(over: Partial<Seed> = {}): Seed {
  return {
    children: [{ id: 'noa', name: 'נועה', color: 'coral', order: 0 }],
    activities: [
      {
        childId: 'noa',
        title: 'התעמלות',
        location: 'שמשית',
        daysOfWeek: [0, 3],
        startTime: '16:00',
        endTime: '17:30',
        departureTime: '15:30',
      },
    ],
    ...over,
  };
}

describe('parseSeed', () => {
  it('accepts a well-formed file', () => {
    const { seed: parsed, problems } = parseSeed(JSON.stringify(seed()));

    expect(problems).toEqual([]);
    expect(parsed?.activities).toHaveLength(1);
  });

  it('ignores the commentary keys the file carries', () => {
    const withNotes = { _source: 'a photo', _notes: ['something'], ...seed() };
    expect(parseSeed(JSON.stringify(withNotes)).problems).toEqual([]);
  });

  it('reports malformed JSON rather than throwing', () => {
    const { seed: parsed, problems } = parseSeed('{ not json');

    expect(parsed).toBeNull();
    expect(problems[0]).toContain('JSON');
  });

  it('refuses a file missing the top-level arrays', () => {
    expect(parseSeed('{}').problems).toEqual(['חסרים שדות children ו-activities']);
  });

  it('returns no seed when anything is wrong, so a bad file cannot be written', () => {
    const broken = seed({ children: [{ id: 'noa', name: '??', color: 'coral', order: 0 }] });
    const { seed: parsed, problems } = parseSeed(JSON.stringify(broken));

    expect(parsed).toBeNull();
    expect(problems).toHaveLength(1);
  });
});

describe('validate', () => {
  it('rejects placeholder names left over from transcription', () => {
    const notReady = seed({
      activities: [{ childId: 'noa', title: '??', daysOfWeek: [0], startTime: '16:00' }],
    });
    expect(validate(notReady).join()).toContain('??');
  });

  it('rejects an activity pointing at a child that is not there', () => {
    const orphan = seed({
      activities: [{ childId: 'ghost', title: 'חוג', daysOfWeek: [0], startTime: '16:00' }],
    });
    expect(validate(orphan).join()).toContain('ghost');
  });

  it('rejects a malformed time', () => {
    const bad = seed({
      activities: [{ childId: 'noa', title: 'חוג', daysOfWeek: [0], startTime: '25:00' }],
    });
    expect(validate(bad).join()).toContain('25:00');
  });

  it('rejects a day outside the week', () => {
    const bad = seed({
      activities: [{ childId: 'noa', title: 'חוג', daysOfWeek: [9], startTime: '16:00' }],
    });
    expect(validate(bad).join()).toContain('0-6');
  });

  it('rejects a departure that is not before the start', () => {
    const bad = seed({
      activities: [
        { childId: 'noa', title: 'חוג', daysOfWeek: [0], startTime: '16:00', departureTime: '16:30' },
      ],
    });
    expect(validate(bad).join()).toContain('אינה לפני');
  });

  it('rejects a driver set for a day the activity does not run', () => {
    const bad = seed({
      activities: [
        { childId: 'noa', title: 'חוג', daysOfWeek: [0], startTime: '16:00', drivers: { '4': 'dad' } },
      ],
    });
    expect(validate(bad).join()).toContain('לא מתקיים');
  });

  it('rejects duplicate child ids', () => {
    const dupes = seed({
      children: [
        { id: 'noa', name: 'נועה', color: 'coral', order: 0 },
        { id: 'noa', name: 'אחר', color: 'sky', order: 1 },
      ],
    });
    expect(validate(dupes).join()).toContain('כפול');
  });
});

describe('activityId', () => {
  it('is stable, so re-importing updates instead of duplicating', () => {
    const activity = seed().activities[0];
    expect(activityId(activity)).toBe(activityId({ ...activity, daysOfWeek: [3, 0] }));
  });

  it('separates the same class held at different hours on different days', () => {
    const sunday = { ...seed().activities[0], daysOfWeek: [0] };
    const thursday = { ...seed().activities[0], daysOfWeek: [4] };
    expect(activityId(sunday)).not.toBe(activityId(thursday));
  });
});

describe('summarise', () => {
  it('says so plainly when a child has nothing', () => {
    const withKindergartener = seed({
      children: [
        { id: 'noa', name: 'נועה', color: 'coral', order: 0 },
        { id: 'dan', name: 'דן', color: 'sky', order: 1 },
      ],
    });
    expect(summarise(withKindergartener)[1]).toBe('דן: אין חוגים');
  });
});

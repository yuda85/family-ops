import type { ChildColorKey } from '../family/family.models';
import type { PrepItem, TimeStr } from './schedule.models';

/**
 * Parsing and validation for a bulk schedule import.
 *
 * Pure and shared: the CLI seeder and the in-app import screen both run this,
 * so "valid" means the same thing in both places and cannot drift.
 */

const PLACEHOLDER = '??';
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;

export interface SeedChild {
  /** Stable document id. Lowercase ascii, referenced by activities. */
  id: string;
  name: string;
  color: ChildColorKey;
  order: number;
}

export interface SeedActivity {
  childId: string;
  title: string;
  location?: string;
  daysOfWeek: number[];
  startTime: TimeStr;
  endTime?: TimeStr;
  departureTime?: TimeStr;
  /** Day-of-week to member document id. */
  drivers?: Record<string, string>;
  prepItems?: PrepItem[];
}

export interface Seed {
  children: SeedChild[];
  activities: SeedActivity[];
}

export interface ParseResult {
  seed: Seed | null;
  problems: string[];
}

/**
 * Content-derived id, so importing the same schedule twice updates the same
 * documents instead of leaving duplicates behind. The day set is part of it
 * because a template holds one time, so a class running at different hours on
 * different days is legitimately stored more than once under the same name.
 */
export function activityId(activity: SeedActivity): string {
  const slug = activity.title.trim().replace(/\s+/g, '-');
  const days = [...activity.daysOfWeek].sort((a, b) => a - b).join('');
  return `${activity.childId}-${slug}-${days}`;
}

export function parseSeed(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { seed: null, problems: [`הקובץ אינו JSON תקין: ${(error as Error).message}`] };
  }

  const value = raw as Partial<Seed>;
  if (!Array.isArray(value?.children) || !Array.isArray(value?.activities)) {
    return { seed: null, problems: ['חסרים שדות children ו-activities'] };
  }

  const problems = validate(value as Seed);
  return { seed: problems.length ? null : (value as Seed), problems };
}

export function validate(seed: Seed): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const child of seed.children) {
    const where = `ילד ${child.id ?? '(ללא מזהה)'}`;
    if (!child.id || !ID.test(child.id)) problems.push(`${where}: מזהה חייב להיות אותיות אנגליות קטנות`);
    if (ids.has(child.id)) problems.push(`${where}: מזהה כפול`);
    ids.add(child.id);
    if (!child.name?.trim()) problems.push(`${where}: אין שם`);
    if (child.name?.includes(PLACEHOLDER)) problems.push(`${where}: השם עדיין ${PLACEHOLDER}`);
  }

  for (const [index, activity] of seed.activities.entries()) {
    const where = `חוג ${index + 1} (${activity.title || '?'})`;

    if (!activity.title?.trim()) problems.push(`${where}: אין שם`);
    if (activity.title?.includes(PLACEHOLDER)) problems.push(`${where}: השם עדיין ${PLACEHOLDER}`);
    if (!ids.has(activity.childId)) problems.push(`${where}: ילד לא מוכר "${activity.childId}"`);

    if (!Array.isArray(activity.daysOfWeek) || !activity.daysOfWeek.length) {
      problems.push(`${where}: לא נבחרו ימים`);
    } else if (activity.daysOfWeek.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      problems.push(`${where}: יום מחוץ לטווח 0-6`);
    }

    for (const [label, value] of [
      ['שעת התחלה', activity.startTime],
      ['שעת סיום', activity.endTime],
      ['שעת יציאה', activity.departureTime],
    ] as const) {
      if (label === 'שעת התחלה' && !value) problems.push(`${where}: חסרה שעת התחלה`);
      if (value !== undefined && value !== '' && !TIME.test(value)) {
        problems.push(`${where}: ${label} לא תקינה "${value}"`);
      }
    }

    if (activity.departureTime && activity.startTime && activity.departureTime >= activity.startTime) {
      problems.push(`${where}: שעת היציאה ${activity.departureTime} אינה לפני ההתחלה ${activity.startTime}`);
    }

    for (const day of Object.keys(activity.drivers ?? {})) {
      if (!activity.daysOfWeek?.includes(Number(day))) {
        problems.push(`${where}: משובץ מסיע ליום ${day} שהחוג לא מתקיים בו`);
      }
    }
  }

  return problems;
}

/** One line per child, for a preview before anything is written. */
export function summarise(seed: Seed): string[] {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return seed.children.map((child) => {
    const mine = seed.activities.filter((a) => a.childId === child.id);
    if (!mine.length) return `${child.name}: אין חוגים`;
    const list = mine
      .map((a) => `${a.title} (${[...a.daysOfWeek].sort().map((d) => days[d]).join('/')})`)
      .join(', ');
    return `${child.name}: ${list}`;
  });
}

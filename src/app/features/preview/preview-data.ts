import type { Provider } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { PushService } from '../../core/notifications/push.service';
import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import { buildDayView, type DayInput } from '../../core/schedule/day-builder';
import { addDays, dayOfWeekOf, toDateStr } from '../../core/schedule/date-utils';
import type {
  Activity,
  ChorePlan,
  DateStr,
  Meal,
  MealPlan,
  Override,
} from '../../core/schedule/schedule.models';

/**
 * Development-only sample family. Lets the real screens be checked for layout,
 * contrast and both themes without an account or seeded data.
 */

// Every weekday, so the sample always has something to show.
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    childId: 'c1',
    title: 'צהרון',
    daysOfWeek: EVERY_DAY,
    startTime: '14:00',
    endTime: '16:00',
    drivers: {},
    prepItems: [],
  },
  {
    id: 'a2',
    childId: 'c2',
    title: 'התעמלות',
    daysOfWeek: EVERY_DAY,
    startTime: '16:00',
    endTime: '17:30',
    departureTime: '15:35',
    drivers: Object.fromEntries(EVERY_DAY.map((d) => [d, 'm1'])),
    prepItems: [{ text: 'לארוז בגדי התעמלות', hoursBefore: 12 }],
  },
  {
    id: 'a3',
    childId: 'c3',
    title: 'כדורסל',
    daysOfWeek: EVERY_DAY,
    startTime: '17:30',
    endTime: '19:00',
    departureTime: '17:05',
    drivers: {},
    prepItems: [],
  },
  {
    id: 'a4',
    childId: 'c4',
    title: 'חוג מוזיקה',
    daysOfWeek: EVERY_DAY,
    startTime: '18:00',
    endTime: '19:00',
    departureTime: '17:40',
    drivers: Object.fromEntries(EVERY_DAY.map((d) => [d, 'm2'])),
    prepItems: [],
  },
];

const CHILDREN = [
  { id: 'c1', name: 'יעל', color: 'coral', order: 0 },
  { id: 'c2', name: 'נועה', color: 'sky', order: 1 },
  { id: 'c3', name: 'דן', color: 'green', order: 2 },
  { id: 'c4', name: 'איתי', color: 'violet', order: 3 },
];

const MEMBERS = [
  { id: 'm1', displayName: 'אבא' },
  { id: 'm2', displayName: 'אמא' },
];

function sampleInput(): DayInput {
  const today = toDateStr(new Date());
  const overrides: Override[] = [
    { id: 'o1', date: today, type: 'cancelled', activityId: 'a4', reason: 'המורה חולה' },
  ];
  const meals: Meal[] = [
    { id: today, date: today, title: 'שניצל ופירה', startCookingAt: '18:00' },
  ];
  const mealPlans: MealPlan[] = [
    {
      id: 'plan-pasta',
      title: 'פסטה',
      dayOfWeek: (dayOfWeekOf(today) + 1) % 7,
      cadence: 'weekly',
      anchorDate: addDays(today, 1),
      startCookingAt: '18:30',
    },
    {
      id: 'plan-fish',
      title: 'דגים',
      dayOfWeek: (dayOfWeekOf(today) + 2) % 7,
      cadence: 'fortnightly',
      anchorDate: addDays(today, 2),
      startCookingAt: '18:00',
    },
  ];
  return {
    activities: ACTIVITIES,
    overrides,
    meals,
    mealPlans,
    availability: AVAILABILITY,
    chorePlans: CHORE_PLANS,
    choreEntries: [{ id: 'ce1', date: today, planId: 'c1', done: true }],
  };
}

const AVAILABILITY = [
  { id: 'm1', days: { 0: { worksFromHome: true }, 1: { worksFromHome: false, returnTime: '18:30' } } },
  { id: 'm2', days: { 0: { worksFromHome: false, returnTime: '16:00' }, 1: { worksFromHome: false, returnTime: '19:00' } } },
];

const CHORE_PLANS: ChorePlan[] = [
  { id: 'c1', title: 'לפרוק מדיח', cadence: 'daily' },
  { id: 'c2', title: 'לסדר סלון', cadence: 'daily', assigneeId: 'm2' },
  { id: 'c3', title: 'כביסה', cadence: 'weekly', dayOfWeek: 0, assigneeId: 'm1' },
];

export const PREVIEW_PROVIDERS: Provider[] = [
  {
    provide: ScheduleService,
    useValue: {
      dayView: (date: DateStr) => buildDayView(date, sampleInput()),
      weekView: (from: DateStr) =>
        Array.from({ length: 7 }, (_, i) => buildDayView(addDays(from, i), sampleInput())),
      activities: () => ACTIVITIES,
      availability: () => AVAILABILITY,
      setAvailability: async () => undefined,
      availabilityDays: () => [],
      setDayWork: async () => undefined,
      createActivity: async () => 'preview',
      updateActivity: async () => undefined,
      deleteActivity: async () => undefined,
      setDriver: async () => undefined,
      setCancelled: async () => undefined,
      setMeal: async () => undefined,
      deleteMeal: async () => undefined,
      skipMeal: async () => undefined,
      chorePlans: () => CHORE_PLANS,
      setChoreDone: async () => undefined,
      createChore: async () => 'preview',
      updateChoreEntry: async () => undefined,
      overrideChore: async () => undefined,
      deleteChoreEntry: async () => undefined,
      createChorePlan: async () => 'preview',
      updateChorePlan: async () => undefined,
      deleteChorePlan: async () => undefined,
      createMealPlan: async () => 'preview',
      updateMealPlan: async () => undefined,
      deleteMealPlan: async () => undefined,
      createOverride: async () => 'preview',
    },
  },
  {
    provide: FamilyService,
    useValue: {
      children: () => CHILDREN,
      sortedChildren: () => CHILDREN,
      members: () => MEMBERS,
      familyId: () => 'preview',
      familyName: () => 'משפחת דוגמה',
    },
  },
  {
    provide: PushService,
    useValue: { state: () => 'idle', error: () => null, enable: async () => undefined },
  },
  {
    provide: AuthService,
    useValue: { user: () => ({ id: 'm1', displayName: 'אבא' }), logout: async () => undefined },
  },
];

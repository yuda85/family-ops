/**
 * Schedule domain model.
 *
 * Three stored entities: Activity (the recurring template), Override (any
 * deviation on a specific date), Meal (dinner for a date). Everything the UI
 * and the notification sender display is derived from these at read time by
 * `buildDayView` - nothing is precomputed and stored, so nothing can drift.
 */

/** "HH:mm", 24h, Asia/Jerusalem local wall time. */
export type TimeStr = string;

/** "YYYY-MM-DD" */
export type DateStr = string;

/** A thing to do ahead of an activity, offset back from its start time. */
export interface PrepItem {
  text: string;
  hoursBefore: number;
}

/**
 * A recurring commitment. One row of the paper schedule.
 * `drivers` maps day-of-week (0=Sunday) to the member responsible that day,
 * because the same activity often has a different driver on different days.
 */
export interface Activity {
  id: string;
  childId: string;
  title: string;
  /** Where it happens. Answers "drive to where?" at a glance. */
  location?: string;
  daysOfWeek: number[];
  startTime: TimeStr;
  endTime?: TimeStr;
  /** When someone has to leave to make it. Source of the departure alerts. */
  departureTime?: TimeStr;
  drivers: Record<number, string>;
  prepItems: PrepItem[];
  activeFrom?: DateStr;
  activeUntil?: DateStr;
  createdBy?: string;
}

export type OverrideType = 'cancelled' | 'moved' | 'added' | 'driverChanged';

/**
 * The only mechanism for changing a specific day. Never edit an Activity to
 * express "this week is different" - that would rewrite history and break
 * every other week.
 */
export interface Override {
  id: string;
  date: DateStr;
  type: OverrideType;
  /** Required for every type except 'added'. */
  activityId?: string;
  reason?: string;

  // Patch fields, applied by type.
  childId?: string;
  title?: string;
  location?: string;
  /**
   * Relocates this occurrence to another date. The original date keeps a
   * struck-through entry saying where it went - a moved lesson that vanishes
   * from the day you were looking at is how it gets missed.
   */
  movedToDate?: DateStr;
  startTime?: TimeStr;
  endTime?: TimeStr;
  departureTime?: TimeStr;
  /** null explicitly clears the driver. */
  driverId?: string | null;
  prepItems?: PrepItem[];

  createdBy?: string;
}

/**
 * A parent's working pattern for one weekday: at home, or back at a time.
 * Absence of an entry means nobody said, which is shown as nothing rather
 * than guessed.
 */
export interface DayWork {
  worksFromHome: boolean;
  returnTime?: TimeStr;
}

/** One document per member, holding their usual week. */
export interface Availability {
  /** Member document id. */
  id: string;
  days: Record<number, DayWork>;
}

/**
 * One member's working arrangement for one specific date, overriding their
 * usual week. Weeks deviate from the pattern constantly - working from home
 * on a Tuesday instead of a Monday, or being needed in the office - and the
 * pattern should not have to be rewritten for a single week.
 */
export interface DayWorkOverride extends DayWork {
  /** `${date}_${memberId}` */
  id: string;
  date: DateStr;
  memberId: string;
  /** Nothing recorded this date, whatever the usual week says. */
  cleared?: boolean;
}

/** How often a dinner comes round. */
export type Cadence = 'weekly' | 'fortnightly';

/**
 * A dinner that repeats. `anchorDate` is any date the plan actually runs; for
 * a fortnightly plan it is what decides which of the two weeks it lands on.
 */
export interface MealPlan {
  id: string;
  title: string;
  dayOfWeek: number;
  cadence: Cadence;
  anchorDate: DateStr;
  startCookingAt?: TimeStr;
  activeFrom?: DateStr;
  activeUntil?: DateStr;
  createdBy?: string;
}

/**
 * One date's dinner. Either a one-off, or a change to what the plan says for
 * that date - the same template-and-override shape the activities use.
 */
export interface Meal {
  id: string;
  date: DateStr;
  title?: string;
  startCookingAt?: TimeStr;
  /** Nothing planned this week, despite the plan. */
  cancelled?: boolean;
  createdBy?: string;
}

// ============================================
// Derived view models (never stored)
// ============================================

export interface HolidayInfo {
  /** Hebrew name, e.g. "פסח". */
  name: string;
  isYomTov: boolean;
  isCholHamoed: boolean;
  isErev: boolean;
  /** True when schools and activities do not run. */
  cancelsSchool: boolean;
}

export interface DayEntry {
  /** Stable across renders: activity id, or override id for one-off events. */
  id: string;
  activityId?: string;
  overrideId?: string;
  childId: string;
  title: string;
  location?: string;
  startTime: TimeStr;
  endTime?: TimeStr;
  departureTime?: TimeStr;
  /** null = nobody assigned. */
  driverId: string | null;
  /** A cancelled entry stays visible - hiding it is how things get missed. */
  cancelled: boolean;
  cancelReason?: string;
  /** Set when an override moved the time, so the UI can show the change. */
  movedFrom?: { startTime: TimeStr; endTime?: TimeStr };
  /** This occurrence was sent to another date. */
  movedToDate?: DateStr;
  /** This occurrence arrived from another date. */
  movedFromDate?: DateStr;
  prepItems: PrepItem[];
}

export type ConflictKind = 'noDriver' | 'driverDoubleBooked';

export interface Conflict {
  kind: ConflictKind;
  entryIds: string[];
  driverId?: string;
  message: string;
}

/** How often a chore comes round. */
export type ChoreCadence = 'daily' | 'weekly';

/** A household chore that repeats. */
export interface ChorePlan {
  id: string;
  title: string;
  cadence: ChoreCadence;
  /** Weekly plans only. */
  dayOfWeek?: number;
  /** Optional - plenty of chores belong to whoever gets there first. */
  assigneeId?: string;
  activeFrom?: DateStr;
  activeUntil?: DateStr;
  createdBy?: string;
}

/**
 * One date's state for a chore: a one-off, or a change to what the plan says
 * - including whether it has been done, which only ever applies to one day.
 */
export interface ChoreEntry {
  id: string;
  date: DateStr;
  /** Set when this overrides a repeating plan. */
  planId?: string;
  title?: string;
  assigneeId?: string | null;
  done?: boolean;
  cancelled?: boolean;
  createdBy?: string;
}

/** A chore for a date, once plan and override have been combined. */
export interface DayChore {
  /** Stable for tracking: the plan id, or the one-off's own id. */
  id: string;
  title: string;
  assigneeId: string | null;
  done: boolean;
  planId?: string;
  cadence?: ChoreCadence;
  /** The per-date document, when one exists. */
  entryId?: string;
}

/** The dinner for a date, once plan and override have been combined. */
export interface DayMeal {
  title: string;
  startCookingAt?: TimeStr;
  /** Set when it comes from a repeating plan rather than a one-off. */
  planId?: string;
  cadence?: Cadence;
}

export interface MemberPresence extends DayWork {
  memberId: string;
}

/**
 * What kind of day this is for the parents. Drives one small marker - the
 * point is to see at a glance whether anyone is around.
 */
export type DayShape = 'home' | 'early' | 'late' | 'mid' | 'unknown';

export interface DayView {
  date: DateStr;
  /** 0=Sunday */
  dayOfWeek: number;
  holiday?: HolidayInfo;
  /** Sorted by start time. Cancelled entries included. */
  entries: DayEntry[];
  meal?: DayMeal;
  chores: DayChore[];
  conflicts: Conflict[];
  /** Only members who have something recorded for this weekday. */
  presence: MemberPresence[];
  shape: DayShape;
}

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

/** One document per member, holding their week. */
export interface Availability {
  /** Member document id. */
  id: string;
  days: Record<number, DayWork>;
}

export interface Meal {
  id: string;
  date: DateStr;
  title: string;
  startCookingAt?: TimeStr;
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
  prepItems: PrepItem[];
}

export type ConflictKind = 'noDriver' | 'driverDoubleBooked';

export interface Conflict {
  kind: ConflictKind;
  entryIds: string[];
  driverId?: string;
  message: string;
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
  meal?: Meal;
  conflicts: Conflict[];
  /** Only members who have something recorded for this weekday. */
  presence: MemberPresence[];
  shape: DayShape;
}

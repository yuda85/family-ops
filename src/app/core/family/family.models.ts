import { Timestamp } from 'firebase/firestore';
import { FamilyRole } from '../auth/auth.models';

/**
 * Week start day options
 */
export type WeekStartDay = 'sunday' | 'monday';

/**
 * Family settings stored in Firestore
 */
export interface FamilySettings {
  weekStartDay: WeekStartDay;
}

/**
 * Default family settings
 */
export const DEFAULT_FAMILY_SETTINGS: FamilySettings = {
  weekStartDay: 'sunday',
};

/**
 * Family document stored in Firestore
 */
export interface FamilyDocument {
  id: string;
  name: string;
  ownerUserId: string;
  settings?: FamilySettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Family member document (subcollection under family)
 */
export interface FamilyMember {
  id: string; // Same as userId
  displayName: string;
  email: string;
  photoURL?: string;
  role: FamilyRole;
  joinedAt: Timestamp;
  invitedBy: string;
}

/**
 * Child document (subcollection under family)
 */
export interface FamilyChild {
  id: string;
  name: string;
  color: string; // Hex color for visual identification
  birthYear?: number;
  order: number;
  createdAt: Timestamp;
  createdBy: string;
}

/**
 * Invite document
 */
export interface FamilyInvite {
  id: string;
  familyId: string;
  familyName: string;
  role: Exclude<FamilyRole, 'owner'>; // Can't invite as owner
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedBy?: string;
  usedAt?: Timestamp;
}

/**
 * Data for creating a new family
 */
export interface CreateFamilyData {
  name: string;
}

/**
 * Data for creating a child
 */
export interface CreateChildData {
  name: string;
  color?: string;
  birthYear?: number;
}

/**
 * Data for creating an invite
 */
export interface CreateInviteData {
  familyId: string;
  familyName: string;
  role: Exclude<FamilyRole, 'owner'>;
  expiresInDays?: number; // Default 7 days
}

/**
 * Event categories
 */
export type EventCategory =
  | 'school'
  | 'activity'
  | 'family'
  | 'general'
  | 'vacation'
  | 'car'
  | 'health'
  | 'other';

/**
 * Event category metadata
 */
export interface CategoryMeta {
  id: EventCategory;
  labelHe: string;
  icon: string;
  color: string;
}

/**
 * All event categories with their metadata
 */
export const EVENT_CATEGORIES: CategoryMeta[] = [
  { id: 'school', labelHe: 'בית ספר', icon: 'school', color: '#5c7cfa' },
  { id: 'activity', labelHe: 'חוג', icon: 'sports_soccer', color: '#ff922b' },
  { id: 'family', labelHe: 'משפחה', icon: 'family_restroom', color: '#c4704f' },
  { id: 'general', labelHe: 'כללי', icon: 'event', color: '#868e96' },
  { id: 'vacation', labelHe: 'חופשה', icon: 'beach_access', color: '#20c997' },
  { id: 'car', labelHe: 'רכב', icon: 'directions_car', color: '#845ef7' },
  { id: 'health', labelHe: 'בריאות', icon: 'medical_services', color: '#e64980' },
  { id: 'other', labelHe: 'אחר', icon: 'more_horiz', color: '#b5a795' },
];

/**
 * Get category metadata by ID
 */
export function getCategoryMeta(categoryId: EventCategory): CategoryMeta {
  return EVENT_CATEGORIES.find((c) => c.id === categoryId) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];
}

/**
 * Default child colors for visual identification
 */
export const CHILD_COLORS = [
  '#e07a5f', // Coral
  '#81b1cb', // Sky blue
  '#87a878', // Sage green
  '#a89cc8', // Lavender
  '#f4a261', // Orange
  '#e9c46a', // Yellow
  '#2a9d8f', // Teal
  '#e76f51', // Red-orange
];

/**
 * Get next available child color
 */
export function getNextChildColor(usedColors: string[]): string {
  const available = CHILD_COLORS.filter((c) => !usedColors.includes(c));
  return available.length > 0 ? available[0] : CHILD_COLORS[0];
}

/**
 * Recurrence configuration for repeating events
 */
export interface EventRecurrence {
  daysOfWeek: number[];  // 0=Sunday, 6=Saturday
  endDate: Timestamp;    // When the recurrence ends
}

/**
 * Calendar event document stored in Firestore
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  category: EventCategory;
  isFamilyEvent: boolean;
  start: Timestamp;
  end: Timestamp;
  isAllDay: boolean;
  childrenIds: string[];
  needsRide: boolean;
  driverUserId?: string;
  recurrence?: EventRecurrence;  // If set, this event repeats
  defaultDrivers?: Record<number, string>;  // Per-day-of-week default drivers (0=Sun -> userId)
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * A virtual instance of a recurring event (not stored in Firestore)
 */
export interface CalendarEventInstance {
  event: CalendarEvent;
  instanceDate: Date;  // The specific date this instance occurs on
  instanceStart: Date;
  instanceEnd: Date;
}

/**
 * Data for creating a new event
 */
export interface CreateEventData {
  title: string;
  description?: string;
  location?: string;
  category: EventCategory;
  start: Date;
  end: Date;
  isAllDay: boolean;
  childrenIds: string[];
  needsRide: boolean;
  recurrence?: {
    daysOfWeek: number[];
    endDate: Date;
  };
}

/**
 * Data for updating an existing event
 */
export interface UpdateEventData {
  title?: string;
  description?: string;
  location?: string;
  category?: EventCategory;
  start?: Date;
  end?: Date;
  isAllDay?: boolean;
  childrenIds?: string[];
  needsRide?: boolean;
  driverUserId?: string;
  defaultDrivers?: Record<number, string>;
}

// ============================================
// Transportation Task Models
// ============================================

/**
 * Transportation task status
 */
export type TransportationTaskStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Transportation task document stored in Firestore
 * Either auto-generated from calendar events or standalone
 */
export interface TransportationTask {
  id: string;
  eventId: string | null;             // null for standalone tasks
  dateKey: string;                    // "2025-01-15" for querying
  date: Timestamp;

  // Driver assignment
  driverUserId: string | null;        // null = unassigned
  driverAssignedBy?: string;
  driverAssignedAt?: Timestamp;

  // Status
  status: TransportationTaskStatus;
  completedAt?: Timestamp;
  completedBy?: string;
  notes?: string;

  // Task details (from event OR user-entered for standalone)
  title: string;
  category: EventCategory;
  startTime: Timestamp;               // Time of day
  endTime?: Timestamp;
  childrenIds: string[];
  location?: string;

  // For standalone tasks
  isStandalone: boolean;              // true if not from event

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * View model for transportation task display
 */
export interface TransportationTaskView {
  task: TransportationTask;
  event: CalendarEvent | null;
  children: FamilyChild[];
  driver: FamilyMember | null;
  isCurrentUserDriver: boolean;
}

/**
 * View model for a day in the transportation planner
 */
export interface TransportationDayView {
  date: Date;
  dateKey: string;
  dateLabel: string;
  dayName: string;
  isToday: boolean;
  isTomorrow: boolean;
  dayOfWeek: number;
  tasks: TransportationTaskView[];
  totalTasks: number;
  assignedTasks: number;
  unassignedTasks: number;
}

/**
 * Dashboard view for "My Duties Today"
 */
export interface MyDutiesTodayView {
  date: Date;
  dateKey: string;
  myTasks: TransportationTaskView[];
  totalDuties: number;
}

/**
 * Data for creating a standalone transportation task
 */
export interface CreateTransportationTaskData {
  title: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  category: EventCategory;
  childrenIds: string[];
  location?: string;
  driverUserId?: string;
  notes?: string;
}

/**
 * Data for updating a transportation task
 */
export interface UpdateTransportationTaskData {
  driverUserId?: string | null;
  status?: TransportationTaskStatus;
  notes?: string;
  title?: string;
  startTime?: Date;
  endTime?: Date;
  childrenIds?: string[];
  location?: string;
}

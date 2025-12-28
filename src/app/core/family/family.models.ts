import { Timestamp } from 'firebase/firestore';
import { FamilyRole } from '../auth/auth.models';

/**
 * Family document stored in Firestore
 */
export interface FamilyDocument {
  id: string;
  name: string;
  ownerUserId: string;
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

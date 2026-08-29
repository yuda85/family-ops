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
  /** Palette key, resolved via `var(--child-<key>)`. */
  color: ChildColorKey;
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
  color?: ChildColorKey;
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
 * Child colours are stored as palette keys, not hex, so each theme can supply
 * a value with enough contrast against its own background. Resolve with
 * `var(--child-<key>)`.
 */
export type ChildColorKey =
  | 'coral'
  | 'sky'
  | 'green'
  | 'violet'
  | 'amber'
  | 'teal'
  | 'rose'
  | 'indigo';

export const CHILD_COLOR_KEYS: ChildColorKey[] = [
  'coral',
  'sky',
  'green',
  'violet',
  'amber',
  'teal',
  'rose',
  'indigo',
];

/** CSS custom property holding the themed value for a child's colour. */
export function childColorVar(key: string): string {
  return `var(--child-${key})`;
}

/**
 * Get next available child colour
 */
export function getNextChildColor(usedColors: string[]): ChildColorKey {
  const available = CHILD_COLOR_KEYS.filter((c) => !usedColors.includes(c));
  return available.length > 0 ? available[0] : CHILD_COLOR_KEYS[0];
}

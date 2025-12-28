import { Timestamp } from 'firebase/firestore';

/**
 * User roles within a family
 */
export type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Theme preference
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * User preferences stored in Firestore
 */
export interface UserPreferences {
  theme: ThemePreference;
  language: 'he' | 'en';
  notifications: boolean;
}

/**
 * Family membership info stored on user document
 */
export interface FamilyMembership {
  familyId: string;
  role: FamilyRole;
  joinedAt: Timestamp;
}

/**
 * User document stored in Firestore
 */
export interface UserDocument {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  familyMemberships: Record<string, FamilyRole>;
  activeFamilyId?: string;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * User data for creating a new user
 */
export interface CreateUserData {
  displayName: string;
  email: string;
  photoURL?: string;
}

/**
 * Auth state for the application
 */
export interface AuthState {
  user: UserDocument | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'he',
  notifications: true,
};

/**
 * Role permissions helper
 */
export const ROLE_PERMISSIONS = {
  owner: {
    canManageFamily: true,
    canManageMembers: true,
    canCreateInvites: true,
    canEditEvents: true,
    canEditShopping: true,
    canViewAll: true,
    canDeleteFamily: true,
  },
  admin: {
    canManageFamily: true,
    canManageMembers: true,
    canCreateInvites: true,
    canEditEvents: true,
    canEditShopping: true,
    canViewAll: true,
    canDeleteFamily: false,
  },
  member: {
    canManageFamily: false,
    canManageMembers: false,
    canCreateInvites: false,
    canEditEvents: true,
    canEditShopping: true,
    canViewAll: true,
    canDeleteFamily: false,
  },
  viewer: {
    canManageFamily: false,
    canManageMembers: false,
    canCreateInvites: false,
    canEditEvents: false,
    canEditShopping: false,
    canViewAll: true,
    canDeleteFamily: false,
  },
} as const;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: FamilyRole,
  permission: keyof (typeof ROLE_PERMISSIONS)['owner']
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

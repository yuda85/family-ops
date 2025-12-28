import { Injectable, signal, computed } from '@angular/core';
import {
  User,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  signInWithRedirect,
} from 'firebase/auth';
import { getFirebaseAuth } from '../firebase/firebase.config';
import { FirestoreService } from '../firebase/firestore.service';
import {
  UserDocument,
  DEFAULT_USER_PREFERENCES,
  FamilyRole,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getFirebaseAuth();
  private googleProvider = new GoogleAuthProvider();

  // Signals for reactive state
  private _firebaseUser = signal<User | null>(null);
  private _userDocument = signal<UserDocument | null>(null);
  private _isLoading = signal(true);
  private _error = signal<string | null>(null);

  // Public computed signals
  readonly firebaseUser = this._firebaseUser.asReadonly();
  readonly user = this._userDocument.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => !!this._firebaseUser());
  readonly userId = computed(() => this._firebaseUser()?.uid ?? null);
  readonly userEmail = computed(() => this._firebaseUser()?.email ?? null);
  readonly displayName = computed(
    () => this._userDocument()?.displayName ?? this._firebaseUser()?.displayName ?? null
  );
  readonly photoURL = computed(
    () => this._userDocument()?.photoURL ?? this._firebaseUser()?.photoURL ?? null
  );
  readonly activeFamilyId = computed(() => this._userDocument()?.activeFamilyId ?? null);

  constructor(private firestoreService: FirestoreService) {
    // Configure Google provider for Hebrew
    this.googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    // Listen to auth state changes
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      this._firebaseUser.set(firebaseUser);

      if (firebaseUser) {
        await this.loadUserDocument(firebaseUser.uid);
      } else {
        this._userDocument.set(null);
      }

      this._isLoading.set(false);
    });
  }

  /**
   * Load user document from Firestore
   */
  private async loadUserDocument(uid: string): Promise<void> {
    try {
      const userDoc = await this.firestoreService.getDocument<UserDocument>(`users/${uid}`);
      this._userDocument.set(userDoc);
    } catch (error: any) {
      // If offline or permission error, don't block - user can still proceed
      console.warn('Could not load user document:', error.message);
      // Don't set error - let the user proceed with Firebase Auth data
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const user = result.user;

      // Try to create/update user document in Firestore (don't await - do in background)
      this.ensureUserDocument(user).catch((err) => {
        console.warn('Background user document creation failed:', err.message);
      });

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Ensure user document exists in Firestore (runs in background)
   */
  private async ensureUserDocument(user: User): Promise<void> {
    try {
      const existingDoc = await this.firestoreService.getDocument<UserDocument>(`users/${user.uid}`);

      if (!existingDoc) {
        const userDoc: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'> = {
          displayName: user.displayName || 'משתמש',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          familyMemberships: {},
          preferences: DEFAULT_USER_PREFERENCES,
        };

        await this.firestoreService.setDocument(`users/${user.uid}`, {
          ...userDoc,
          createdAt: this.firestoreService.getServerTimestamp(),
        });
      }

      await this.loadUserDocument(user.uid);
    } catch (error: any) {
      console.warn('Firestore operations failed:', error.message);
    }
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await signOut(this.auth);
      this._userDocument.set(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update user profile in Firestore
   */
  async updateProfile(data: Partial<Pick<UserDocument, 'displayName' | 'photoURL' | 'preferences'>>): Promise<void> {
    const uid = this.userId();
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      await this.firestoreService.updateDocument(`users/${uid}`, data);

      // Reload user document
      await this.loadUserDocument(uid);
    } catch (error: any) {
      console.error('Update profile error:', error);
      this._error.set('שגיאה בעדכון הפרופיל');
      throw error;
    }
  }

  /**
   * Set the active family for the user
   */
  async setActiveFamily(familyId: string): Promise<void> {
    const uid = this.userId();
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      await this.firestoreService.updateDocument(`users/${uid}`, {
        activeFamilyId: familyId,
      });
      await this.loadUserDocument(uid);
    } catch (error: any) {
      console.error('Set active family error:', error);
      throw error;
    }
  }

  /**
   * Add family membership to user document
   */
  async addFamilyMembership(familyId: string, role: FamilyRole): Promise<void> {
    const uid = this.userId();
    const userDoc = this._userDocument();
    if (!uid || !userDoc) {
      throw new Error('No authenticated user');
    }

    try {
      const updatedMemberships = {
        ...userDoc.familyMemberships,
        [familyId]: role,
      };

      await this.firestoreService.updateDocument(`users/${uid}`, {
        familyMemberships: updatedMemberships,
        // Set as active if it's the first family
        ...(Object.keys(userDoc.familyMemberships).length === 0 ? { activeFamilyId: familyId } : {}),
      });

      await this.loadUserDocument(uid);
    } catch (error: any) {
      console.error('Add family membership error:', error);
      throw error;
    }
  }

  /**
   * Remove family membership from user document
   */
  async removeFamilyMembership(familyId: string): Promise<void> {
    const uid = this.userId();
    const userDoc = this._userDocument();
    if (!uid || !userDoc) {
      throw new Error('No authenticated user');
    }

    try {
      const { [familyId]: removed, ...remainingMemberships } = userDoc.familyMemberships;

      // If removing active family, set first remaining family as active
      let newActiveFamilyId = userDoc.activeFamilyId;
      if (userDoc.activeFamilyId === familyId) {
        const remainingIds = Object.keys(remainingMemberships);
        newActiveFamilyId = remainingIds.length > 0 ? remainingIds[0] : undefined;
      }

      await this.firestoreService.updateDocument(`users/${uid}`, {
        familyMemberships: remainingMemberships,
        activeFamilyId: newActiveFamilyId ?? null,
      });

      await this.loadUserDocument(uid);
    } catch (error: any) {
      console.error('Remove family membership error:', error);
      throw error;
    }
  }

  /**
   * Get the user's role in a specific family
   */
  getFamilyRole(familyId: string): FamilyRole | null {
    const userDoc = this._userDocument();
    if (!userDoc) return null;
    return userDoc.familyMemberships[familyId] ?? null;
  }

  /**
   * Check if user is member of a family
   */
  isFamilyMember(familyId: string): boolean {
    return this.getFamilyRole(familyId) !== null;
  }

  /**
   * Clear any error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Convert Firebase error codes to Hebrew messages
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/popup-closed-by-user': 'החלון נסגר לפני השלמת ההתחברות',
      'auth/popup-blocked': 'החלון נחסם. אנא אפשר חלונות קופצים',
      'auth/cancelled-popup-request': 'בקשת ההתחברות בוטלה',
      'auth/account-exists-with-different-credential': 'קיים חשבון עם אימייל זה בשיטת התחברות אחרת',
      'auth/network-request-failed': 'שגיאת רשת. בדוק את החיבור לאינטרנט',
      'auth/too-many-requests': 'יותר מדי ניסיונות. נסה שוב מאוחר יותר',
      'auth/user-disabled': 'המשתמש הושבת',
    };

    return errorMessages[errorCode] ?? 'אירעה שגיאה. נסה שוב';
  }
}

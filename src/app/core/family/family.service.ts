import { Injectable, signal, computed } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService, where, orderBy } from '../firebase/firestore.service';
import { AuthService } from '../auth/auth.service';
import { FamilyRole, hasPermission } from '../auth/auth.models';
import {
  FamilyDocument,
  FamilyMember,
  FamilyChild,
  FamilyInvite,
  CreateFamilyData,
  CreateChildData,
  CreateInviteData,
  getNextChildColor,
} from './family.models';

@Injectable({
  providedIn: 'root',
})
export class FamilyService {
  // Signals
  private _currentFamily = signal<FamilyDocument | null>(null);
  private _members = signal<FamilyMember[]>([]);
  private _children = signal<FamilyChild[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readable signals
  readonly currentFamily = this._currentFamily.asReadonly();
  readonly members = this._members.asReadonly();
  readonly children = this._children.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly familyId = computed(() => this._currentFamily()?.id ?? null);
  readonly familyName = computed(() => this._currentFamily()?.name ?? null);
  readonly currentUserRole = computed(() => {
    const familyId = this.familyId();
    if (!familyId) return null;
    return this.authService.getFamilyRole(familyId);
  });

  readonly isOwner = computed(() => this.currentUserRole() === 'owner');
  readonly isAdmin = computed(() => {
    const role = this.currentUserRole();
    return role === 'owner' || role === 'admin';
  });
  readonly canEdit = computed(() => {
    const role = this.currentUserRole();
    return role === 'owner' || role === 'admin' || role === 'member';
  });

  readonly sortedChildren = computed(() => {
    return [...this._children()].sort((a, b) => a.order - b.order);
  });

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {}

  /**
   * Load a family by ID and set it as current
   */
  async loadFamily(familyId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Load family document
      const family = await this.firestoreService.getDocument<FamilyDocument>(
        `families/${familyId}`
      );

      if (!family) {
        throw new Error('משפחה לא נמצאה');
      }

      this._currentFamily.set(family);

      // Load members and children in parallel
      await Promise.all([
        this.loadMembers(familyId),
        this.loadChildren(familyId),
      ]);
    } catch (error: any) {
      console.error('Error loading family:', error);
      this._error.set(error.message || 'שגיאה בטעינת המשפחה');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load family members
   */
  private async loadMembers(familyId: string): Promise<void> {
    const members = await this.firestoreService.getCollection<FamilyMember>(
      `families/${familyId}/members`
    );
    this._members.set(members);
  }

  /**
   * Load family children
   */
  private async loadChildren(familyId: string): Promise<void> {
    const children = await this.firestoreService.getCollection<FamilyChild>(
      `families/${familyId}/children`,
      orderBy('order', 'asc')
    );
    this._children.set(children);
  }

  /**
   * Create a new family
   */
  async createFamily(data: CreateFamilyData): Promise<string> {
    const userId = this.authService.userId();
    const user = this.authService.user();

    if (!userId || !user) {
      throw new Error('משתמש לא מחובר');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Create family document
      const familyId = await this.firestoreService.createDocument('families', {
        name: data.name,
        ownerUserId: userId,
      });

      // Add creator as owner member
      await this.firestoreService.setDocument(
        `families/${familyId}/members/${userId}`,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'owner' as FamilyRole,
          joinedAt: this.firestoreService.getServerTimestamp(),
          invitedBy: userId,
        }
      );

      // Add family to user's memberships
      await this.authService.addFamilyMembership(familyId, 'owner');

      return familyId;
    } catch (error: any) {
      console.error('Error creating family:', error);
      this._error.set('שגיאה ביצירת המשפחה');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update family details
   */
  async updateFamily(data: Partial<Pick<FamilyDocument, 'name'>>): Promise<void> {
    const familyId = this.familyId();
    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.isAdmin()) {
      throw new Error('אין לך הרשאה לעדכן את המשפחה');
    }

    try {
      await this.firestoreService.updateDocument(`families/${familyId}`, data);
      await this.loadFamily(familyId);
    } catch (error: any) {
      console.error('Error updating family:', error);
      throw error;
    }
  }

  /**
   * Add a child to the family
   */
  async addChild(data: CreateChildData): Promise<string> {
    const familyId = this.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.canEdit()) {
      throw new Error('אין לך הרשאה להוסיף ילדים');
    }

    try {
      const currentChildren = this._children();
      const usedColors = currentChildren.map((c) => c.color);
      const color = data.color ?? getNextChildColor(usedColors);
      const order = currentChildren.length;

      // Build child data object, excluding undefined values
      const childData: Record<string, any> = {
        name: data.name,
        color,
        order,
        createdBy: userId,
      };

      // Only add birthYear if it's defined
      if (data.birthYear !== undefined && data.birthYear !== null) {
        childData['birthYear'] = data.birthYear;
      }

      const childId = await this.firestoreService.createDocument(
        `families/${familyId}/children`,
        childData
      );

      await this.loadChildren(familyId);
      return childId;
    } catch (error: any) {
      console.error('Error adding child:', error);
      throw error;
    }
  }

  /**
   * Update a child
   */
  async updateChild(
    childId: string,
    data: Partial<Pick<FamilyChild, 'name' | 'color' | 'birthYear' | 'order'>>
  ): Promise<void> {
    const familyId = this.familyId();
    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן ילדים');
    }

    try {
      await this.firestoreService.updateDocument(
        `families/${familyId}/children/${childId}`,
        data
      );
      await this.loadChildren(familyId);
    } catch (error: any) {
      console.error('Error updating child:', error);
      throw error;
    }
  }

  /**
   * Delete a child
   */
  async deleteChild(childId: string): Promise<void> {
    const familyId = this.familyId();
    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.canEdit()) {
      throw new Error('אין לך הרשאה למחוק ילדים');
    }

    try {
      await this.firestoreService.deleteDocument(
        `families/${familyId}/children/${childId}`
      );
      await this.loadChildren(familyId);
    } catch (error: any) {
      console.error('Error deleting child:', error);
      throw error;
    }
  }

  /**
   * Create an invite link
   */
  async createInvite(data: CreateInviteData): Promise<string> {
    const userId = this.authService.userId();
    if (!userId) {
      throw new Error('משתמש לא מחובר');
    }

    if (!this.isAdmin()) {
      throw new Error('אין לך הרשאה ליצור הזמנות');
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 7));

      const inviteId = await this.firestoreService.createDocument('invites', {
        familyId: data.familyId,
        familyName: data.familyName,
        role: data.role,
        createdBy: userId,
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      return inviteId;
    } catch (error: any) {
      console.error('Error creating invite:', error);
      throw error;
    }
  }

  /**
   * Accept an invite
   */
  async acceptInvite(inviteId: string): Promise<string> {
    const userId = this.authService.userId();
    const user = this.authService.user();

    if (!userId || !user) {
      throw new Error('משתמש לא מחובר');
    }

    try {
      // Get invite
      const invite = await this.firestoreService.getDocument<FamilyInvite>(
        `invites/${inviteId}`
      );

      if (!invite) {
        throw new Error('הזמנה לא נמצאה');
      }

      // Check if already used
      if (invite.usedBy) {
        throw new Error('ההזמנה כבר נוצלה');
      }

      // Check if expired
      if (invite.expiresAt.toDate() < new Date()) {
        throw new Error('ההזמנה פגה');
      }

      // Add user as member
      await this.firestoreService.setDocument(
        `families/${invite.familyId}/members/${userId}`,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: invite.role,
          joinedAt: this.firestoreService.getServerTimestamp(),
          invitedBy: invite.createdBy,
        }
      );

      // Mark invite as used
      await this.firestoreService.updateDocument(`invites/${inviteId}`, {
        usedBy: userId,
        usedAt: this.firestoreService.getServerTimestamp(),
      });

      // Add to user's memberships
      await this.authService.addFamilyMembership(invite.familyId, invite.role);

      return invite.familyId;
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(memberId: string, role: FamilyRole): Promise<void> {
    const familyId = this.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.isAdmin()) {
      throw new Error('אין לך הרשאה לשנות תפקידים');
    }

    // Prevent changing own role
    if (memberId === userId) {
      throw new Error('לא ניתן לשנות את התפקיד שלך');
    }

    // Prevent changing owner's role
    const family = this._currentFamily();
    if (family?.ownerUserId === memberId) {
      throw new Error('לא ניתן לשנות את התפקיד של בעל המשפחה');
    }

    try {
      await this.firestoreService.updateDocument(
        `families/${familyId}/members/${memberId}`,
        { role }
      );
      await this.loadMembers(familyId);
    } catch (error: any) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove a member from the family
   */
  async removeMember(memberId: string): Promise<void> {
    const familyId = this.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.isAdmin()) {
      throw new Error('אין לך הרשאה להסיר חברים');
    }

    // Prevent removing self
    if (memberId === userId) {
      throw new Error('לא ניתן להסיר את עצמך');
    }

    // Prevent removing owner
    const family = this._currentFamily();
    if (family?.ownerUserId === memberId) {
      throw new Error('לא ניתן להסיר את בעל המשפחה');
    }

    try {
      await this.firestoreService.deleteDocument(
        `families/${familyId}/members/${memberId}`
      );
      await this.loadMembers(familyId);
    } catch (error: any) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  /**
   * Leave a family (for non-owners)
   */
  async leaveFamily(): Promise<void> {
    const familyId = this.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (this.isOwner()) {
      throw new Error('בעל המשפחה לא יכול לעזוב. יש להעביר בעלות או למחוק את המשפחה');
    }

    try {
      await this.firestoreService.deleteDocument(
        `families/${familyId}/members/${userId}`
      );
      await this.authService.removeFamilyMembership(familyId);
      this._currentFamily.set(null);
      this._members.set([]);
      this._children.set([]);
    } catch (error: any) {
      console.error('Error leaving family:', error);
      throw error;
    }
  }

  /**
   * Get a child by ID
   */
  getChild(childId: string): FamilyChild | undefined {
    return this._children().find((c) => c.id === childId);
  }

  /**
   * Get multiple children by IDs
   */
  getChildren(childIds: string[]): FamilyChild[] {
    return this._children().filter((c) => childIds.includes(c.id));
  }

  /**
   * Get a member by ID
   */
  getMember(memberId: string): FamilyMember | undefined {
    return this._members().find((m) => m.id === memberId);
  }

  /**
   * Clear current family state
   */
  clearFamily(): void {
    this._currentFamily.set(null);
    this._members.set([]);
    this._children.set([]);
    this._error.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}

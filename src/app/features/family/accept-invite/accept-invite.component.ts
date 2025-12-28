import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Timestamp } from 'firebase/firestore';

import { FamilyService } from '../../../core/family/family.service';
import { FirestoreService } from '../../../core/firebase/firestore.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FamilyInvite } from '../../../core/family/family.models';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './accept-invite.component.html',
  styleUrl: './accept-invite.component.scss',
})
export class AcceptInviteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private familyService = inject(FamilyService);
  private firestoreService = inject(FirestoreService);
  authService = inject(AuthService);

  invite = signal<FamilyInvite | null>(null);
  isLoading = signal(true);
  isAccepting = signal(false);
  isAccepted = signal(false);
  error = signal<string | null>(null);
  private acceptedFamilyId: string | null = null;

  roleLabels: Record<string, string> = {
    admin: 'מנהל',
    member: 'חבר',
    viewer: 'צופה',
  };

  ngOnInit(): void {
    this.loadInvite();
  }

  private async loadInvite(): Promise<void> {
    const inviteId = this.route.snapshot.paramMap.get('inviteId');
    if (!inviteId) {
      this.error.set('קישור הזמנה לא תקין');
      this.isLoading.set(false);
      return;
    }

    try {
      const invite = await this.firestoreService.getDocument<FamilyInvite>(
        `invites/${inviteId}`
      );

      if (!invite) {
        this.error.set('הזמנה לא נמצאה');
        this.isLoading.set(false);
        return;
      }

      // Check if already used
      if (invite.usedBy) {
        this.error.set('ההזמנה כבר נוצלה');
        this.isLoading.set(false);
        return;
      }

      // Check if expired
      if (invite.expiresAt.toDate() < new Date()) {
        this.error.set('ההזמנה פגה תוקף');
        this.isLoading.set(false);
        return;
      }

      this.invite.set(invite);
    } catch (err) {
      console.error('Error loading invite:', err);
      this.error.set('שגיאה בטעינת ההזמנה');
    } finally {
      this.isLoading.set(false);
    }
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] ?? role;
  }

  formatDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async signInAndAccept(): Promise<void> {
    const invite = this.invite();
    if (!invite) return;

    // Store invite ID in session storage to accept after login
    sessionStorage.setItem('pendingInviteId', invite.id);

    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  async acceptInvite(): Promise<void> {
    const invite = this.invite();
    if (!invite) return;

    this.isAccepting.set(true);

    try {
      const familyId = await this.familyService.acceptInvite(invite.id);
      this.acceptedFamilyId = familyId;
      this.isAccepted.set(true);
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      this.error.set(err.message || 'שגיאה בקבלת ההזמנה');
    } finally {
      this.isAccepting.set(false);
    }
  }

  goToFamily(): void {
    if (this.acceptedFamilyId) {
      // Store the family ID and navigate
      localStorage.setItem('selectedFamilyId', this.acceptedFamilyId);
      this.router.navigate(['/app']);
    } else {
      this.router.navigate(['/family-select']);
    }
  }
}

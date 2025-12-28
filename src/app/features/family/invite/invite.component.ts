import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Timestamp } from 'firebase/firestore';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FamilyService } from '../../../core/family/family.service';
import { FirestoreService, where } from '../../../core/firebase/firestore.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FamilyInvite } from '../../../core/family/family.models';
import { FamilyRole } from '../../../core/auth/auth.models';

interface RoleOption {
  value: Exclude<FamilyRole, 'owner'>;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  templateUrl: './invite.component.html',
  styleUrl: './invite.component.scss',
})
export class InviteComponent implements OnInit {
  private fb = inject(FormBuilder);
  familyService = inject(FamilyService);
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  inviteForm!: FormGroup;
  isLoading = signal(false);
  isCreating = signal(false);
  invites = signal<FamilyInvite[]>([]);
  generatedInviteLink = signal<string | null>(null);
  copied = signal(false);

  availableRoles: RoleOption[] = [
    { value: 'admin', label: 'מנהל', icon: 'admin_panel_settings' },
    { value: 'member', label: 'חבר', icon: 'person' },
    { value: 'viewer', label: 'צופה', icon: 'visibility' },
  ];

  roleLabels: Record<string, string> = {
    admin: 'מנהל',
    member: 'חבר',
    viewer: 'צופה',
  };

  ngOnInit(): void {
    this.initForm();
    this.loadInvites();
  }

  private initForm(): void {
    this.inviteForm = this.fb.group({
      role: ['member', Validators.required],
      expiresInDays: [7, Validators.required],
    });
  }

  private async loadInvites(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.isLoading.set(true);

    try {
      // Query invites for this family (without orderBy to avoid needing composite index)
      const invites = await this.firestoreService.getCollection<FamilyInvite>(
        'invites',
        where('familyId', '==', familyId)
      );
      // Sort client-side by createdAt descending
      invites.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      this.invites.set(invites);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createInvite(): Promise<void> {
    if (this.inviteForm.invalid) return;

    const familyId = this.familyService.familyId();
    const familyName = this.familyService.familyName();
    if (!familyId || !familyName) return;

    this.isCreating.set(true);
    this.generatedInviteLink.set(null);

    try {
      const formValue = this.inviteForm.value;
      const inviteId = await this.familyService.createInvite({
        familyId,
        familyName,
        role: formValue.role,
        expiresInDays: formValue.expiresInDays,
      });

      // Generate the invite link (include hash for hash-based routing)
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/#/accept-invite/${inviteId}`;
      this.generatedInviteLink.set(inviteLink);

      // Reload invites list
      await this.loadInvites();
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      this.isCreating.set(false);
    }
  }

  async copyLink(): Promise<void> {
    const link = this.generatedInviteLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  }

  copyInviteLink(inviteId: string): void {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/#/accept-invite/${inviteId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      // Could add a snackbar notification here
    });
  }

  async deleteInvite(inviteId: string): Promise<void> {
    try {
      await this.firestoreService.deleteDocument(`invites/${inviteId}`);
      await this.loadInvites();
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] ?? role;
  }

  isExpired(invite: FamilyInvite): boolean {
    return invite.expiresAt.toDate() < new Date();
  }

  getStatusIcon(invite: FamilyInvite): string {
    if (invite.usedBy) return 'check_circle';
    if (this.isExpired(invite)) return 'cancel';
    return 'schedule';
  }

  getStatusLabel(invite: FamilyInvite): string {
    if (invite.usedBy) return 'נוצל';
    if (this.isExpired(invite)) return 'פג תוקף';
    return 'ממתין';
  }

  getStatusClass(invite: FamilyInvite): string {
    if (invite.usedBy) return 'used';
    if (this.isExpired(invite)) return 'expired';
    return 'pending';
  }

  formatDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

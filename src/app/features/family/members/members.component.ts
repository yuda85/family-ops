import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FamilyService } from '../../../core/family/family.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FamilyRole } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="members-page">
      <header class="page-header">
        <h1>חברי משפחה</h1>
        @if (familyService.isAdmin()) {
          <button mat-flat-button color="primary" (click)="inviteMember()">
            <mat-icon>person_add</mat-icon>
            הזמן חבר
          </button>
        }
      </header>

      @if (familyService.members().length > 0) {
        <div class="members-list">
          @for (member of familyService.members(); track member.id) {
            <div class="member-card">
              <div class="member-avatar" [class.current-user]="member.id === authService.userId()">
                {{ getInitials(member.displayName) }}
              </div>
              <div class="member-info">
                <div class="member-name">
                  {{ member.displayName }}
                  @if (member.id === authService.userId()) {
                    <span class="you-badge">(את/ה)</span>
                  }
                </div>
                <div class="member-email">{{ member.email }}</div>
              </div>
              <mat-chip-set>
                <mat-chip [highlighted]="member.role === 'owner'">
                  {{ getRoleLabel(member.role) }}
                </mat-chip>
              </mat-chip-set>
              @if (familyService.isAdmin() && member.id !== authService.userId() && member.role !== 'owner') {
                <button mat-icon-button [matMenuTriggerFor]="memberMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #memberMenu="matMenu">
                  <button mat-menu-item (click)="changeRole(member.id, 'admin')">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>הפוך למנהל</span>
                  </button>
                  <button mat-menu-item (click)="changeRole(member.id, 'member')">
                    <mat-icon>person</mat-icon>
                    <span>הפוך לחבר</span>
                  </button>
                  <button mat-menu-item (click)="changeRole(member.id, 'viewer')">
                    <mat-icon>visibility</mat-icon>
                    <span>הפוך לצופה</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item class="danger" (click)="removeMember(member.id)">
                    <mat-icon>person_remove</mat-icon>
                    <span>הסר מהמשפחה</span>
                  </button>
                </mat-menu>
              }
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="group"
          title="אין חברים במשפחה"
          description="הזמינו את בני המשפחה שלכם להצטרף"
          actionLabel="הזמן חברים"
          actionIcon="person_add"
          (action)="inviteMember()"
        ></app-empty-state>
      }

      @if (!familyService.isOwner() && familyService.members().length > 1) {
        <button mat-button color="warn" class="leave-btn" (click)="leaveFamily()">
          <mat-icon>exit_to_app</mat-icon>
          עזוב את המשפחה
        </button>
      }
    </div>
  `,
  styles: [`
    .members-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .member-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
    }

    .member-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);

      &.current-user {
        border: 2px solid var(--color-secondary);
      }
    }

    .member-info {
      flex: 1;
      min-width: 0;

      .member-name {
        font-weight: 600;
        color: var(--text-primary);

        .you-badge {
          font-weight: 400;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }

      .member-email {
        font-size: 0.75rem;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    mat-chip-set {
      flex-shrink: 0;
    }

    .danger {
      color: var(--color-error) !important;
    }

    .leave-btn {
      display: flex;
      margin: 1rem auto 0;

      mat-icon {
        margin-inline-end: 0.5rem;
      }
    }
  `]
})
export class MembersComponent {
  private router = inject(Router);
  familyService = inject(FamilyService);
  authService = inject(AuthService);

  roleLabels: Record<FamilyRole, string> = {
    owner: 'בעלים',
    admin: 'מנהל',
    member: 'חבר',
    viewer: 'צופה',
  };

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  }

  getRoleLabel(role: FamilyRole): string {
    return this.roleLabels[role] ?? role;
  }

  inviteMember(): void {
    this.router.navigate(['/app/family/invite']);
  }

  async changeRole(memberId: string, role: FamilyRole): Promise<void> {
    try {
      await this.familyService.updateMemberRole(memberId, role);
    } catch (err) {
      console.error('Error changing role:', err);
    }
  }

  async removeMember(memberId: string): Promise<void> {
    // TODO: Add confirmation
    try {
      await this.familyService.removeMember(memberId);
    } catch (err) {
      console.error('Error removing member:', err);
    }
  }

  async leaveFamily(): Promise<void> {
    // TODO: Add confirmation
    try {
      await this.familyService.leaveFamily();
    } catch (err) {
      console.error('Error leaving family:', err);
    }
  }
}

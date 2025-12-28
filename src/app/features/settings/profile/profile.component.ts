import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { FamilyService } from '../../../core/family/family.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
  ],
  template: `
    <div class="settings-page">
      <h1>הגדרות</h1>

      <!-- Profile Section -->
      <section class="settings-section">
        <h2>פרופיל</h2>
        <div class="settings-card">
          <div class="profile-header">
            <div class="profile-avatar">
              {{ getInitials() }}
            </div>
            <div class="profile-info">
              <h3>{{ authService.displayName() }}</h3>
              <p>{{ authService.userEmail() }}</p>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-button class="settings-item">
            <mat-icon>edit</mat-icon>
            <span>עריכת פרופיל</span>
            <mat-icon class="chevron">chevron_left</mat-icon>
          </button>
          <button mat-button class="settings-item">
            <mat-icon>lock</mat-icon>
            <span>שינוי סיסמה</span>
            <mat-icon class="chevron">chevron_left</mat-icon>
          </button>
        </div>
      </section>

      <!-- Appearance Section -->
      <section class="settings-section">
        <h2>מראה</h2>
        <div class="settings-card">
          <div class="theme-selector">
            <div class="theme-label">
              <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
              <span>ערכת נושא</span>
            </div>
            <div class="theme-options">
              <button
                class="theme-btn"
                [class.active]="themeService.themePreference() === 'light'"
                (click)="themeService.setTheme('light')"
              >
                <mat-icon>light_mode</mat-icon>
                בהיר
              </button>
              <button
                class="theme-btn"
                [class.active]="themeService.themePreference() === 'dark'"
                (click)="themeService.setTheme('dark')"
              >
                <mat-icon>dark_mode</mat-icon>
                כהה
              </button>
              <button
                class="theme-btn"
                [class.active]="themeService.themePreference() === 'system'"
                (click)="themeService.setTheme('system')"
              >
                <mat-icon>contrast</mat-icon>
                מערכת
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Family Section -->
      <section class="settings-section">
        <h2>משפחה</h2>
        <div class="settings-card">
          @if (familyService.currentFamily()) {
            <div class="family-info-row">
              <div class="family-badge">
                {{ familyService.familyName()?.substring(0, 2) }}
              </div>
              <div class="family-details">
                <h3>{{ familyService.familyName() }}</h3>
                <p>{{ getRoleLabel() }}</p>
              </div>
            </div>
            <mat-divider></mat-divider>
          }
          <button mat-button class="settings-item" (click)="switchFamily()">
            <mat-icon>swap_horiz</mat-icon>
            <span>החלף משפחה</span>
            <mat-icon class="chevron">chevron_left</mat-icon>
          </button>
          @if (familyService.isAdmin()) {
            <button mat-button class="settings-item" routerLink="/app/family/settings">
              <mat-icon>settings</mat-icon>
              <span>הגדרות משפחה</span>
              <mat-icon class="chevron">chevron_left</mat-icon>
            </button>
            <button mat-button class="settings-item" routerLink="/app/family/invite">
              <mat-icon>person_add</mat-icon>
              <span>הזמן חברים</span>
              <mat-icon class="chevron">chevron_left</mat-icon>
            </button>
          }
        </div>
      </section>

      <!-- About Section -->
      <section class="settings-section">
        <h2>אודות</h2>
        <div class="settings-card">
          <div class="about-info">
            <span class="app-logo">👨‍👩‍👧‍👦</span>
            <h3>FamilyOps</h3>
            <p>גרסה 1.0.0</p>
          </div>
        </div>
      </section>

      <!-- Logout -->
      <button mat-stroked-button color="warn" class="logout-btn" (click)="logout()">
        <mat-icon>logout</mat-icon>
        התנתקות
      </button>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .settings-section {
      h2 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-secondary);
        margin: 0 0 0.5rem;
        letter-spacing: 0.05em;
      }
    }

    .settings-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      overflow: hidden;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;

      .profile-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .profile-info {
        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      }
    }

    .settings-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 1rem 1.25rem;
      text-align: right;
      justify-content: flex-start;
      border-radius: 0;
      font-weight: 400;

      span {
        flex: 1;
      }

      .chevron {
        color: var(--text-tertiary);
      }
    }

    .theme-selector {
      padding: 1.25rem;

      .theme-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
      }

      .theme-options {
        display: flex;
        gap: 0.5rem;

        .theme-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0.5rem;
          background: var(--surface-secondary);
          border: 2px solid transparent;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
          color: var(--text-secondary);
          font-size: 0.75rem;

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }

          &:hover {
            background: var(--surface-hover);
          }

          &.active {
            border-color: var(--color-primary);
            background: var(--color-primary-alpha);
            color: var(--color-primary);
          }
        }
      }
    }

    .family-info-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;

      .family-badge {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--color-secondary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .family-details {
        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        p {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }

    .about-info {
      padding: 2rem;
      text-align: center;

      .app-logo {
        font-size: 3rem;
        display: block;
        margin-bottom: 0.75rem;
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }
    }

    .logout-btn {
      display: flex;
      margin: 0 auto;
      padding: 0.75rem 2rem;

      mat-icon {
        margin-inline-end: 0.5rem;
      }
    }

    mat-divider {
      margin: 0;
    }
  `]
})
export class ProfileComponent {
  private router = inject(Router);

  authService = inject(AuthService);
  themeService = inject(ThemeService);
  familyService = inject(FamilyService);

  roleLabels: Record<string, string> = {
    owner: 'בעלים',
    admin: 'מנהל',
    member: 'חבר',
    viewer: 'צופה',
  };

  getInitials(): string {
    const name = this.authService.displayName();
    if (!name) return '?';

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  }

  getRoleLabel(): string {
    const role = this.familyService.currentUserRole();
    if (!role) return '';
    return this.roleLabels[role] ?? role;
  }

  switchFamily(): void {
    this.router.navigate(['/family-select']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

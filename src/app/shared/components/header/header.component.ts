import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { ThemeService } from '../../../core/theme/theme.service';
import { AuthService } from '../../../core/auth/auth.service';
import { FamilyService } from '../../../core/family/family.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <mat-toolbar class="header">
      <div class="header-content">
        <!-- Right side (start in RTL) -->
        <div class="header-start">
          @if (showMenuButton) {
            <button mat-icon-button (click)="menuClick.emit()" aria-label="תפריט">
              <mat-icon>menu</mat-icon>
            </button>
          }

          <a routerLink="/app" class="logo">
            <span class="logo-icon">👨‍👩‍👧‍👦</span>
            <span class="logo-text">FamilyOps</span>
          </a>

          @if (familyService.familyName()) {
            <span class="family-badge">{{ familyService.familyName() }}</span>
          }
        </div>

        <!-- Left side (end in RTL) -->
        <div class="header-end">
          <!-- Theme toggle -->
          <button
            mat-icon-button
            (click)="themeService.cycleTheme()"
            [matTooltip]="'מצב: ' + themeService.getThemeLabel()"
            aria-label="החלף ערכת נושא"
          >
            <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
          </button>

          <!-- User menu -->
          @if (authService.isAuthenticated()) {
            <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="תפריט משתמש">
              <div class="user-avatar">
                {{ getInitials() }}
              </div>
            </button>

            <mat-menu #userMenu="matMenu" xPosition="before">
              <div class="menu-header">
                <span class="menu-user-name">{{ authService.displayName() }}</span>
                <span class="menu-user-email">{{ authService.userEmail() }}</span>
              </div>
              <mat-divider></mat-divider>
              <a mat-menu-item routerLink="/app/settings">
                <mat-icon>settings</mat-icon>
                <span>הגדרות</span>
              </a>
              <a mat-menu-item routerLink="/family-select">
                <mat-icon>swap_horiz</mat-icon>
                <span>החלף משפחה</span>
              </a>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>התנתק</span>
              </button>
            </mat-menu>
          }
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header {
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-subtle);
      height: 64px;
      position: sticky;
      top: 0;
      z-index: 1000;

      @media (max-width: 767px) {
        height: 56px;
      }
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 0.5rem;
    }

    .header-start,
    .header-end {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text-primary);
      font-family: var(--font-family-display);
      font-weight: 600;
      font-size: 1.125rem;

      &:hover {
        text-decoration: none;
      }
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      font-family: var(--font-family-display);

      @media (max-width: 480px) {
        display: none;
      }
    }

    .family-badge {
      background: var(--color-primary-alpha);
      color: var(--color-primary);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      font-family: var(--font-family-hebrew);

      @media (max-width: 600px) {
        display: none;
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
    }

    .menu-header {
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-family: var(--font-family-hebrew);
    }

    .menu-user-name {
      font-weight: 500;
      color: var(--text-primary);
      font-family: var(--font-family-hebrew);
    }

    .menu-user-email {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-family: var(--font-family-hebrew);
    }

    mat-divider {
      margin: 0.5rem 0;
    }
  `]
})
export class HeaderComponent {
  @Input() showMenuButton = false;
  @Output() menuClick = new EventEmitter<void>();

  themeService = inject(ThemeService);
  authService = inject(AuthService);
  familyService = inject(FamilyService);

  getInitials(): string {
    const name = this.authService.displayName();
    if (!name) return '?';

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}

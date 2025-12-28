import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <!-- Theme toggle -->
        <button
          class="theme-toggle"
          (click)="themeService.cycleTheme()"
          [attr.aria-label]="'ערכת נושא: ' + themeService.getThemeLabel()"
        >
          <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
        </button>

        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-logo">👨‍👩‍👧‍👦</span>
            <h1>ברוכים הבאים</h1>
            <p>התחברו לניהול המשפחה שלכם</p>
          </div>

          @if (authService.error()) {
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ authService.error() }}</span>
            </div>
          }

          <button
            class="google-button"
            (click)="signInWithGoogle()"
            [disabled]="isSubmitting()"
          >
            @if (isSubmitting()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>התחברות עם Google</span>
            }
          </button>

          <div class="auth-footer">
            <p class="privacy-note">
              בהתחברות אתם מסכימים לתנאי השימוש ומדיניות הפרטיות
            </p>
          </div>
        </div>

        <p class="app-tagline">ניהול זמן משפחתי חכם</p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-app);
      padding: 1rem;
    }

    .auth-container {
      width: 100%;
      max-width: 400px;
      position: relative;
    }

    .theme-toggle {
      position: absolute;
      top: -3rem;
      left: 0;
      background: var(--surface-primary);
      border: 1px solid var(--border-default);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        color: var(--text-secondary);
      }

      &:hover {
        background: var(--surface-hover);
        border-color: var(--border-strong);
      }
    }

    .auth-card {
      background: var(--surface-primary);
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-subtle);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;

      .auth-logo {
        font-size: 4rem;
        display: block;
        margin-bottom: 1.5rem;
      }

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.5rem;
      }

      p {
        color: var(--text-secondary);
        margin: 0;
        font-size: 1rem;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-3) var(--spacing-4);
      background: var(--error-bg);
      color: var(--color-error);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-6);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .google-button {
      width: 100%;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: var(--surface-primary);
      border: 2px solid var(--border-default);
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--surface-hover);
        border-color: var(--border-strong);
        box-shadow: var(--shadow-md);
      }

      &:active:not(:disabled) {
        transform: scale(0.98);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .google-icon {
        width: 20px;
        height: 20px;
      }

      mat-spinner {
        margin: 0 auto;
      }
    }

    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;

      .privacy-note {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        margin: 0;
        line-height: 1.5;
      }
    }

    .app-tagline {
      text-align: center;
      margin-top: 1.5rem;
      color: var(--text-tertiary);
      font-size: 0.875rem;
    }
  `]
})
export class LoginComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isSubmitting = signal(false);

  async signInWithGoogle(): Promise<void> {
    this.isSubmitting.set(true);
    this.authService.clearError();

    try {
      await this.authService.signInWithGoogle();

      // Redirect to return URL or default
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/family-select';
      this.router.navigateByUrl(returnUrl);
    } catch {
      // Error is handled by AuthService
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

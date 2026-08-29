import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';
import { FamilyService } from '../../../core/family/family.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { PushService } from '../../../core/notifications/push.service';

interface Link {
  path: string;
  icon: string;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-settings-home',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  template: `
    <h1>הגדרות</h1>

    <section class="card">
      <h2>התראות</h2>
      <p class="hint">{{ pushHint() }}</p>
      @if (push.state() !== 'enabled') {
        <button type="button" class="primary" (click)="push.enable()" [disabled]="busy()">
          הפעל התראות במכשיר הזה
        </button>
      }
      @if (push.error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
    </section>

    <nav class="links">
      @for (link of links; track link.path) {
        <a [routerLink]="link.path" class="link">
          <mat-icon aria-hidden="true">{{ link.icon }}</mat-icon>
          <span class="link-body">
            <span class="link-label">{{ link.label }}</span>
            <span class="link-hint">{{ link.hint }}</span>
          </span>
          <mat-icon class="chevron" aria-hidden="true">chevron_left</mat-icon>
        </a>
      }
    </nav>

    <section class="card">
      <h2>תצוגה</h2>
      <div class="choices" role="group" aria-label="ערכת נושא">
        @for (option of themes; track option.value) {
          <button
            type="button"
            class="choice"
            [class.selected]="theme.themePreference() === option.value"
            [attr.aria-pressed]="theme.themePreference() === option.value"
            (click)="theme.setTheme(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>
    </section>

    <section class="card">
      <h2>חשבון</h2>
      <p class="hint">{{ userLabel() }}</p>
      <button type="button" class="ghost" (click)="auth.logout()">התנתק</button>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 20px;
      }

      h1 {
        margin: 0 0 16px;
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
      }

      h2 {
        margin: 0 0 6px;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--text);
      }

      .card {
        margin-bottom: 16px;
        padding: 16px;
        border-radius: 14px;
        background: var(--surface);
        border: 1px solid var(--border);
      }

      .hint {
        margin: 0 0 12px;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .links {
        margin-bottom: 16px;
        border-radius: 14px;
        background: var(--surface);
        border: 1px solid var(--border);
        overflow: hidden;
      }

      .link {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 60px;
        padding: 0 16px;
        color: var(--text);
        text-decoration: none;
        border-bottom: 1px solid var(--border);
      }

      .link:last-child {
        border-bottom: 0;
      }

      .link-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .link-label {
        font-weight: 600;
      }

      .link-hint {
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .chevron {
        color: var(--text-faint);
      }

      .choices {
        display: flex;
        gap: 8px;
      }

      .choice {
        flex: 1;
        min-height: 48px;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .choice.selected {
        border-color: var(--accent);
        background: var(--accent-wash);
        color: var(--accent);
      }

      .primary {
        width: 100%;
        min-height: 48px;
        border: 0;
        border-radius: 12px;
        background: var(--accent);
        color: var(--text-on-accent);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .primary:disabled {
        opacity: 0.45;
      }

      .ghost {
        min-height: 48px;
        padding: 0 20px;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: none;
        color: var(--text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .error {
        margin: 12px 0 0;
        color: var(--danger);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class SettingsHomeComponent {
  readonly push = inject(PushService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private family = inject(FamilyService);

  readonly links: Link[] = [
    {
      path: '/app/settings/activities',
      icon: 'repeat',
      label: 'חוגים קבועים',
      hint: 'התבניות שמהן נבנה כל שבוע',
    },
    {
      path: '/app/settings/availability',
      icon: 'home_work',
      label: 'מי בבית',
      hint: 'השבוע הקבוע של כל הורה',
    },
    { path: '/app/family/children', icon: 'child_care', label: 'הילדים', hint: 'שמות וצבעים' },
    { path: '/app/family/members', icon: 'group', label: 'ההורים', hint: 'מי במשפחה' },
    // One-time bulk import. Delete this entry and the 'import' route once the
    // schedule is in; nothing else depends on them.
    {
      path: '/app/settings/import',
      icon: 'upload_file',
      label: 'ייבוא לוז',
      hint: 'הדבקה חד-פעמית של כל החוגים',
    },
  ];

  readonly themes = [
    { value: 'light' as const, label: 'בהיר' },
    { value: 'dark' as const, label: 'כהה' },
    { value: 'system' as const, label: 'לפי המכשיר' },
  ];

  readonly busy = computed(() => this.push.state() === 'requesting');

  readonly userLabel = computed(() => {
    const user = this.auth.user();
    const family = this.family.familyName();
    return [user?.displayName, family].filter(Boolean).join(' · ');
  });

  readonly pushHint = computed(() => {
    switch (this.push.state()) {
      case 'enabled':
        return 'המכשיר הזה מקבל התראות.';
      case 'blocked':
        return 'הדפדפן חוסם התראות. צריך לאשר אותן בהגדרות האתר.';
      case 'unsupported':
        return 'הדפדפן הזה לא תומך בהתראות.';
      case 'unconfigured':
        return 'עדיין לא הוגדר מפתח Web Push בפרויקט.';
      default:
        return 'תדריך ערב, יציאות והכנות — ישירות לטלפון.';
    }
  });
}

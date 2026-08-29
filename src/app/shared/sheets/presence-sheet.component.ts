import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import { dayOfWeekOf } from '../../core/schedule/date-utils';
import type { DateStr, DayWork, MemberPresence } from '../../core/schedule/schedule.models';

export interface PresenceSheetData {
  date: DateStr;
  presence: MemberPresence[];
}

type Mode = 'home' | 'returns' | 'none';
/** This date only, or the usual week from now on. */
type Scope = 'day' | 'always';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/** "2026-08-30" reads as "30/8" to a person. */
function shortDate(date: DateStr): string {
  const [, month, day] = date.split('-');
  return `${Number(day)}/${Number(month)}`;
}

/**
 * Who is around, edited from the day itself.
 *
 * The usual week lives in settings, but real weeks deviate from it constantly
 * - working from home on a Tuesday instead of a Monday, or being needed in
 * the office. Reached from a specific day, the default is that day only; the
 * pattern is the deliberate choice, not the accident.
 */
@Component({
  selector: 'app-presence-sheet',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="sheet">
      <h2>מי בבית</h2>
      <p class="sub">יום {{ dayName }} · {{ shortDate }}</p>

      @for (member of members(); track member.id) {
        <section class="member">
          <h3>{{ member.displayName }}</h3>
          <div class="row">
            <div class="choices" role="group" [attr.aria-label]="member.displayName">
              <button
                type="button"
                class="choice"
                [class.selected]="modeOf(member.id) === 'home'"
                [attr.aria-pressed]="modeOf(member.id) === 'home'"
                (click)="setMode(member.id, 'home')"
              >
                <mat-icon aria-hidden="true">home</mat-icon>
                בבית
              </button>
              <button
                type="button"
                class="choice"
                [class.selected]="modeOf(member.id) === 'returns'"
                [attr.aria-pressed]="modeOf(member.id) === 'returns'"
                (click)="setMode(member.id, 'returns')"
              >
                <mat-icon aria-hidden="true">schedule</mat-icon>
                חוזר
              </button>
              <button
                type="button"
                class="choice"
                [class.selected]="modeOf(member.id) === 'none'"
                [attr.aria-pressed]="modeOf(member.id) === 'none'"
                (click)="setMode(member.id, 'none')"
              >
                לא רשום
              </button>
            </div>

            @if (modeOf(member.id) === 'returns') {
              <input
                type="time"
                [ngModel]="timeOf(member.id)"
                (ngModelChange)="setTime(member.id, $event)"
                [name]="'t-' + member.id"
                [attr.aria-label]="'שעת חזרה של ' + member.displayName"
              />
            }
          </div>
        </section>
      }

      <h3 id="scope-label">על מה זה חל</h3>
      <div class="choices" role="group" aria-labelledby="scope-label">
        <button
          type="button"
          class="choice"
          [class.selected]="scope() === 'day'"
          [attr.aria-pressed]="scope() === 'day'"
          (click)="scope.set('day')"
        >
          רק היום הזה
        </button>
        <button
          type="button"
          class="choice"
          [class.selected]="scope() === 'always'"
          [attr.aria-pressed]="scope() === 'always'"
          (click)="scope.set('always')"
        >
          כל יום {{ dayName }}
        </button>
      </div>
      <p class="hint">{{ hint() }}</p>

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <button type="button" class="primary" [disabled]="busy()" (click)="save()">שמור</button>
    </div>
  `,
  styles: [
    `
      .sheet {
        padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px));
      }

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text);
      }

      .sub {
        margin: 2px 0 0;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      h3 {
        margin: 20px 0 8px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .member h3 {
        color: var(--text);
        font-size: 0.9375rem;
        font-weight: 700;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .choices {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .choice {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
        padding: 0 14px;
        border-radius: 24px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }

      .choice.selected {
        border-color: var(--accent);
        background: var(--accent-wash);
        color: var(--accent);
      }

      .choice mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      input {
        flex: 1;
        min-width: 110px;
        min-height: 48px;
        padding: 0 12px;
        border-radius: 10px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font: inherit;
      }

      input:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
      }

      .hint {
        margin: 8px 0 0;
        font-size: 0.8125rem;
        color: var(--text-faint);
      }

      .primary {
        width: 100%;
        min-height: 48px;
        margin-top: 20px;
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
        cursor: not-allowed;
      }

      .error {
        margin: 12px 0 0;
        color: var(--danger);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class PresenceSheetComponent {
  readonly data = inject<PresenceSheetData>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<PresenceSheetComponent>);
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly dayName = DAY_NAMES[dayOfWeekOf(this.data.date)];
  readonly shortDate = shortDate(this.data.date);
  readonly scope = signal<Scope>('day');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly members = computed(() => this.family.members());

  /** Working copy, seeded from what the day already resolves to. */
  private draft = signal<Record<string, { mode: Mode; time: string }>>(
    Object.fromEntries(
      this.data.presence.map((p) => [
        p.memberId,
        { mode: p.worksFromHome ? 'home' : 'returns', time: p.returnTime ?? '' },
      ])
    )
  );

  readonly hint = computed(() =>
    this.scope() === 'day'
      ? `רק ב-${this.shortDate}. השבוע הרגיל לא ישתנה.`
      : `ישנה את יום ${this.dayName} בשבוע הרגיל, לכל השבועות.`
  );

  modeOf(memberId: string): Mode {
    return this.draft()[memberId]?.mode ?? 'none';
  }

  timeOf(memberId: string): string {
    return this.draft()[memberId]?.time ?? '';
  }

  setMode(memberId: string, mode: Mode): void {
    this.draft.update((d) => ({ ...d, [memberId]: { mode, time: d[memberId]?.time ?? '' } }));
  }

  setTime(memberId: string, time: string): void {
    this.draft.update((d) => ({
      ...d,
      [memberId]: { mode: d[memberId]?.mode ?? 'returns', time },
    }));
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      for (const member of this.members()) {
        const entry = this.draft()[member.id];
        const mode = entry?.mode ?? 'none';
        const work: DayWork | undefined =
          mode === 'home'
            ? { worksFromHome: true }
            : mode === 'returns'
              ? { worksFromHome: false, ...(entry?.time ? { returnTime: entry.time } : {}) }
              : undefined;

        if (this.scope() === 'day') {
          await this.schedule.setDayWork(this.data.date, member.id, work ?? 'cleared');
        } else {
          await this.writePattern(member.id, work);
          // A one-day override would keep shadowing the pattern just set.
          await this.schedule.setDayWork(this.data.date, member.id, null).catch(() => undefined);
        }
      }
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      this.busy.set(false);
    }
  }

  private async writePattern(memberId: string, work: DayWork | undefined): Promise<void> {
    const day = dayOfWeekOf(this.data.date);
    const existing = this.schedule.availability().find((a) => a.id === memberId)?.days ?? {};
    const days: Record<number, DayWork> = { ...existing };

    if (work) days[day] = work;
    else delete days[day];

    await this.schedule.setAvailability(memberId, days);
  }
}

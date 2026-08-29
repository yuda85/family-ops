import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../../core/family/family.service';
import { ScheduleService } from '../../../core/schedule/schedule.service';
import type { DayWork } from '../../../core/schedule/schedule.models';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
/** Sunday to Thursday. Nobody is arranging cover for Saturday. */
const WORK_DAYS = [0, 1, 2, 3, 4];

/**
 * Each parent's working week: at home, or back at a time.
 *
 * Saved on every tap rather than behind a submit button - it is a handful of
 * toggles, and a form that can be abandoned half-filled is worse than one
 * that is always current.
 */
@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <h1>מי בבית</h1>
    <p class="lead">
      השבוע הקבוע של כל הורה. מופיע במסך היום, בתכנון השבוע, ובתדריך של הערב.
    </p>

    @for (member of members(); track member.id) {
      <section class="card">
        <h2>{{ member.displayName }}</h2>

        @for (day of days; track day) {
          <div class="row">
            <span class="day">{{ dayNames[day] }}</span>

            <div class="choices" role="group" [attr.aria-label]="dayNames[day]">
              <button
                type="button"
                class="choice"
                [class.selected]="modeOf(member.id, day) === 'home'"
                [attr.aria-pressed]="modeOf(member.id, day) === 'home'"
                (click)="setHome(member.id, day)"
              >
                <mat-icon aria-hidden="true">home</mat-icon>
                בבית
              </button>
              <button
                type="button"
                class="choice"
                [class.selected]="modeOf(member.id, day) === 'returns'"
                [attr.aria-pressed]="modeOf(member.id, day) === 'returns'"
                (click)="setReturns(member.id, day)"
              >
                <mat-icon aria-hidden="true">schedule</mat-icon>
                חוזר
              </button>
            </div>

            @if (modeOf(member.id, day) === 'returns') {
              <input
                type="time"
                [ngModel]="workOf(member.id, day)?.returnTime ?? ''"
                (ngModelChange)="setReturnTime(member.id, day, $event)"
                [name]="member.id + '-' + day"
                [attr.aria-label]="'שעת חזרה ביום ' + dayNames[day]"
              />
            } @else if (modeOf(member.id, day) !== 'none') {
              <button type="button" class="clear" (click)="clear(member.id, day)" aria-label="נקה">
                <mat-icon aria-hidden="true">close</mat-icon>
              </button>
            } @else {
              <span class="spacer"></span>
            }
          </div>
        }
      </section>
    } @empty {
      <p class="empty">אין חברי משפחה.</p>
    }

    @if (error(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 20px;
      }

      h1 {
        margin: 0 0 4px;
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
      }

      .lead {
        margin: 0 0 16px;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .card {
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 14px;
        background: var(--surface);
        border: 1px solid var(--border);
      }

      h2 {
        margin: 0 0 4px;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--text);
      }

      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 56px;
      }

      .day {
        flex: 0 0 48px;
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .choices {
        display: flex;
        gap: 6px;
      }

      .choice {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
        padding: 0 12px;
        border-radius: 24px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text-muted);
        font: inherit;
        font-size: 0.8125rem;
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

      input[type='time'] {
        flex: 1;
        min-width: 0;
        min-height: 48px;
        padding: 0 8px;
        border-radius: 10px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-size: 0.875rem;
      }

      input:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
      }

      .clear {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        flex: 0 0 48px;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--text-faint);
        cursor: pointer;
      }

      .spacer {
        flex: 0 0 48px;
      }

      .empty,
      .error {
        padding: 16px 0;
        color: var(--text-muted);
      }

      .error {
        color: var(--danger);
      }
    `,
  ],
})
export class AvailabilityComponent {
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly dayNames = DAY_NAMES;
  readonly days = WORK_DAYS;
  readonly error = signal<string | null>(null);

  readonly members = computed(() => this.family.members());

  workOf(memberId: string, day: number): DayWork | undefined {
    return this.schedule.availability().find((a) => a.id === memberId)?.days?.[day];
  }

  modeOf(memberId: string, day: number): 'home' | 'returns' | 'none' {
    const work = this.workOf(memberId, day);
    if (!work) return 'none';
    return work.worksFromHome ? 'home' : 'returns';
  }

  setHome(memberId: string, day: number): void {
    const current = this.modeOf(memberId, day);
    void this.write(memberId, day, current === 'home' ? undefined : { worksFromHome: true });
  }

  setReturns(memberId: string, day: number): void {
    const current = this.workOf(memberId, day);
    if (current && !current.worksFromHome) return;
    void this.write(memberId, day, { worksFromHome: false, returnTime: current?.returnTime });
  }

  setReturnTime(memberId: string, day: number, time: string): void {
    void this.write(memberId, day, {
      worksFromHome: false,
      ...(time ? { returnTime: time } : {}),
    });
  }

  clear(memberId: string, day: number): void {
    void this.write(memberId, day, undefined);
  }

  private async write(memberId: string, day: number, work: DayWork | undefined): Promise<void> {
    const existing = this.schedule.availability().find((a) => a.id === memberId)?.days ?? {};
    const days: Record<number, DayWork> = { ...existing };
    if (work) days[day] = work;
    else delete days[day];

    this.error.set(null);
    try {
      await this.schedule.setAvailability(memberId, days);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    }
  }
}

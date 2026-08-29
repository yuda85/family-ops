import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { ScheduleService } from '../../core/schedule/schedule.service';
import { dayOfWeekOf } from '../../core/schedule/date-utils';
import type { Cadence, DateStr, DayMeal } from '../../core/schedule/schedule.models';

export interface MealSheetData {
  date: DateStr;
  meal?: DayMeal;
}

/** How often, from the cook's point of view. */
type Repeat = 'once' | 'weekly' | 'fortnightly';

/** Which weeks an edit applies to. */
type Scope = 'once' | 'series';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * Dinner for one date, one-off or repeating.
 *
 * Same shape as the activities: a plan that repeats, and a per-date entry that
 * overrides it. Editing something that repeats asks which weeks it applies to
 * rather than guessing.
 *
 * Deliberately does not record who cooks - that is settled between two people
 * in the same house, and asking every day is friction with no payoff.
 */
@Component({
  selector: 'app-meal-sheet',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="sheet" (ngSubmit)="save()">
      <h2>ארוחת ערב</h2>
      <p class="sub">יום {{ dayName }}</p>

      <label class="field">
        <span>מה אוכלים</span>
        <input name="title" [(ngModel)]="title" autocomplete="off" placeholder="שניצל ופירה" required />
      </label>

      <label class="field">
        <span>מתי להתחיל להכין</span>
        <input name="startCookingAt" type="time" [(ngModel)]="startCookingAt" />
      </label>

      @if (isSeries()) {
        <fieldset class="field">
          <legend id="scope-label">על אילו שבועות</legend>
          <div class="choices" role="group" aria-labelledby="scope-label">
            <button
              type="button"
              class="choice"
              [class.selected]="scope() === 'once'"
              [attr.aria-pressed]="scope() === 'once'"
              (click)="scope.set('once')"
            >
              רק הפעם הזו
            </button>
            <button
              type="button"
              class="choice"
              [class.selected]="scope() === 'series'"
              [attr.aria-pressed]="scope() === 'series'"
              (click)="scope.set('series')"
            >
              כל הסדרה
            </button>
          </div>
        </fieldset>
      }

      @if (!isSeries() || scope() === 'series') {
        <fieldset class="field">
          <legend id="repeat-label">כל כמה זמן</legend>
          <div class="choices" role="group" aria-labelledby="repeat-label">
            @for (option of repeats; track option.value) {
              <button
                type="button"
                class="choice"
                [class.selected]="repeat() === option.value"
                [attr.aria-pressed]="repeat() === option.value"
                (click)="repeat.set(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
          @if (repeat() === 'fortnightly') {
            <p class="hint">מתחיל השבוע, ואז כל שבוע שני ביום {{ dayName }}.</p>
          }
        </fieldset>
      }

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <div class="actions">
        <button type="submit" class="primary" [disabled]="!title().trim() || saving()">שמור</button>
        @if (data.meal) {
          <button type="button" class="ghost danger" (click)="remove()">{{ removeLabel() }}</button>
        }
      </div>
    </form>
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
        margin: 2px 0 16px;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .field {
        display: block;
        margin-bottom: 16px;
        border: 0;
        padding: 0;
      }

      .field > span,
      .field > legend {
        display: block;
        margin-bottom: 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      input {
        width: 100%;
        min-height: 48px;
        padding: 0 12px;
        border-radius: 10px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font: inherit;
      }

      input::placeholder {
        color: var(--text-faint);
      }

      input:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
      }

      .choices {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .choice {
        min-height: 48px;
        padding: 0 16px;
        border-radius: 24px;
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

      .hint {
        margin: 8px 0 0;
        font-size: 0.8125rem;
        color: var(--text-faint);
      }

      .actions {
        display: flex;
        gap: 8px;
        margin-top: 24px;
      }

      .primary {
        flex: 1;
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
        cursor: not-allowed;
      }

      .ghost {
        min-height: 48px;
        padding: 0 20px;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: none;
        font: inherit;
        font-weight: 600;
        color: var(--text);
        cursor: pointer;
      }

      .ghost.danger {
        color: var(--danger);
        border-color: var(--danger);
      }

      .error {
        margin: 12px 0 0;
        color: var(--danger);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class MealSheetComponent {
  readonly data = inject<MealSheetData>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<MealSheetComponent>);
  private schedule = inject(ScheduleService);

  readonly dayName = DAY_NAMES[dayOfWeekOf(this.data.date)];
  readonly repeats: Array<{ value: Repeat; label: string }> = [
    { value: 'once', label: 'רק הפעם' },
    { value: 'weekly', label: 'כל שבוע' },
    { value: 'fortnightly', label: 'שבוע כן שבוע לא' },
  ];

  readonly title = signal(this.data.meal?.title ?? '');
  readonly startCookingAt = signal(this.data.meal?.startCookingAt ?? '');
  readonly repeat = signal<Repeat>(this.data.meal?.cadence ?? 'once');
  readonly scope = signal<Scope>('once');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  /** Already backed by a repeating plan, so an edit has to pick a scope. */
  readonly isSeries = computed(() => !!this.data.meal?.planId);

  readonly removeLabel = computed(() =>
    this.isSeries() && this.scope() === 'series' ? 'מחק סדרה' : 'מחק'
  );

  async save(): Promise<void> {
    const title = this.title().trim();
    if (!title) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      if (this.isSeries() && this.scope() === 'series') await this.saveSeries(title);
      else if (this.isSeries()) await this.saveOverride(title);
      else await this.saveNew(title);

      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(): Promise<void> {
    this.error.set(null);
    try {
      if (this.isSeries() && this.scope() === 'series') {
        await this.schedule.deleteMealPlan(this.data.meal!.planId!);
      } else if (this.isSeries()) {
        // Keep the plan, skip this one week.
        await this.schedule.skipMeal(this.data.date);
      } else {
        await this.schedule.deleteMeal(this.data.date);
      }
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו למחוק. נסה שוב.');
    }
  }

  /** A new dinner: a one-off entry, or a plan that starts on this date. */
  private async saveNew(title: string): Promise<void> {
    const startCookingAt = this.startCookingAt() || undefined;

    if (this.repeat() === 'once') {
      await this.schedule.setMeal({ date: this.data.date, title, startCookingAt });
      return;
    }

    await this.schedule.createMealPlan({
      title,
      dayOfWeek: dayOfWeekOf(this.data.date),
      cadence: this.repeat() as Cadence,
      // This date is what fixes which week a fortnightly plan lands on.
      anchorDate: this.data.date,
      startCookingAt,
      activeFrom: this.data.date,
    });
    // Clear any one-off that was sitting on this date and would now win.
    await this.schedule.deleteMeal(this.data.date).catch(() => undefined);
  }

  /** Change just this week, leaving the plan alone. */
  private async saveOverride(title: string): Promise<void> {
    await this.schedule.setMeal({
      date: this.data.date,
      title,
      startCookingAt: this.startCookingAt() || undefined,
    });
  }

  private async saveSeries(title: string): Promise<void> {
    const planId = this.data.meal!.planId!;
    const cadence = (this.repeat() === 'once' ? 'weekly' : this.repeat()) as Cadence;

    await this.schedule.updateMealPlan(planId, {
      title,
      cadence,
      startCookingAt: this.startCookingAt() || undefined,
    });
    // A per-date override would keep shadowing the plan we just changed.
    await this.schedule.deleteMeal(this.data.date).catch(() => undefined);
  }
}

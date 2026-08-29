import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import type { DateStr, Meal } from '../../core/schedule/schedule.models';

export interface MealSheetData {
  date: DateStr;
  meal?: Meal;
}

/** Dinner for one date: what, who cooks, when they need to start. */
@Component({
  selector: 'app-meal-sheet',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="sheet" (ngSubmit)="save()">
      <h2>ארוחת ערב</h2>

      <label class="field">
        <span>מה אוכלים</span>
        <input
          name="title"
          [(ngModel)]="title"
          autocomplete="off"
          placeholder="שניצל ופירה"
          required
        />
      </label>

      <label class="field">
        <span>מתי להתחיל להכין</span>
        <input name="startCookingAt" type="time" [(ngModel)]="startCookingAt" />
      </label>

      <fieldset class="field">
        <legend>מי מבשל</legend>
        <div class="choices">
          @for (member of members(); track member.id) {
            <button
              type="button"
              class="choice"
              [class.selected]="cookBy() === member.id"
              [attr.aria-pressed]="cookBy() === member.id"
              (click)="cookBy.set(member.id)"
            >
              {{ member.displayName }}
            </button>
          }
          <button
            type="button"
            class="choice"
            [class.selected]="cookBy() === null"
            [attr.aria-pressed]="cookBy() === null"
            (click)="cookBy.set(null)"
          >
            עדיין לא
          </button>
        </div>
      </fieldset>

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <div class="actions">
        <button type="submit" class="primary" [disabled]="!title().trim() || saving()">שמור</button>
        @if (data.meal) {
          <button type="button" class="ghost danger" (click)="remove()">מחק</button>
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
        margin: 0 0 16px;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text);
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
        padding: 0 18px;
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
        padding: 0 18px;
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
  private family = inject(FamilyService);

  readonly title = signal(this.data.meal?.title ?? '');
  readonly startCookingAt = signal(this.data.meal?.startCookingAt ?? '');
  readonly cookBy = signal<string | null>(this.data.meal?.cookBy ?? null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly members = computed(() => this.family.members());

  async save(): Promise<void> {
    const title = this.title().trim();
    if (!title) return;

    this.saving.set(true);
    try {
      await this.schedule.setMeal({
        date: this.data.date,
        title,
        cookBy: this.cookBy() ?? undefined,
        startCookingAt: this.startCookingAt() || undefined,
      });
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(): Promise<void> {
    try {
      await this.schedule.deleteMeal(this.data.date);
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו למחוק. נסה שוב.');
    }
  }
}

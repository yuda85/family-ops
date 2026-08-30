import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import { dayOfWeekOf } from '../../core/schedule/date-utils';
import type { ChoreCadence, DateStr, DayChore } from '../../core/schedule/schedule.models';

export interface ChoreSheetData {
  date: DateStr;
  chore?: DayChore;
}

/** How often, from the household's point of view. */
type Repeat = 'once' | 'daily' | 'weekly';

/** Which days an edit applies to. */
type Scope = 'once' | 'series';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * A chore, one-off or repeating.
 *
 * Same shape as the dinners and the activities: a plan that repeats, and a
 * per-date entry that overrides it. Whether it is done is always per-date,
 * even for a chore that repeats every day.
 *
 * An assignee is optional on purpose - plenty of chores belong to whoever
 * gets there first, and forcing a name onto every one of them is friction.
 */
@Component({
  selector: 'app-chore-sheet',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="sheet" (ngSubmit)="save()">
      <h2>{{ data.chore ? 'עריכת מטלה' : 'מטלה חדשה' }}</h2>

      <label class="field">
        <span>מה צריך לעשות</span>
        <input name="title" [(ngModel)]="title" autocomplete="off" placeholder="לפרוק מדיח" required />
      </label>

      <fieldset class="field">
        <legend id="who-label">מי אחראי</legend>
        <div class="choices" role="group" aria-labelledby="who-label">
          @for (member of members(); track member.id) {
            <button
              type="button"
              class="choice"
              [class.selected]="assigneeId() === member.id"
              [attr.aria-pressed]="assigneeId() === member.id"
              (click)="assigneeId.set(member.id)"
            >
              {{ member.displayName }}
            </button>
          }
          <button
            type="button"
            class="choice"
            [class.selected]="assigneeId() === null"
            [attr.aria-pressed]="assigneeId() === null"
            (click)="assigneeId.set(null)"
          >
            מי שיכול
          </button>
        </div>
      </fieldset>

      @if (isSeries()) {
        <fieldset class="field">
          <legend id="scope-label">על אילו ימים</legend>
          <div class="choices" role="group" aria-labelledby="scope-label">
            <button
              type="button"
              class="choice"
              [class.selected]="scope() === 'once'"
              [attr.aria-pressed]="scope() === 'once'"
              (click)="scope.set('once')"
            >
              רק היום
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
          @if (repeat() === 'weekly') {
            <p class="hint">כל יום {{ dayName }}.</p>
          }
        </fieldset>
      }

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <div class="actions">
        <button type="submit" class="primary" [disabled]="!title().trim() || saving()">שמור</button>
        @if (data.chore) {
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
export class ChoreSheetComponent {
  readonly data = inject<ChoreSheetData>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<ChoreSheetComponent>);
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly dayName = DAY_NAMES[dayOfWeekOf(this.data.date)];
  readonly repeats: Array<{ value: Repeat; label: string }> = [
    { value: 'once', label: 'רק היום' },
    { value: 'daily', label: 'כל יום' },
    { value: 'weekly', label: 'פעם בשבוע' },
  ];

  readonly title = signal(this.data.chore?.title ?? '');
  readonly assigneeId = signal<string | null>(this.data.chore?.assigneeId ?? null);
  readonly repeat = signal<Repeat>(this.data.chore?.cadence ?? 'once');
  readonly scope = signal<Scope>('once');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly members = computed(() => this.family.members());
  readonly isSeries = computed(() => !!this.data.chore?.planId);

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
        await this.schedule.deleteChorePlan(this.data.chore!.planId!);
      } else if (this.isSeries()) {
        // Keep the plan; drop it from this day only.
        await this.schedule.overrideChore(this.data.date, this.data.chore!.planId!, {
          cancelled: true,
        });
      } else {
        await this.schedule.deleteChoreEntry(this.data.chore!.id);
      }
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו למחוק. נסה שוב.');
    }
  }

  private async saveNew(title: string): Promise<void> {
    const assigneeId = this.assigneeId();

    if (this.repeat() === 'once') {
      await this.schedule.createChore({
        date: this.data.date,
        title,
        assigneeId,
        done: this.data.chore?.done ?? false,
      });
      return;
    }

    await this.schedule.createChorePlan({
      title,
      cadence: this.repeat() as ChoreCadence,
      ...(this.repeat() === 'weekly' ? { dayOfWeek: dayOfWeekOf(this.data.date) } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      activeFrom: this.data.date,
    });

    // A one-off sitting on this date would otherwise appear twice.
    if (this.data.chore && !this.data.chore.planId) {
      await this.schedule.deleteChoreEntry(this.data.chore.id).catch(() => undefined);
    }
  }

  private async saveOverride(title: string): Promise<void> {
    await this.schedule.overrideChore(this.data.date, this.data.chore!.planId!, {
      title,
      assigneeId: this.assigneeId(),
    });
  }

  private async saveSeries(title: string): Promise<void> {
    const planId = this.data.chore!.planId!;
    const cadence = (this.repeat() === 'once' ? 'daily' : this.repeat()) as ChoreCadence;
    const assigneeId = this.assigneeId();

    await this.schedule.updateChorePlan(planId, {
      title,
      cadence,
      ...(cadence === 'weekly' ? { dayOfWeek: dayOfWeekOf(this.data.date) } : {}),
      assigneeId: assigneeId ?? undefined,
    });

    // A per-date override would keep shadowing what we just changed.
    if (this.data.chore?.entryId) {
      await this.schedule
        .overrideChore(this.data.date, planId, { title: undefined, assigneeId: undefined })
        .catch(() => undefined);
    }
  }
}

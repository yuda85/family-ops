import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../../core/family/family.service';
import { ScheduleService } from '../../../core/schedule/schedule.service';
import type { Activity, PrepItem } from '../../../core/schedule/schedule.models';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/** Editable copy of an activity, plus the id when editing an existing one. */
interface Draft {
  id: string | null;
  childId: string;
  title: string;
  location: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  departureTime: string;
  drivers: Record<number, string>;
  prepItems: PrepItem[];
}

function emptyDraft(childId: string): Draft {
  return {
    id: null,
    childId,
    title: '',
    location: '',
    daysOfWeek: [],
    startTime: '',
    endTime: '',
    departureTime: '',
    drivers: {},
    prepItems: [],
  };
}

/**
 * The recurring templates every week is built from. This is the only screen
 * that writes an Activity; day-to-day changes go through overrides instead.
 */
@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    @if (draft(); as form) {
      <form class="editor" (ngSubmit)="save()">
        <header class="editor-head">
          <button type="button" class="icon" (click)="draft.set(null)" aria-label="ביטול">
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
          <h1>{{ form.id ? 'עריכת חוג' : 'חוג חדש' }}</h1>
        </header>

        <label class="field">
          <span>שם החוג</span>
          <input name="title" [ngModel]="form.title" (ngModelChange)="patch({ title: $event })"
            autocomplete="off" placeholder="התעמלות" required />
        </label>

        <label class="field">
          <span>איפה</span>
          <input name="location" [ngModel]="form.location"
            (ngModelChange)="patch({ location: $event })" autocomplete="off"
            placeholder="שמשית" />
        </label>

        <fieldset class="field">
          <legend>של מי</legend>
          <div class="choices">
            @for (child of children(); track child.id) {
              <button type="button" class="choice"
                [class.selected]="form.childId === child.id"
                [attr.aria-pressed]="form.childId === child.id"
                (click)="patch({ childId: child.id })">
                <span class="dot" [style.background]="'var(--child-' + child.color + ')'"></span>
                {{ child.name }}
              </button>
            }
          </div>
        </fieldset>

        <fieldset class="field">
          <legend>באילו ימים</legend>
          <div class="choices">
            @for (day of days; track day.index) {
              <button type="button" class="choice compact"
                [class.selected]="form.daysOfWeek.includes(day.index)"
                [attr.aria-pressed]="form.daysOfWeek.includes(day.index)"
                [attr.aria-label]="day.full"
                (click)="toggleDay(day.index)">
                {{ day.short }}
              </button>
            }
          </div>
        </fieldset>

        <div class="row">
          <label class="field">
            <span>מתחיל</span>
            <input name="startTime" type="time" [ngModel]="form.startTime"
              (ngModelChange)="patch({ startTime: $event })" required />
          </label>
          <label class="field">
            <span>נגמר</span>
            <input name="endTime" type="time" [ngModel]="form.endTime"
              (ngModelChange)="patch({ endTime: $event })" />
          </label>
        </div>

        <label class="field">
          <span>שעת יציאה מהבית</span>
          <input name="departureTime" type="time" [ngModel]="form.departureTime"
            (ngModelChange)="patch({ departureTime: $event })" />
          <small>ממנה נגזרות ההתראות. השאר ריק אם לא צריך להסיע.</small>
        </label>

        @if (form.departureTime && form.daysOfWeek.length) {
          <fieldset class="field">
            <legend>מי מסיע</legend>
            @for (index of sortedDays(); track index) {
              <div class="driver-row">
                <span class="driver-day">{{ dayNames[index] }}</span>
                <div class="choices">
                  @for (member of members(); track member.id) {
                    <button type="button" class="choice compact"
                      [class.selected]="form.drivers[index] === member.id"
                      [attr.aria-pressed]="form.drivers[index] === member.id"
                      (click)="setDriver(index, member.id)">
                      {{ member.displayName }}
                    </button>
                  }
                  <button type="button" class="choice compact"
                    [class.selected]="!form.drivers[index]"
                    [attr.aria-pressed]="!form.drivers[index]"
                    (click)="setDriver(index, null)">
                    —
                  </button>
                </div>
              </div>
            }
          </fieldset>
        }

        <fieldset class="field">
          <legend>מה להכין מראש</legend>
          @for (item of form.prepItems; track $index) {
            <div class="prep-row">
              <input [ngModel]="item.text" [name]="'prep' + $index"
                (ngModelChange)="setPrepText($index, $event)" placeholder="לארוז בגדי התעמלות" />
              <input type="number" min="0" max="72" [ngModel]="item.hoursBefore"
                [name]="'prepHours' + $index" (ngModelChange)="setPrepHours($index, $event)"
                aria-label="כמה שעות לפני" />
              <span class="unit">ש׳ לפני</span>
              <button type="button" class="icon" (click)="removePrep($index)" aria-label="הסר">
                <mat-icon aria-hidden="true">close</mat-icon>
              </button>
            </div>
          }
          <button type="button" class="add" (click)="addPrep()">
            <mat-icon aria-hidden="true">add</mat-icon>
            <span>הוסף הכנה</span>
          </button>
        </fieldset>

        @if (error(); as message) {
          <p class="error" role="alert">{{ message }}</p>
        }

        <div class="actions">
          <button type="submit" class="primary" [disabled]="!canSave() || saving()">שמור</button>
          @if (form.id) {
            <button type="button" class="ghost danger" (click)="remove(form.id)">מחק</button>
          }
        </div>
      </form>
    } @else {
      <header class="head">
        <h1>חוגים קבועים</h1>
        <button type="button" class="primary compact" (click)="startNew()" [disabled]="!children().length">
          <mat-icon aria-hidden="true">add</mat-icon>
          <span>חוג חדש</span>
        </button>
      </header>

      @if (!children().length) {
        <p class="empty">קודם צריך להוסיף ילדים.</p>
      }

      @for (group of grouped(); track group.childId) {
        <section class="group">
          <h2>
            <span class="dot" [style.background]="group.color"></span>
            {{ group.childName }}
          </h2>
          @for (activity of group.activities; track activity.id) {
            <button type="button" class="item" (click)="edit(activity)">
              <span class="item-title">{{ activity.title }}</span>
              <span class="item-sub">{{ summary(activity) }}</span>
            </button>
          }
        </section>
      } @empty {
        @if (children().length) {
          <p class="empty">אין עדיין חוגים.</p>
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 20px;
      }

      .head,
      .editor-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }

      h1 {
        flex: 1;
        margin: 0;
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--text);
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .group {
        margin-bottom: 20px;
      }

      .item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        min-height: 60px;
        padding: 10px 12px;
        margin-bottom: 8px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--surface);
        text-align: start;
        font: inherit;
        cursor: pointer;
      }

      .item-title {
        font-weight: 600;
        color: var(--text);
      }

      .item-sub {
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .empty {
        padding: 24px 0;
        color: var(--text-muted);
      }

      .field {
        display: block;
        margin-bottom: 16px;
        border: 0;
        padding: 0;
        min-width: 0;
      }

      .field > span,
      .field > legend {
        display: block;
        margin-bottom: 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .field small {
        display: block;
        margin-top: 4px;
        font-size: 0.75rem;
        color: var(--text-faint);
      }

      .row {
        display: flex;
        gap: 12px;
      }

      .row .field {
        flex: 1;
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
        display: inline-flex;
        align-items: center;
        gap: 6px;
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

      .choice.compact {
        min-width: 48px;
        padding: 0 12px;
        justify-content: center;
      }

      .choice.selected {
        border-color: var(--accent);
        background: var(--accent-wash);
        color: var(--accent);
      }

      .driver-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .driver-day {
        flex: 0 0 56px;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .prep-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
      }

      .prep-row input[type='number'] {
        width: 68px;
      }

      .unit {
        font-size: 0.8125rem;
        color: var(--text-muted);
        white-space: nowrap;
      }

      .icon {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        flex: 0 0 48px;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
      }

      .add {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 44px;
        background: none;
        border: 0;
        font: inherit;
        font-weight: 600;
        color: var(--accent);
        cursor: pointer;
      }

      .actions {
        display: flex;
        gap: 8px;
        margin: 24px 0 40px;
      }

      .primary {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 48px;
        border: 0;
        border-radius: 12px;
        background: var(--accent);
        color: var(--text-on-accent);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .primary.compact {
        flex: 0 0 auto;
        padding: 0 16px;
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
        color: var(--text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .ghost.danger {
        color: var(--danger);
        border-color: var(--danger);
      }

      .error {
        color: var(--danger);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class ActivitiesComponent {
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly dayNames = DAY_NAMES;
  /** Hebrew days are conventionally initialled, not truncated. */
  readonly days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map((short, index) => ({
    index,
    short,
    full: DAY_NAMES[index],
  }));

  readonly draft = signal<Draft | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly children = computed(() => this.family.sortedChildren());
  readonly members = computed(() => this.family.members());

  readonly grouped = computed(() =>
    this.children()
      .map((child) => ({
        childId: child.id,
        childName: child.name,
        color: `var(--child-${child.color})`,
        activities: this.schedule
          .activities()
          .filter((a) => a.childId === child.id)
          .sort((a, b) => a.title.localeCompare(b.title, 'he')),
      }))
      .filter((group) => group.activities.length)
  );

  readonly sortedDays = computed(() => [...(this.draft()?.daysOfWeek ?? [])].sort((a, b) => a - b));

  readonly canSave = computed(() => {
    const form = this.draft();
    return !!form?.title.trim() && !!form.childId && !!form.startTime && form.daysOfWeek.length > 0;
  });

  startNew(): void {
    this.error.set(null);
    this.draft.set(emptyDraft(this.children()[0]?.id ?? ''));
  }

  edit(activity: Activity): void {
    this.error.set(null);
    this.draft.set({
      id: activity.id,
      childId: activity.childId,
      title: activity.title,
      location: activity.location ?? '',
      daysOfWeek: [...activity.daysOfWeek],
      startTime: activity.startTime,
      endTime: activity.endTime ?? '',
      departureTime: activity.departureTime ?? '',
      drivers: { ...activity.drivers },
      prepItems: activity.prepItems.map((p) => ({ ...p })),
    });
  }

  patch(change: Partial<Draft>): void {
    this.draft.update((form) => (form ? { ...form, ...change } : form));
  }

  toggleDay(index: number): void {
    this.draft.update((form) => {
      if (!form) return form;
      const on = form.daysOfWeek.includes(index);
      const daysOfWeek = on
        ? form.daysOfWeek.filter((d) => d !== index)
        : [...form.daysOfWeek, index];
      const drivers = { ...form.drivers };
      if (on) delete drivers[index];
      return { ...form, daysOfWeek, drivers };
    });
  }

  setDriver(day: number, memberId: string | null): void {
    this.draft.update((form) => {
      if (!form) return form;
      const drivers = { ...form.drivers };
      if (memberId) drivers[day] = memberId;
      else delete drivers[day];
      return { ...form, drivers };
    });
  }

  addPrep(): void {
    this.draft.update((form) =>
      form ? { ...form, prepItems: [...form.prepItems, { text: '', hoursBefore: 12 }] } : form
    );
  }

  removePrep(index: number): void {
    this.draft.update((form) =>
      form ? { ...form, prepItems: form.prepItems.filter((_, i) => i !== index) } : form
    );
  }

  setPrepText(index: number, text: string): void {
    this.updatePrep(index, (item) => ({ ...item, text }));
  }

  setPrepHours(index: number, hours: number): void {
    this.updatePrep(index, (item) => ({ ...item, hoursBefore: Number(hours) || 0 }));
  }

  async save(): Promise<void> {
    const form = this.draft();
    if (!form || !this.canSave()) return;

    const payload = {
      childId: form.childId,
      title: form.title.trim(),
      location: form.location.trim() || undefined,
      daysOfWeek: [...form.daysOfWeek].sort((a, b) => a - b),
      startTime: form.startTime,
      endTime: form.endTime || undefined,
      departureTime: form.departureTime || undefined,
      // A driver for a day that is no longer selected would never be read.
      drivers: Object.fromEntries(
        Object.entries(form.drivers).filter(([day]) => form.daysOfWeek.includes(Number(day)))
      ),
      prepItems: form.prepItems.filter((p) => p.text.trim()),
    };

    this.saving.set(true);
    try {
      if (form.id) await this.schedule.updateActivity(form.id, payload);
      else await this.schedule.createActivity(payload);
      this.draft.set(null);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.schedule.deleteActivity(id);
      this.draft.set(null);
    } catch {
      this.error.set('לא הצלחנו למחוק. נסה שוב.');
    }
  }

  summary(activity: Activity): string {
    const days = [...activity.daysOfWeek]
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(', ');
    const departure = activity.departureTime ? ` · יציאה ${activity.departureTime}` : '';
    const place = activity.location ? ` · ${activity.location}` : '';
    return `${days} · ${activity.startTime}${place}${departure}`;
  }

  private updatePrep(index: number, change: (item: PrepItem) => PrepItem): void {
    this.draft.update((form) =>
      form
        ? { ...form, prepItems: form.prepItems.map((item, i) => (i === index ? change(item) : item)) }
        : form
    );
  }
}

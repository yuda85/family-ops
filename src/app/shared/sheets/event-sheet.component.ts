import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import type { DateStr } from '../../core/schedule/schedule.models';

export interface EventSheetData {
  date: DateStr;
}

/**
 * A one-off event: a dentist appointment, a birthday party. Stored as an
 * 'added' override so it lives on exactly one date and leaves the recurring
 * templates untouched.
 */
@Component({
  selector: 'app-event-sheet',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="sheet" (ngSubmit)="save()">
      <h2>אירוע חד-פעמי</h2>

      <label class="field">
        <span>מה</span>
        <input name="title" [(ngModel)]="title" autocomplete="off" placeholder="רופא שיניים" required />
      </label>

      <fieldset class="field">
        <legend>של מי</legend>
        <div class="choices">
          @for (child of children(); track child.id) {
            <button
              type="button"
              class="choice"
              [class.selected]="childId() === child.id"
              [attr.aria-pressed]="childId() === child.id"
              [style.border-color]="childId() === child.id ? 'var(--child-' + child.color + ')' : null"
              (click)="childId.set(child.id)"
            >
              <span class="dot" [style.background]="'var(--child-' + child.color + ')'"></span>
              {{ child.name }}
            </button>
          }
        </div>
      </fieldset>

      <div class="row">
        <label class="field">
          <span>שעת התחלה</span>
          <input name="startTime" type="time" [(ngModel)]="startTime" required />
        </label>
        <label class="field">
          <span>שעת יציאה</span>
          <input name="departureTime" type="time" [(ngModel)]="departureTime" />
        </label>
      </div>

      @if (departureTime()) {
        <fieldset class="field">
          <legend>מי מסיע</legend>
          <div class="choices">
            @for (member of members(); track member.id) {
              <button
                type="button"
                class="choice"
                [class.selected]="driverId() === member.id"
                [attr.aria-pressed]="driverId() === member.id"
                (click)="driverId.set(member.id)"
              >
                {{ member.displayName }}
              </button>
            }
            <button
              type="button"
              class="choice"
              [class.selected]="driverId() === null"
              [attr.aria-pressed]="driverId() === null"
              (click)="driverId.set(null)"
            >
              עדיין לא
            </button>
          </div>
        </fieldset>
      }

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <button type="submit" class="primary" [disabled]="!canSave() || saving()">הוסף</button>
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

      .choice.selected {
        border-width: 2px;
        background: var(--surface-hover);
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .primary {
        width: 100%;
        min-height: 48px;
        margin-top: 8px;
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
export class EventSheetComponent {
  readonly data = inject<EventSheetData>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<EventSheetComponent>);
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly title = signal('');
  readonly childId = signal<string | null>(null);
  readonly startTime = signal('');
  readonly departureTime = signal('');
  readonly driverId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly children = computed(() => this.family.sortedChildren());
  readonly members = computed(() => this.family.members());
  readonly canSave = computed(() => !!this.title().trim() && !!this.childId() && !!this.startTime());

  async save(): Promise<void> {
    if (!this.canSave()) return;

    this.saving.set(true);
    try {
      await this.schedule.createOverride({
        date: this.data.date,
        type: 'added',
        title: this.title().trim(),
        childId: this.childId()!,
        startTime: this.startTime(),
        departureTime: this.departureTime() || undefined,
        driverId: this.departureTime() ? this.driverId() : undefined,
        prepItems: [],
      });
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      this.saving.set(false);
    }
  }
}

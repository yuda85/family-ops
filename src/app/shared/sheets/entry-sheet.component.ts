import { Component, computed, inject, signal } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import type { DateStr, DayEntry } from '../../core/schedule/schedule.models';

export interface EntrySheetData {
  date: DateStr;
  entry: DayEntry;
}

/**
 * Quick edit for one entry on one day: who drives, and whether it happens.
 * Anything structural (times, recurrence, prep) belongs in the activity form.
 */
@Component({
  selector: 'app-entry-sheet',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="sheet">
      <h2>{{ data.entry.title }}</h2>
      <p class="sub">{{ childName() }} · {{ data.entry.startTime }}</p>

      @if (data.entry.departureTime) {
        <section>
          <h3 id="driver-label">מי מסיע</h3>
          <div class="choices" role="group" aria-labelledby="driver-label">
            @for (member of members(); track member.id) {
              <button
                type="button"
                class="choice"
                [class.selected]="driverId() === member.id"
                [attr.aria-pressed]="driverId() === member.id"
                (click)="chooseDriver(member.id)"
              >
                {{ member.displayName }}
              </button>
            }
            <button
              type="button"
              class="choice"
              [class.selected]="driverId() === null"
              [attr.aria-pressed]="driverId() === null"
              (click)="chooseDriver(null)"
            >
              עדיין לא
            </button>
          </div>
        </section>
      }

      <section>
        <button type="button" class="action" [class.danger]="!cancelled()" (click)="toggleCancel()">
          <mat-icon aria-hidden="true">{{ cancelled() ? 'undo' : 'event_busy' }}</mat-icon>
          <span>{{ cancelled() ? 'מתקיים בכל זאת' : 'לא מתקיים היום' }}</span>
        </button>
      </section>

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
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

      .action {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 48px;
        margin-top: 20px;
        padding: 0 16px;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .action.danger {
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
export class EntrySheetComponent {
  readonly data = inject<EntrySheetData>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<EntrySheetComponent>);
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly driverId = signal<string | null>(this.data.entry.driverId);
  readonly cancelled = signal(this.data.entry.cancelled);
  readonly error = signal<string | null>(null);

  readonly members = computed(() => this.family.members());
  readonly childName = computed(
    () => this.family.children().find((c) => c.id === this.data.entry.childId)?.name ?? ''
  );

  async chooseDriver(id: string | null): Promise<void> {
    const previous = this.driverId();
    this.driverId.set(id);
    try {
      await this.schedule.setDriver(this.data.date, this.data.entry, id);
      this.sheetRef.dismiss();
    } catch {
      this.driverId.set(previous);
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    }
  }

  async toggleCancel(): Promise<void> {
    const next = !this.cancelled();
    this.cancelled.set(next);
    try {
      await this.schedule.setCancelled(this.data.date, this.data.entry, next);
      this.sheetRef.dismiss();
    } catch {
      this.cancelled.set(!next);
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    }
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import { dayOfWeekOf } from '../../core/schedule/date-utils';
import type { DateStr, DayEntry } from '../../core/schedule/schedule.models';

export interface EntrySheetData {
  date: DateStr;
  entry: DayEntry;
}

/** Which weeks a change applies to. */
type Scope = 'once' | 'onwards';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * Everything you can do to one entry on one day: who drives, move it, or say
 * it is not happening.
 *
 * Both the driver and a move ask which weeks they apply to, but with opposite
 * defaults. A lift rota is a standing arrangement, so the driver defaults to
 * the whole series. A move is nearly always this week only.
 *
 * A move never edits the template in place: that would rewrite weeks which
 * already happened, so looking back would show a week that never took place.
 */
@Component({
  selector: 'app-entry-sheet',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="sheet">
      <h2>{{ data.entry.title }}</h2>
      <p class="sub">{{ subtitle() }}</p>

      @if (data.entry.departureTime) {
        <section>
          <h3 id="driver-label">מי מסיע</h3>

          @if (canMove()) {
            <div class="choices scope" role="group" aria-label="על אילו שבועות">
              <button
                type="button"
                class="choice small"
                [class.selected]="driverScope() === 'series'"
                [attr.aria-pressed]="driverScope() === 'series'"
                (click)="driverScope.set('series')"
              >
                כל הסדרה
              </button>
              <button
                type="button"
                class="choice small"
                [class.selected]="driverScope() === 'once'"
                [attr.aria-pressed]="driverScope() === 'once'"
                (click)="driverScope.set('once')"
              >
                רק הפעם הזו
              </button>
            </div>
          }

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
              [class.selected]="!noRide() && driverId() === null"
              [attr.aria-pressed]="!noRide() && driverId() === null"
              (click)="chooseDriver(null)"
            >
              עדיין לא
            </button>
            <button
              type="button"
              class="choice"
              [class.selected]="noRide()"
              [attr.aria-pressed]="noRide()"
              (click)="chooseNoRide()"
            >
              ללא הסעה
            </button>
          </div>
          @if (canMove()) {
            <p class="hint">{{ driverHint() }}</p>
          }
        </section>
      }

      @if (canMove()) {
        @if (!moving()) {
          <button type="button" class="action" (click)="startMove()">
            <mat-icon aria-hidden="true">event_repeat</mat-icon>
            <span>הזז</span>
          </button>
        } @else {
          <section class="move">
            <h3>להזיז ל</h3>
            <div class="row">
              <label class="field">
                <span>תאריך</span>
                <input type="date" [(ngModel)]="toDate" name="toDate" />
              </label>
              <label class="field">
                <span>שעה</span>
                <input type="time" [(ngModel)]="toTime" name="toTime" />
              </label>
            </div>

            <h3 id="scope-label">על אילו שבועות</h3>
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
                [class.selected]="scope() === 'onwards'"
                [attr.aria-pressed]="scope() === 'onwards'"
                (click)="scope.set('onwards')"
              >
                מהתאריך ואילך
              </button>
            </div>
            <p class="hint">{{ scopeHint() }}</p>

            <div class="actions">
              <button type="button" class="primary" [disabled]="!canSave() || busy()" (click)="save()">
                שמור
              </button>
              <button type="button" class="ghost" (click)="moving.set(false)">ביטול</button>
            </div>
          </section>
        }
      }

      @if (!moving()) {
        <button type="button" class="action" [class.danger]="!cancelled()" (click)="toggleCancel()">
          <mat-icon aria-hidden="true">{{ removeIcon() }}</mat-icon>
          <span>{{ removeLabel() }}</span>
        </button>
      }

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

      .choice.small {
        min-height: 40px;
        padding: 0 14px;
        font-size: 0.8125rem;
      }

      .choices.scope {
        margin-bottom: 10px;
      }

      .row {
        display: flex;
        gap: 12px;
      }

      .field {
        flex: 1;
        min-width: 0;
      }

      .field > span {
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

      .hint {
        margin: 8px 0 0;
        font-size: 0.8125rem;
        color: var(--text-faint);
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

      .actions {
        display: flex;
        gap: 8px;
        margin-top: 20px;
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
export class EntrySheetComponent {
  readonly data = inject<EntrySheetData>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<EntrySheetComponent>);
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);

  readonly driverId = signal<string | null>(this.data.entry.driverId);
  readonly noRide = signal(!this.data.entry.needsRide && !!this.data.entry.departureTime);
  readonly cancelled = signal(this.data.entry.cancelled);
  readonly error = signal<string | null>(null);

  /** A lift rota is a standing arrangement, so the series is the default. */
  readonly driverScope = signal<'series' | 'once'>('series');
  readonly moving = signal(false);
  readonly busy = signal(false);
  readonly scope = signal<Scope>('once');
  readonly toDate = signal<string>(this.data.date);
  readonly toTime = signal<string>(this.data.entry.startTime);

  readonly members = computed(() => this.family.members());

  /** Only a template-backed entry has a series to move. */
  readonly canMove = computed(() => !!this.data.entry.activityId);

  readonly subtitle = computed(() => {
    const child = this.family.children().find((c) => c.id === this.data.entry.childId)?.name;
    return [child, this.data.entry.location, this.data.entry.startTime].filter(Boolean).join(' · ');
  });

  readonly canSave = computed(() => {
    const date = this.toDate();
    const time = this.toTime();
    if (!date || !time) return false;
    return date !== this.data.date || time !== this.data.entry.startTime;
  });

  /** A one-off has no template behind it, so it is deleted rather than cancelled. */
  readonly isOneOff = computed(() => !this.data.entry.activityId);

  readonly removeLabel = computed(() => {
    if (this.isOneOff()) return 'מחק';
    return this.cancelled() ? 'מתקיים בכל זאת' : 'לא מתקיים היום';
  });

  readonly removeIcon = computed(() => {
    if (this.isOneOff()) return 'delete';
    return this.cancelled() ? 'undo' : 'event_busy';
  });

  readonly driverHint = computed(() =>
    this.driverScope() === 'series'
      ? `יחול על כל יום ${DAY_NAMES[dayOfWeekOf(this.data.date)]} מעכשיו.`
      : `רק ב-${this.data.date}. שאר השבועות לא ישתנו.`
  );

  readonly scopeHint = computed(() => {
    if (this.scope() === 'once') return 'שאר השבועות לא ישתנו.';
    const day = DAY_NAMES[dayOfWeekOf(this.toDate() || this.data.date)];
    return `מ-${this.toDate()} החוג יתקיים ביום ${day}. השבועות שכבר עברו יישארו כפי שהיו.`;
  });

  startMove(): void {
    this.error.set(null);
    this.moving.set(true);
  }

  async chooseDriver(id: string | null): Promise<void> {
    const previous = this.driverId();
    this.driverId.set(id);
    try {
      // Naming a driver implies there is a drive again.
      if (this.noRide()) {
        await this.schedule.setNoRide(this.data.date, this.data.entry, false, this.driverScope());
        this.noRide.set(false);
      }
      await this.schedule.setDriver(this.data.date, this.data.entry, id, this.driverScope());
      this.sheetRef.dismiss();
    } catch {
      this.driverId.set(previous);
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    }
  }

  async chooseNoRide(): Promise<void> {
    this.noRide.set(true);
    try {
      await this.schedule.setNoRide(this.data.date, this.data.entry, true, this.driverScope());
      this.sheetRef.dismiss();
    } catch {
      this.noRide.set(false);
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    }
  }

  async toggleCancel(): Promise<void> {
    try {
      if (this.isOneOff() || !this.cancelled()) {
        await this.schedule.removeEntry(this.data.date, this.data.entry);
      } else {
        await this.schedule.setCancelled(this.data.date, this.data.entry, false);
      }
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    }
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    this.busy.set(true);
    this.error.set(null);

    try {
      if (this.scope() === 'once') {
        await this.schedule.moveOccurrence(this.data.date, this.data.entry, {
          date: this.toDate(),
          startTime: this.toTime(),
          endTime: this.shiftedEnd(),
          departureTime: this.shiftedDeparture(),
        });
      } else {
        await this.moveSeries();
      }
      this.sheetRef.dismiss(true);
    } catch {
      this.error.set('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      this.busy.set(false);
    }
  }

  private async moveSeries(): Promise<void> {
    const activity = this.schedule.activities().find((a) => a.id === this.data.entry.activityId);
    if (!activity) throw new Error('missing activity');

    // Replace only the weekday being moved; an activity that also runs on
    // other days keeps them.
    const was = dayOfWeekOf(this.data.date);
    const now = dayOfWeekOf(this.toDate());
    const daysOfWeek = [...new Set([...activity.daysOfWeek.filter((d) => d !== was), now])];

    await this.schedule.moveSeriesFrom(this.toDate(), activity, {
      daysOfWeek,
      startTime: this.toTime(),
      endTime: this.shiftedEnd(),
      departureTime: this.shiftedDeparture(),
    });
  }

  /** Keep the original duration and lead time when the start moves. */
  private shiftedEnd(): string | undefined {
    return this.shiftBy(this.data.entry.endTime);
  }

  private shiftedDeparture(): string | undefined {
    return this.shiftBy(this.data.entry.departureTime);
  }

  private shiftBy(time: string | undefined): string | undefined {
    if (!time) return undefined;
    const delta = toMinutes(this.toTime()) - toMinutes(this.data.entry.startTime);
    const total = ((toMinutes(time) + delta) % 1440 + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

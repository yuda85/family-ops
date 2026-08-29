import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import { addDays, dayOfWeekOf, toDateStr } from '../../core/schedule/date-utils';
import type { DayEntry, DayView } from '../../core/schedule/schedule.models';
import {
  EntrySheetComponent,
  type EntrySheetData,
} from '../../shared/sheets/entry-sheet.component';
import { MealSheetComponent, type MealSheetData } from '../../shared/sheets/meal-sheet.component';
import {
  EventSheetComponent,
  type EventSheetData,
} from '../../shared/sheets/event-sheet.component';

interface EntryRow {
  entry: DayEntry;
  childName: string;
  childColor: string;
  driverName: string | null;
  isMine: boolean;
}

interface DayCard {
  view: DayView;
  dateObj: Date;
  isToday: boolean;
  rows: EntryRow[];
}

/**
 * The Saturday-night planning ritual: assign drivers, set the menu, see what
 * is different this week, add one-offs.
 *
 * Days are stacked vertically rather than laid out as seven columns - on a
 * phone seven columns are unreadable, and this screen is used on a phone.
 */
@Component({
  selector: 'app-week',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatBottomSheetModule],
  template: `
    <header class="week-header">
      <button type="button" class="nav" (click)="shift(-7)" aria-label="שבוע קודם">
        <mat-icon aria-hidden="true">chevron_right</mat-icon>
      </button>
      <h1><bdi class="range">{{ rangeLabel() }}</bdi></h1>
      <button type="button" class="nav" (click)="shift(7)" aria-label="שבוע הבא">
        <mat-icon aria-hidden="true">chevron_left</mat-icon>
      </button>
    </header>

    <p class="gaps" [class.clear]="!gaps().length">
      {{ gaps().length ? gaps().join(' · ') : 'השבוע סגור. אין חורים.' }}
    </p>

    @for (day of days(); track day.view.date) {
      <section class="day" [class.today]="day.isToday">
        <h2>
          <span class="day-name">{{ day.dateObj | date: 'EEEE' : undefined : 'he' }}</span>
          <span class="day-date">{{ day.dateObj | date: 'd/M' }}</span>
          @if (day.view.holiday; as holiday) {
            <span class="chip">{{ holiday.name }}</span>
          }
        </h2>

        @for (row of day.rows; track row.entry.id) {
          <button
            type="button"
            class="entry"
            [class.cancelled]="row.entry.cancelled"
            (click)="editEntry(day, row)"
          >
            <span class="entry-time">{{ row.entry.startTime }}</span>
            <span class="entry-bar" [style.background]="row.childColor" aria-hidden="true"></span>
            <span class="entry-title">{{ row.entry.title }} · {{ row.childName }}</span>
            @if (!row.entry.cancelled && row.entry.departureTime) {
              @if (row.driverName) {
                <span class="driver" [class.mine]="row.isMine">{{ row.driverName }}</span>
              } @else {
                <span class="driver missing">מי לוקח?</span>
              }
            }
          </button>
        }

        <button type="button" class="entry meal" (click)="editMeal(day)">
          <span class="entry-time">
            <mat-icon aria-hidden="true">restaurant</mat-icon>
          </span>
          @if (day.view.meal; as meal) {
            <span class="entry-title">{{ meal.title }}</span>
            @if (meal.startCookingAt) {
              <span class="driver">{{ meal.startCookingAt }}</span>
            }
          } @else {
            <span class="entry-title muted">מה אוכלים?</span>
          }
        </button>

        <button type="button" class="add" (click)="addEvent(day)">
          <mat-icon aria-hidden="true">add</mat-icon>
          <span>אירוע חד-פעמי</span>
        </button>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 12px;
      }

      .week-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .week-header h1 {
        flex: 1;
        text-align: center;
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--text);
      }

      .range {
        /* A date range reads left-to-right even inside an RTL page. */
        direction: ltr;
        unicode-bidi: isolate;
      }

      .nav {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border: 0;
        border-radius: 50%;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
      }

      .gaps {
        margin: 4px 0 16px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--danger-wash);
        color: var(--danger);
        font-size: 0.875rem;
        font-weight: 600;
      }

      .gaps.clear {
        background: var(--surface-hover);
        color: var(--text-muted);
      }

      .day {
        margin-bottom: 20px;
        padding: 12px;
        border-radius: 14px;
        background: var(--surface);
        border: 1px solid var(--border);
      }

      .day.today {
        border-color: var(--accent);
      }

      .day h2 {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 0 0 8px;
        font-size: 0.9375rem;
      }

      .day-name {
        font-weight: 700;
        color: var(--text);
      }

      .day-date {
        font-weight: 500;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      .chip {
        margin-inline-start: auto;
        padding: 2px 8px;
        border-radius: 10px;
        background: var(--accent-wash);
        color: var(--accent);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .entry {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 48px;
        padding: 4px;
        background: none;
        border: 0;
        text-align: start;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      .entry-time {
        flex: 0 0 44px;
        display: flex;
        align-items: center;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      .entry-time mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .entry-bar {
        flex: 0 0 4px;
        align-self: stretch;
        min-height: 28px;
        border-radius: 2px;
      }

      .entry-title {
        flex: 1;
        min-width: 0;
        font-size: 0.9375rem;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entry-title.muted {
        color: var(--text-muted);
      }

      .entry.cancelled .entry-title {
        text-decoration: line-through;
        color: var(--text-faint);
      }

      .driver {
        flex: 0 0 auto;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .driver.mine {
        color: var(--accent);
      }

      .driver.missing {
        color: var(--danger);
      }

      .add {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 44px;
        padding: 0 4px;
        background: none;
        border: 0;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
      }

      .add mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    `,
  ],
})
export class WeekComponent {
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);
  private auth = inject(AuthService);
  private sheet = inject(MatBottomSheet);

  /** Sunday of the week being planned. */
  readonly weekStart = signal(startOfWeek(toDateStr(new Date())));
  private today = toDateStr(new Date());

  readonly days = computed<DayCard[]>(() =>
    this.schedule.weekView(this.weekStart()).map((view) => ({
      view,
      dateObj: new Date(view.date + 'T00:00:00'),
      isToday: view.date === this.today,
      rows: view.entries.map((entry) => this.toRow(entry)),
    }))
  );

  readonly rangeLabel = computed(() => {
    const start = new Date(this.weekStart() + 'T00:00:00');
    const end = new Date(addDays(this.weekStart(), 6) + 'T00:00:00');
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(start)} – ${fmt(end)}`;
  });

  /** What is still missing this week, stated as a gap rather than a count. */
  readonly gaps = computed(() => {
    const days = this.days();
    const rides = days.reduce(
      (sum, d) => sum + d.view.conflicts.filter((c) => c.kind === 'noDriver').length,
      0
    );
    const clashes = days.reduce(
      (sum, d) => sum + d.view.conflicts.filter((c) => c.kind === 'driverDoubleBooked').length,
      0
    );
    const mealless = days.filter((d) => !d.view.meal).length;

    const parts: string[] = [];
    if (rides) parts.push(rides === 1 ? 'הסעה אחת ללא מסיע' : `${rides} הסעות ללא מסיע`);
    if (clashes) parts.push(clashes === 1 ? 'התנגשות אחת' : `${clashes} התנגשויות`);
    if (mealless) parts.push(mealless === 1 ? 'יום אחד ללא תפריט' : `${mealless} ימים ללא תפריט`);
    return parts;
  });

  shift(days: number): void {
    this.weekStart.update((d) => addDays(d, days));
  }

  memberName(id?: string | null): string | null {
    if (!id) return null;
    return this.family.members().find((m) => m.id === id)?.displayName ?? null;
  }

  editEntry(day: DayCard, row: EntryRow): void {
    const data: EntrySheetData = { date: day.view.date, entry: row.entry };
    this.sheet.open(EntrySheetComponent, { data });
  }

  editMeal(day: DayCard): void {
    const data: MealSheetData = { date: day.view.date, meal: day.view.meal };
    this.sheet.open(MealSheetComponent, { data });
  }

  addEvent(day: DayCard): void {
    const data: EventSheetData = { date: day.view.date };
    this.sheet.open(EventSheetComponent, { data });
  }

  private toRow(entry: DayEntry): EntryRow {
    const child = this.family.children().find((c) => c.id === entry.childId);
    return {
      entry,
      childName: child?.name ?? '',
      childColor: child ? `var(--child-${child.color})` : 'var(--border-strong)',
      driverName: this.memberName(entry.driverId),
      isMine: !!entry.driverId && entry.driverId === this.auth.user()?.id,
    };
  }
}

/** Israeli weeks start on Sunday. */
function startOfWeek(date: string): string {
  return addDays(date, -dayOfWeekOf(date));
}

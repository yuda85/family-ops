import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';

import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { ScheduleService } from '../../core/schedule/schedule.service';
import { addDays, toDateStr, toMinutes, toTimeStr } from '../../core/schedule/date-utils';
import type { DayEntry, DayView } from '../../core/schedule/schedule.models';
import { EntrySheetComponent, type EntrySheetData } from '../../shared/sheets/entry-sheet.component';

/** A timeline row, already resolved to display strings. */
interface Row {
  entry: DayEntry;
  childName: string;
  childColor: string;
  driverName: string | null;
  isMine: boolean;
  minutes: number;
}

/** The one thing worth looking at first. */
interface NextUp {
  time: string;
  label: string;
  detail: string;
  isMine: boolean;
}

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatBottomSheetModule],
  template: `
    <header class="day-header">
      <h1>{{ dateObj() | date: 'EEEE, d בMMMM' : undefined : 'he' }}</h1>
      @if (banner(); as text) {
        <p class="banner">
          <mat-icon aria-hidden="true">info</mat-icon>
          <span>{{ text }}</span>
        </p>
      }
    </header>

    @if (nextUp(); as next) {
      <section class="next-up" [class.mine]="next.isMine" aria-label="הדבר הבא">
        <span class="eyebrow">הדבר הבא</span>
        <p class="next-line">
          <span class="next-time">{{ next.time }}</span>
          <span class="next-label">{{ next.label }}</span>
        </p>
        <p class="next-detail">{{ next.detail }}</p>
      </section>
    }

    <section class="timeline" aria-label="לוח היום">
      @for (row of rows(); track row.entry.id) {
        @if (showNowLineBefore(row)) {
          <p class="now-line" aria-hidden="true"><span>עכשיו</span></p>
        }
        <button
          type="button"
          class="row"
          [class.cancelled]="row.entry.cancelled"
          (click)="openEntry(row)"
        >
          <span class="row-time">{{ row.entry.startTime }}</span>
          <span class="row-bar" [style.background]="row.childColor" aria-hidden="true"></span>
          <span class="row-body">
            <span class="row-title">{{ row.entry.title }}</span>
            <span class="row-sub">{{ subtitle(row) }}</span>
          </span>
          @if (!row.entry.cancelled && row.entry.departureTime) {
            @if (row.driverName) {
              <span class="row-driver" [class.mine]="row.isMine">{{ row.driverName }}</span>
            } @else {
              <span class="row-driver missing">מי לוקח?</span>
            }
          }
        </button>
      }

      @if (nowLineAtEnd()) {
        <p class="now-line" aria-hidden="true"><span>עכשיו</span></p>
      }

      @if (view().meal; as meal) {
        <div class="row meal">
          <span class="row-time">{{ meal.startCookingAt ?? '' }}</span>
          <span class="row-bar neutral" aria-hidden="true"></span>
          <span class="row-body">
            <span class="row-title">ארוחת ערב: {{ meal.title }}</span>
            <span class="row-sub">{{ mealSubtitle() }}</span>
          </span>
        </div>
      }

      @if (!rows().length && !view().meal) {
        <p class="empty">אין כלום היום.</p>
      }
    </section>

    <section class="tomorrow">
      <button
        type="button"
        class="tomorrow-toggle"
        (click)="tomorrowOpen.set(!tomorrowOpen())"
        [attr.aria-expanded]="tomorrowOpen()"
      >
        <mat-icon aria-hidden="true">{{ tomorrowOpen() ? 'expand_less' : 'expand_more' }}</mat-icon>
        <span>מחר · {{ tomorrowLabel() }}</span>
      </button>
      @if (tomorrowOpen()) {
        <ul class="tomorrow-list">
          @for (row of tomorrowRows(); track row.entry.id) {
            <li [class.cancelled]="row.entry.cancelled">
              <span class="row-time">{{ row.entry.startTime }}</span>
              <span class="row-bar" [style.background]="row.childColor" aria-hidden="true"></span>
              <span>{{ row.entry.title }} · {{ row.childName }}</span>
            </li>
          } @empty {
            <li class="empty">אין כלום מחר.</li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 20px;
      }

      .day-header h1 {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
      }

      .banner {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 8px 0 0;
        padding: 8px 12px;
        border-radius: 10px;
        background: var(--danger-wash);
        color: var(--danger);
        font-size: 0.875rem;
        font-weight: 500;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .next-up {
        margin-top: 16px;
        padding: 16px;
        border-radius: 14px;
        background: var(--surface);
        border: 1px solid var(--border);
      }

      .next-up.mine {
        border-color: var(--accent);
      }

      .eyebrow {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .next-line {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin: 4px 0 0;
      }

      .next-time {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text);
        font-variant-numeric: tabular-nums;
      }

      .next-label {
        font-size: 1.0625rem;
        font-weight: 600;
        color: var(--text);
      }

      .next-detail {
        margin: 2px 0 0;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .timeline {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 56px;
        padding: 8px 4px;
        background: none;
        border: 0;
        border-bottom: 1px solid var(--border);
        text-align: start;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      .row:last-of-type {
        border-bottom: 0;
      }

      .row.meal {
        cursor: default;
      }

      .row-time {
        flex: 0 0 44px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      .row-bar {
        flex: 0 0 4px;
        align-self: stretch;
        border-radius: 2px;
        min-height: 32px;
      }

      .row-bar.neutral {
        background: var(--border-strong);
      }

      .row-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .row-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
      }

      .row-sub {
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .row-driver {
        flex: 0 0 auto;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .row-driver.mine {
        color: var(--accent);
      }

      .row-driver.missing {
        color: var(--danger);
      }

      .row.cancelled .row-title {
        text-decoration: line-through;
        color: var(--text-faint);
      }

      .row.cancelled .row-bar {
        opacity: 0.4;
      }

      .now-line {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 4px 0;
        color: var(--accent);
        font-size: 0.75rem;
        font-weight: 700;
      }

      .now-line::before,
      .now-line::after {
        content: '';
        height: 1px;
        background: var(--accent);
      }

      .now-line::before {
        flex: 0 0 44px;
      }

      .now-line::after {
        flex: 1;
      }

      .empty {
        padding: 24px 4px;
        color: var(--text-muted);
      }

      .tomorrow {
        margin-top: 24px;
        border-top: 1px solid var(--border);
      }

      .tomorrow-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        min-height: 48px;
        background: none;
        border: 0;
        font: inherit;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
      }

      .tomorrow-list {
        list-style: none;
        margin: 0 0 8px;
        padding: 0;
      }

      .tomorrow-list li {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        font-size: 0.9375rem;
        color: var(--text);
      }

      .tomorrow-list li.cancelled {
        color: var(--text-faint);
        text-decoration: line-through;
      }
    `,
  ],
})
export class TodayComponent {
  private schedule = inject(ScheduleService);
  private family = inject(FamilyService);
  private auth = inject(AuthService);
  private sheet = inject(MatBottomSheet);

  /** Ticks every minute so the now-line and the countdown stay honest. */
  private now = signal(new Date());
  readonly tomorrowOpen = signal(false);

  readonly today = computed(() => toDateStr(this.now()));
  readonly dateObj = computed(() => new Date(this.today() + 'T00:00:00'));
  readonly view = computed<DayView>(() => this.schedule.dayView(this.today()));
  readonly rows = computed(() => this.view().entries.map((e) => this.toRow(e)));

  readonly tomorrowRows = computed(() =>
    this.schedule.dayView(addDays(this.today(), 1)).entries.map((e) => this.toRow(e))
  );

  readonly tomorrowLabel = computed(() => {
    const count = this.tomorrowRows().filter((r) => !r.entry.cancelled).length;
    return count === 1 ? 'אירוע אחד' : `${count} אירועים`;
  });

  private readonly nowMinutes = computed(() => toMinutes(toTimeStr(this.now())));

  /** A holiday or an unresolved gap, stated once at the top of the day. */
  readonly banner = computed(() => {
    const { holiday, conflicts } = this.view();
    const parts: string[] = [];
    if (holiday) parts.push(holiday.cancelsSchool ? `${holiday.name} — אין לימודים` : holiday.name);
    for (const conflict of conflicts) parts.push(conflict.message);
    return parts.length ? parts.join(' · ') : null;
  });

  readonly nextUp = computed<NextUp | null>(() => {
    const minutes = this.nowMinutes();
    const upcoming = this.rows()
      .filter((r) => !r.entry.cancelled)
      .map((row) => {
        // Once the departure time has passed, the thing itself is still ahead.
        const departure = row.entry.departureTime ? toMinutes(row.entry.departureTime) : null;
        const start = toMinutes(row.entry.startTime);
        const at = departure !== null && departure >= minutes ? departure : start;
        return { row, at, leaving: at === departure };
      })
      .filter((x) => x.at >= minutes)
      .sort((a, b) => a.at - b.at)[0];

    if (!upcoming) return null;
    const { row, at, leaving } = upcoming;

    const detail = [
      row.driverName ? (row.isMine ? 'אתה מסיע' : `${row.driverName} מסיע`) : null,
      row.childName,
      `בעוד ${this.humanise(at - minutes)}`,
    ].filter(Boolean);

    return {
      time: leaving ? row.entry.departureTime! : row.entry.startTime,
      label: leaving ? `לצאת ל${row.entry.title}` : row.entry.title,
      detail: detail.join(' · '),
      isMine: row.isMine,
    };
  });

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    effect((onCleanup) => onCleanup(() => clearInterval(timer)));
  }

  subtitle(row: Row): string {
    if (row.entry.cancelled) {
      const reason = row.entry.cancelReason;
      return reason ? `${row.childName} · לא מתקיים — ${reason}` : `${row.childName} · לא מתקיים`;
    }
    if (row.entry.departureTime) {
      return `${row.childName} · יציאה ${row.entry.departureTime}`;
    }
    return row.childName;
  }

  mealSubtitle(): string {
    const meal = this.view().meal;
    return meal?.startCookingAt ? `להתחיל ${meal.startCookingAt}` : '';
  }

  showNowLineBefore(row: Row): boolean {
    const rows = this.rows();
    const index = rows.indexOf(row);
    const minutes = this.nowMinutes();
    if (row.minutes < minutes) return false;
    const previous = rows[index - 1];
    return !previous || previous.minutes < minutes;
  }

  nowLineAtEnd(): boolean {
    const rows = this.rows();
    return rows.length > 0 && rows[rows.length - 1].minutes < this.nowMinutes();
  }

  memberName(id?: string | null): string | null {
    if (!id) return null;
    return this.family.members().find((m) => m.id === id)?.displayName ?? null;
  }

  openEntry(row: Row): void {
    const data: EntrySheetData = { date: this.today(), entry: row.entry };
    this.sheet.open(EntrySheetComponent, { data });
  }

  private toRow(entry: DayEntry): Row {
    const child = this.family.children().find((c) => c.id === entry.childId);
    return {
      entry,
      childName: child?.name ?? '',
      childColor: child ? `var(--child-${child.color})` : 'var(--border-strong)',
      driverName: this.memberName(entry.driverId),
      isMine: !!entry.driverId && entry.driverId === this.auth.user()?.id,
      minutes: toMinutes(entry.startTime),
    };
  }

  private humanise(minutes: number): string {
    if (minutes < 60) return `${minutes} דק׳`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} ש׳ ${rest} דק׳` : `${hours} שעות`;
  }
}

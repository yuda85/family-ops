import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FamilyService } from '../../../core/family/family.service';

type CalendarView = 'month' | 'week' | 'day';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="calendar-page">
      <header class="page-header">
        <div class="header-top">
          <h1>יומן משפחתי</h1>
          <button mat-fab color="primary" class="add-event-fab" aria-label="הוסף אירוע">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <div class="header-controls">
          <div class="date-navigation">
            <button mat-icon-button (click)="previousPeriod()">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <span class="current-date">{{ getCurrentDateLabel() }}</span>
            <button mat-icon-button (click)="nextPeriod()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button mat-button (click)="goToToday()">היום</button>
          </div>

          <mat-button-toggle-group
            [value]="currentView()"
            (change)="currentView.set($event.value)"
          >
            <mat-button-toggle value="month">חודש</mat-button-toggle>
            <mat-button-toggle value="week">שבוע</mat-button-toggle>
            <mat-button-toggle value="day">יום</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </header>

      <div class="calendar-container">
        @switch (currentView()) {
          @case ('month') {
            <div class="month-view">
              <div class="weekdays-header">
                @for (day of weekDays; track day) {
                  <div class="weekday">{{ day }}</div>
                }
              </div>
              <div class="days-grid">
                @for (week of monthWeeks(); track $index) {
                  <div class="week-row">
                    @for (day of week; track day.dateStr) {
                      <div
                        class="day-cell"
                        [class.other-month]="!day.isCurrentMonth"
                        [class.today]="day.isToday"
                        [class.selected]="isDateSelected(day.dateStr)"
                        (click)="selectDate(day.date)"
                      >
                        <span class="day-number">{{ day.dayNumber }}</span>
                        @if (day.events.length > 0) {
                          <div class="event-dots">
                            @for (event of day.events.slice(0, 3); track event.id) {
                              <span class="event-dot" [style.background]="event.color"></span>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          @case ('week') {
            <app-empty-state
              icon="view_week"
              title="תצוגת שבוע"
              description="תצוגת השבוע תהיה זמינה בקרוב"
            ></app-empty-state>
          }

          @case ('day') {
            <app-empty-state
              icon="today"
              title="תצוגת יום"
              description="תצוגת היום תהיה זמינה בקרוב"
            ></app-empty-state>
          }
        }
      </div>

      @if (selectedDate()) {
        <div class="selected-day-events">
          <h3>אירועים ב-{{ formatDate(selectedDate()!) }}</h3>
          <app-empty-state
            icon="event"
            title="אין אירועים"
            description="לחצו על + כדי להוסיף אירוע חדש"
            actionLabel="הוסף אירוע"
            actionIcon="add"
            (action)="addEvent()"
          ></app-empty-state>
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .add-event-fab {
      @media (min-width: 768px) {
        display: none;
      }
    }

    .header-controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .date-navigation {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .current-date {
        font-size: 1.125rem;
        font-weight: 500;
        min-width: 150px;
        text-align: center;
      }
    }

    .calendar-container {
      background: var(--surface-primary);
      border-radius: 1rem;
      border: 1px solid var(--border-subtle);
      overflow: hidden;
    }

    .month-view {
      .weekdays-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: var(--surface-secondary);
        border-bottom: 1px solid var(--border-subtle);

        .weekday {
          padding: 0.75rem 0.5rem;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
      }

      .days-grid {
        .week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid var(--border-subtle);

          &:last-child {
            border-bottom: none;
          }
        }

        .day-cell {
          min-height: 80px;
          padding: 0.5rem;
          border-inline-start: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background 0.15s ease;

          &:first-child {
            border-inline-start: none;
          }

          &:hover {
            background: var(--surface-hover);
          }

          &.other-month {
            .day-number {
              color: var(--text-disabled);
            }
          }

          &.today {
            .day-number {
              background: var(--color-primary);
              color: white;
            }
          }

          &.selected {
            background: var(--color-primary-alpha);
          }

          .day-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .event-dots {
            display: flex;
            gap: 2px;
            margin-top: 0.25rem;
            flex-wrap: wrap;

            .event-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }
          }

          @media (max-width: 767px) {
            min-height: 60px;
            padding: 0.25rem;

            .day-number {
              width: 24px;
              height: 24px;
              font-size: 0.75rem;
            }
          }
        }
      }
    }

    .selected-day-events {
      background: var(--surface-primary);
      border-radius: 1rem;
      border: 1px solid var(--border-subtle);
      padding: 1.5rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: var(--text-primary);
      }
    }
  `]
})
export class CalendarViewComponent {
  familyService = inject(FamilyService);

  currentView = signal<CalendarView>('month');
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);

  weekDays = ['ש', 'ו', 'ה', 'ד', 'ג', 'ב', 'א']; // Hebrew days, RTL

  // Computed signal for month weeks - recalculates only when currentDate changes
  monthWeeks = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const today = new Date();
    const todayStr = today.toDateString();

    // Adjust for week starting on Saturday (index 6)
    let startDay = firstDay.getDay();
    startDay = startDay === 6 ? 0 : startDay + 1;

    const weeks: Array<Array<{ date: Date; dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean; events: any[] }>> = [];
    let currentWeek: Array<{ date: Date; dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean; events: any[] }> = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonth.getDate() - i);
      currentWeek.push({
        date: d,
        dateStr: d.toDateString(),
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toDateString();

      currentWeek.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: [],
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add days from next month
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const d = new Date(year, month + 1, nextDay);
        currentWeek.push({
          date: d,
          dateStr: d.toDateString(),
          dayNumber: nextDay,
          isCurrentMonth: false,
          isToday: false,
          events: [],
        });
        nextDay++;
      }
      weeks.push(currentWeek);
    }

    return weeks;
  });

  // Check if a date is selected - separate from monthWeeks to avoid recalculating the grid
  isDateSelected(dateStr: string): boolean {
    const selected = this.selectedDate();
    return selected ? selected.toDateString() === dateStr : false;
  }

  getCurrentDateLabel(): string {
    const date = this.currentDate();
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  previousPeriod(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() - 1);
    this.currentDate.set(date);
  }

  nextPeriod(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + 1);
    this.currentDate.set(date);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.selectedDate.set(new Date());
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  addEvent(): void {
    // TODO: Open event creation modal
    console.log('Add event for date:', this.selectedDate());
  }
}
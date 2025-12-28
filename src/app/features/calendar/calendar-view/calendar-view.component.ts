import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FamilyService } from '../../../core/family/family.service';
import { CalendarService } from '../calendar.service';
import { CalendarEvent, CalendarEventInstance, EventCategory, getCategoryMeta } from '../../../core/family/family.models';
import { EventFormComponent } from '../event-form/event-form.component';

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
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
})
export class CalendarViewComponent implements OnInit {
  private dialog = inject(MatDialog);
  private calendarService = inject(CalendarService);
  familyService = inject(FamilyService);

  currentView = signal<CalendarView>('month');
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);

  // Hebrew weekdays for RTL display: Sunday (א) on right, Saturday (ש) on left
  weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']; // Sunday to Saturday

  // Use expanded events (includes recurring instances)
  expandedEvents = this.calendarService.expandedEvents;

  // Computed signal for month weeks
  monthWeeks = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const eventsMap = this.buildEventsMap();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const today = new Date();
    const todayStr = today.toDateString();

    // Week starts on Sunday (index 0), which is standard JavaScript getDay()
    const startDay = firstDay.getDay();

    const weeks: Array<Array<{
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: Array<{ id: string; color: string; isRecurring: boolean }>;
    }>> = [];
    let currentWeek: Array<{
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: Array<{ id: string; color: string; isRecurring: boolean }>;
    }> = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonth.getDate() - i);
      const dateStr = d.toDateString();
      currentWeek.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        events: eventsMap.get(dateStr) || [],
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
        events: eventsMap.get(dateStr) || [],
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
        const dateStr = d.toDateString();
        currentWeek.push({
          date: d,
          dateStr,
          dayNumber: nextDay,
          isCurrentMonth: false,
          isToday: false,
          events: eventsMap.get(dateStr) || [],
        });
        nextDay++;
      }
      weeks.push(currentWeek);
    }

    return weeks;
  });

  // Events for selected day (using expanded instances)
  selectedDayEvents = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];

    return this.calendarService.getEventsForDate(selected);
  });

  private buildEventsMap(): Map<string, Array<{ id: string; color: string; isRecurring: boolean }>> {
    const map = new Map<string, Array<{ id: string; color: string; isRecurring: boolean }>>();
    const instances = this.expandedEvents();

    for (const instance of instances) {
      const dateStr = instance.instanceDate.toDateString();
      const existing = map.get(dateStr) || [];
      existing.push({
        id: instance.event.id,
        color: getCategoryMeta(instance.event.category).color,
        isRecurring: !!instance.event.recurrence,
      });
      map.set(dateStr, existing);
    }

    return map;
  }

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

  formatEventTime(instance: CalendarEventInstance): string {
    if (instance.event.isAllDay) {
      return 'כל היום';
    }
    return instance.instanceStart.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTimeRange(instance: CalendarEventInstance): string {
    if (instance.event.isAllDay) {
      return 'כל היום';
    }
    const start = instance.instanceStart.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = instance.instanceEnd.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${start} - ${end}`;
  }

  formatRecurrence(event: CalendarEvent): string {
    if (!event.recurrence) return '';

    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    const days = event.recurrence.daysOfWeek
      .sort((a, b) => a - b)
      .map(d => dayNames[d])
      .join(', ');

    return `כל ${days}`;
  }

  getCategoryColor(category: EventCategory): string {
    return getCategoryMeta(category).color;
  }

  previousPeriod(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() - 1);
    this.currentDate.set(date);
    this.loadEventsForMonth(date);
  }

  nextPeriod(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + 1);
    this.currentDate.set(date);
    this.loadEventsForMonth(date);
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedDate.set(today);
    this.loadEventsForMonth(today);
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  addEvent(): void {
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        date: this.selectedDate() || new Date(),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh events after creation
        this.loadEventsForMonth(this.currentDate());
      }
    });
  }

  openEvent(instance: CalendarEventInstance): void {
    const dialogRef = this.dialog.open(EventFormComponent, {
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        event: instance.event,
        date: instance.instanceDate,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEventsForMonth(this.currentDate());
      }
    });
  }

  private loadEventsForMonth(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    this.calendarService.loadEvents(startDate, endDate);
  }

  ngOnInit(): void {
    // Load events for current month on init
    this.loadEventsForMonth(this.currentDate());
  }
}

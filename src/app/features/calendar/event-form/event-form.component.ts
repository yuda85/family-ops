import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { CalendarService } from '../calendar.service';
import { FamilyService } from '../../../core/family/family.service';
import {
  CalendarEvent,
  EventCategory,
  EVENT_CATEGORIES,
  CreateEventData,
} from '../../../core/family/family.models';

export interface EventFormDialogData {
  date: Date;
  event?: CalendarEvent;
}

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss',
})
export class EventFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private calendarService = inject(CalendarService);
  private familyService = inject(FamilyService);

  form!: FormGroup;
  categories = EVENT_CATEGORIES;
  children = this.familyService.sortedChildren;
  isLoading = signal(false);
  isEditMode = false;

  // Hebrew weekdays (Sunday=0 to Saturday=6)
  weekDays = [
    { value: 0, label: 'א׳' },
    { value: 1, label: 'ב׳' },
    { value: 2, label: 'ג׳' },
    { value: 3, label: 'ד׳' },
    { value: 4, label: 'ה׳' },
    { value: 5, label: 'ו׳' },
    { value: 6, label: 'ש׳' },
  ];

  constructor(
    public dialogRef: MatDialogRef<EventFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventFormDialogData
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data.event;
    this.initForm();
  }

  private initForm(): void {
    const event = this.data.event;
    const defaultDate = this.data.date;

    // Default times: current hour rounded up for start, +1 hour for end
    const now = new Date();
    const defaultStartHour = now.getHours() + 1;
    const defaultStartTime = `${String(defaultStartHour).padStart(2, '0')}:00`;
    const defaultEndTime = `${String(defaultStartHour + 1).padStart(2, '0')}:00`;

    // Default repeat end date: 1 month from now
    const defaultRepeatEndDate = new Date();
    defaultRepeatEndDate.setMonth(defaultRepeatEndDate.getMonth() + 1);

    this.form = this.fb.group({
      title: [event?.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [event?.description || ''],
      category: [event?.category || 'general', Validators.required],
      date: [event ? event.start.toDate() : defaultDate, Validators.required],
      startTime: [
        event ? this.formatTime(event.start.toDate()) : defaultStartTime,
        Validators.required,
      ],
      endTime: [
        event ? this.formatTime(event.end.toDate()) : defaultEndTime,
        Validators.required,
      ],
      isAllDay: [event?.isAllDay || false],
      isRepeating: [!!event?.recurrence],
      repeatDays: [event?.recurrence?.daysOfWeek || [] as number[]],
      repeatEndDate: [
        event?.recurrence?.endDate?.toDate() || defaultRepeatEndDate,
        Validators.required,
      ],
      childrenIds: [event?.childrenIds || []],
      location: [event?.location || ''],
      needsRide: [event?.needsRide || false],
    });

    // Watch isAllDay to disable time fields
    this.form.get('isAllDay')?.valueChanges.subscribe(isAllDay => {
      if (isAllDay) {
        this.form.get('startTime')?.disable();
        this.form.get('endTime')?.disable();
      } else {
        this.form.get('startTime')?.enable();
        this.form.get('endTime')?.enable();
      }
    });

    // Apply initial state
    if (event?.isAllDay) {
      this.form.get('startTime')?.disable();
      this.form.get('endTime')?.disable();
    }
  }

  private formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  // Category helpers for custom select trigger
  getSelectedCategoryIcon(): string {
    const categoryId = this.form.get('category')?.value;
    return this.categories.find(c => c.id === categoryId)?.icon || 'event';
  }

  getSelectedCategoryColor(): string {
    const categoryId = this.form.get('category')?.value;
    return this.categories.find(c => c.id === categoryId)?.color || '#808080';
  }

  getSelectedCategoryLabel(): string {
    const categoryId = this.form.get('category')?.value;
    return this.categories.find(c => c.id === categoryId)?.labelHe || 'כללי';
  }

  getCategoryIcon(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.icon || 'event';
  }

  getCategoryColor(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.color || '#808080';
  }

  // Repeat day helpers
  toggleDay(dayValue: number): void {
    const current: number[] = this.form.get('repeatDays')?.value || [];
    const index = current.indexOf(dayValue);

    if (index === -1) {
      this.form.patchValue({ repeatDays: [...current, dayValue].sort() });
    } else {
      this.form.patchValue({
        repeatDays: current.filter(d => d !== dayValue),
      });
    }
  }

  isDaySelected(dayValue: number): boolean {
    const current: number[] = this.form.get('repeatDays')?.value || [];
    return current.includes(dayValue);
  }

  // Children helpers
  toggleChild(childId: string): void {
    const current: string[] = this.form.get('childrenIds')?.value || [];
    const index = current.indexOf(childId);

    if (index === -1) {
      this.form.patchValue({ childrenIds: [...current, childId] });
    } else {
      this.form.patchValue({
        childrenIds: current.filter(id => id !== childId),
      });
    }
  }

  isChildSelected(childId: string): boolean {
    const current: string[] = this.form.get('childrenIds')?.value || [];
    return current.includes(childId);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.form.getRawValue();

      // Build start and end dates
      const date = new Date(formValue.date);
      let start: Date;
      let end: Date;

      if (formValue.isAllDay) {
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      } else {
        const startTime = this.parseTime(formValue.startTime);
        const endTime = this.parseTime(formValue.endTime);

        start = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          startTime.hours,
          startTime.minutes
        );
        end = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          endTime.hours,
          endTime.minutes
        );
      }

      const eventData: CreateEventData = {
        title: formValue.title.trim(),
        description: formValue.description?.trim() || undefined,
        category: formValue.category as EventCategory,
        start,
        end,
        isAllDay: formValue.isAllDay,
        childrenIds: formValue.childrenIds,
        location: formValue.location?.trim() || undefined,
        needsRide: formValue.needsRide,
      };

      // Add recurrence if enabled and days selected
      if (formValue.isRepeating && formValue.repeatDays.length > 0) {
        eventData.recurrence = {
          daysOfWeek: formValue.repeatDays,
          endDate: new Date(formValue.repeatEndDate),
        };
      }

      if (this.isEditMode && this.data.event) {
        await this.calendarService.updateEvent(this.data.event.id, eventData);
      } else {
        await this.calendarService.createEvent(eventData);
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDelete(): Promise<void> {
    if (!this.data.event) return;

    this.isLoading.set(true);

    try {
      await this.calendarService.deleteEvent(this.data.event.id);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService, where, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import {
  CalendarEvent,
  CalendarEventInstance,
  CreateEventData,
  UpdateEventData,
} from '../../core/family/family.models';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Signals
  private _events = signal<CalendarEvent[]>([]);
  private _viewStartDate = signal<Date>(new Date());
  private _viewEndDate = signal<Date>(new Date());
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readable signals
  readonly events = this._events.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Computed signal that expands recurring events into instances
   * This generates virtual events for display without storing in Firestore
   */
  readonly expandedEvents = computed(() => {
    const events = this._events();
    const startDate = this._viewStartDate();
    const endDate = this._viewEndDate();
    const result: CalendarEventInstance[] = [];

    for (const event of events) {
      if (event.recurrence) {
        // Generate instances for recurring event
        const instances = this.generateRecurringInstances(event, startDate, endDate);
        result.push(...instances);
      } else {
        // Single event - create one instance
        result.push({
          event,
          instanceDate: event.start.toDate(),
          instanceStart: event.start.toDate(),
          instanceEnd: event.end.toDate(),
        });
      }
    }

    // Sort by start time
    return result.sort((a, b) => a.instanceStart.getTime() - b.instanceStart.getTime());
  });

  /**
   * Generate instances of a recurring event within a date range
   */
  private generateRecurringInstances(
    event: CalendarEvent,
    rangeStart: Date,
    rangeEnd: Date
  ): CalendarEventInstance[] {
    const instances: CalendarEventInstance[] = [];
    const recurrence = event.recurrence!;
    const eventStart = event.start.toDate();
    const eventEnd = event.end.toDate();
    const recurrenceEnd = recurrence.endDate.toDate();

    // Calculate event duration in milliseconds
    const duration = eventEnd.getTime() - eventStart.getTime();

    // Get the time components from the original event
    const startHours = eventStart.getHours();
    const startMinutes = eventStart.getMinutes();

    // Start from the beginning of the range or the event start, whichever is later
    const iterateStart = new Date(Math.max(rangeStart.getTime(), eventStart.getTime()));
    // Go back to start of week to ensure we don't miss any occurrences
    iterateStart.setDate(iterateStart.getDate() - iterateStart.getDay());

    // End at the range end or recurrence end, whichever is earlier
    const iterateEnd = new Date(Math.min(rangeEnd.getTime(), recurrenceEnd.getTime()));

    // Iterate through each day in the range
    const current = new Date(iterateStart);
    while (current <= iterateEnd) {
      const dayOfWeek = current.getDay();

      // Check if this day of week is in the recurrence pattern
      if (recurrence.daysOfWeek.includes(dayOfWeek)) {
        // Create instance date with the correct time
        const instanceStart = new Date(current);
        instanceStart.setHours(startHours, startMinutes, 0, 0);

        // Only include if within the actual range and after the original event start
        if (instanceStart >= eventStart && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
          const instanceEnd = new Date(instanceStart.getTime() + duration);

          instances.push({
            event,
            instanceDate: new Date(instanceStart),
            instanceStart,
            instanceEnd,
          });
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return instances;
  }

  /**
   * Load events for a date range
   * Also loads recurring events that might have instances in the range
   */
  async loadEvents(startDate: Date, endDate: Date): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._events.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);
    this._viewStartDate.set(startDate);
    this._viewEndDate.set(endDate);

    try {
      // Get events that start within the range
      const regularEvents = await this.firestoreService.getCollection<CalendarEvent>(
        `families/${familyId}/events`,
        where('start', '>=', Timestamp.fromDate(startDate)),
        where('start', '<=', Timestamp.fromDate(endDate)),
        orderBy('start', 'asc')
      );

      // Also get recurring events that started before the range but may have instances in it
      // We query events that have recurrence and started before the range end
      const recurringEvents = await this.firestoreService.getCollection<CalendarEvent>(
        `families/${familyId}/events`,
        where('start', '<', Timestamp.fromDate(startDate)),
        orderBy('start', 'asc')
      );

      // Filter recurring events to only those that have recurrence and end after range start
      const relevantRecurring = recurringEvents.filter(e => {
        if (!e.recurrence) return false;
        const recurrenceEnd = e.recurrence.endDate.toDate();
        return recurrenceEnd >= startDate;
      });

      // Combine and deduplicate
      const allEvents = [...regularEvents];
      for (const recurring of relevantRecurring) {
        if (!allEvents.some(e => e.id === recurring.id)) {
          allEvents.push(recurring);
        }
      }

      this._events.set(allEvents);
    } catch (error: any) {
      console.error('Error loading events:', error);
      this._error.set('שגיאה בטעינת האירועים');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    const familyId = this.familyService.familyId();
    if (!familyId) return null;

    try {
      return await this.firestoreService.getDocument<CalendarEvent>(
        `families/${familyId}/events/${eventId}`
      );
    } catch (error: any) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(data: CreateEventData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה ליצור אירועים');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const eventData: Record<string, any> = {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        category: data.category,
        isFamilyEvent: data.childrenIds.length === 0,
        start: Timestamp.fromDate(data.start),
        end: Timestamp.fromDate(data.end),
        isAllDay: data.isAllDay,
        childrenIds: data.childrenIds,
        needsRide: data.needsRide,
        createdBy: userId,
      };

      // Add recurrence if provided
      if (data.recurrence && data.recurrence.daysOfWeek.length > 0) {
        eventData['recurrence'] = {
          daysOfWeek: data.recurrence.daysOfWeek,
          endDate: Timestamp.fromDate(data.recurrence.endDate),
        };
      }

      const eventId = await this.firestoreService.createDocument(
        `families/${familyId}/events`,
        eventData
      );

      return eventId;
    } catch (error: any) {
      console.error('Error creating event:', error);
      this._error.set('שגיאה ביצירת האירוע');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, data: UpdateEventData): Promise<void> {
    const familyId = this.familyService.familyId();

    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן אירועים');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const updateData: Record<string, any> = {};

      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined) updateData['description'] = data.description || null;
      if (data.location !== undefined) updateData['location'] = data.location || null;
      if (data.category !== undefined) updateData['category'] = data.category;
      if (data.start !== undefined) updateData['start'] = Timestamp.fromDate(data.start);
      if (data.end !== undefined) updateData['end'] = Timestamp.fromDate(data.end);
      if (data.isAllDay !== undefined) updateData['isAllDay'] = data.isAllDay;
      if (data.childrenIds !== undefined) {
        updateData['childrenIds'] = data.childrenIds;
        updateData['isFamilyEvent'] = data.childrenIds.length === 0;
      }
      if (data.needsRide !== undefined) updateData['needsRide'] = data.needsRide;
      if (data.driverUserId !== undefined) updateData['driverUserId'] = data.driverUserId || null;

      await this.firestoreService.updateDocument(
        `families/${familyId}/events/${eventId}`,
        updateData
      );
    } catch (error: any) {
      console.error('Error updating event:', error);
      this._error.set('שגיאה בעדכון האירוע');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const familyId = this.familyService.familyId();

    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק אירועים');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.firestoreService.deleteDocument(
        `families/${familyId}/events/${eventId}`
      );

      // Remove from local state
      this._events.update(events => events.filter(e => e.id !== eventId));
    } catch (error: any) {
      console.error('Error deleting event:', error);
      this._error.set('שגיאה במחיקת האירוע');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get expanded event instances for a specific date
   */
  getEventsForDate(date: Date): CalendarEventInstance[] {
    const dateStr = date.toDateString();
    return this.expandedEvents().filter(instance => {
      return instance.instanceDate.toDateString() === dateStr;
    });
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}

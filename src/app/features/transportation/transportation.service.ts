import { Injectable, inject, signal, computed } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService, where, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { CalendarService } from '../calendar/calendar.service';
import {
  TransportationTask,
  TransportationTaskView,
  TransportationDayView,
  MyDutiesTodayView,
  CreateTransportationTaskData,
  UpdateTransportationTaskData,
  CalendarEvent,
  CalendarEventInstance,
  FamilyChild,
  FamilyMember,
  EventCategory,
  WeekStartDay,
} from '../../core/family/family.models';

/**
 * Hebrew day names for display
 */
const HEBREW_DAY_NAMES = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'שבת'];
const HEBREW_DAY_NAMES_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

@Injectable({
  providedIn: 'root',
})
export class TransportationService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);
  private calendarService = inject(CalendarService);

  // Signals
  private _tasks = signal<TransportationTask[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _viewStartDate = signal<Date>(new Date());
  private _viewEndDate = signal<Date>(new Date());

  // Public readable signals
  readonly tasks = this._tasks.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Tasks grouped by date key
   */
  readonly tasksByDate = computed(() => {
    const tasks = this._tasks();
    const grouped = new Map<string, TransportationTask[]>();

    for (const task of tasks) {
      const existing = grouped.get(task.dateKey) ?? [];
      existing.push(task);
      grouped.set(task.dateKey, existing);
    }

    // Sort tasks within each day by start time
    for (const [key, dayTasks] of grouped) {
      dayTasks.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
    }

    return grouped;
  });

  /**
   * Get tasks for the current user
   */
  readonly myTasks = computed(() => {
    const userId = this.authService.userId();
    if (!userId) return [];
    return this._tasks().filter(task => task.driverUserId === userId);
  });

  /**
   * Get unassigned tasks
   */
  readonly unassignedTasks = computed(() => {
    return this._tasks().filter(task => !task.driverUserId);
  });

  /**
   * Generate date key in YYYY-MM-DD format
   */
  private generateDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse date from date key
   */
  private parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get Hebrew day name
   */
  private getHebrewDayName(dayOfWeek: number, full = false): string {
    return full ? HEBREW_DAY_NAMES_FULL[dayOfWeek] : HEBREW_DAY_NAMES[dayOfWeek];
  }

  /**
   * Format date label for display
   */
  private formatDateLabel(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (this.generateDateKey(date) === this.generateDateKey(today)) {
      return 'היום';
    }
    if (this.generateDateKey(date) === this.generateDateKey(tomorrow)) {
      return 'מחר';
    }

    const dayName = this.getHebrewDayName(date.getDay());
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `יום ${dayName} ${day}/${month}`;
  }

  /**
   * Load tasks for a date range and generate missing ones from events
   */
  async loadTasksForDateRange(startDate: Date, endDate: Date): Promise<void> {
    const familyId = this.familyService.familyId();

    if (!familyId) {
      this._tasks.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);
    this._viewStartDate.set(startDate);
    this._viewEndDate.set(endDate);

    try {
      // First, load existing tasks from Firestore
      const startKey = this.generateDateKey(startDate);
      const endKey = this.generateDateKey(endDate);

      const existingTasks = await this.firestoreService.getCollection<TransportationTask>(
        `families/${familyId}/transportationTasks`,
        where('dateKey', '>=', startKey),
        where('dateKey', '<=', endKey),
        orderBy('dateKey', 'asc')
      );

      // Then, generate tasks from calendar events
      await this.generateTasksFromEvents(startDate, endDate, existingTasks);

      // Reload to get the complete list
      const allTasks = await this.firestoreService.getCollection<TransportationTask>(
        `families/${familyId}/transportationTasks`,
        where('dateKey', '>=', startKey),
        where('dateKey', '<=', endKey),
        orderBy('dateKey', 'asc')
      );

      this._tasks.set(allTasks);
    } catch (error: any) {
      console.error('Error loading transportation tasks:', error);
      this._error.set('שגיאה בטעינת משימות ההסעה');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Generate transportation tasks from calendar events with needsRide
   */
  private async generateTasksFromEvents(
    startDate: Date,
    endDate: Date,
    existingTasks: TransportationTask[]
  ): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    if (!familyId || !userId) return;

    // Load calendar events for the range
    await this.calendarService.loadEvents(startDate, endDate);

    // Get the raw events and expand them ourselves to avoid timing issues with computed signals
    const events = this.calendarService.events();
    const eventInstances = this.expandEventsForRange(events, startDate, endDate);

    // Filter to only events that need rides
    const rideEvents = eventInstances.filter(instance => instance.event.needsRide);

    // Build a set of existing (eventId, dateKey) pairs
    const existingPairs = new Set(
      existingTasks
        .filter(t => t.eventId)
        .map(t => `${t.eventId}:${t.dateKey}`)
    );

    // Create tasks for events that don't have them yet
    const tasksToCreate: Array<Omit<TransportationTask, 'id'>> = [];

    for (const instance of rideEvents) {
      const dateKey = this.generateDateKey(instance.instanceDate);
      const pairKey = `${instance.event.id}:${dateKey}`;

      if (!existingPairs.has(pairKey)) {
        // Determine default driver
        let defaultDriverId: string | null = null;
        const dayOfWeek = instance.instanceDate.getDay();

        if (instance.event.defaultDrivers?.[dayOfWeek]) {
          defaultDriverId = instance.event.defaultDrivers[dayOfWeek];
        } else if (instance.event.driverUserId) {
          defaultDriverId = instance.event.driverUserId;
        }

        // Build task data without undefined values (Firestore doesn't accept undefined)
        const taskData: Record<string, any> = {
          eventId: instance.event.id,
          dateKey,
          date: Timestamp.fromDate(instance.instanceDate),
          driverUserId: defaultDriverId,
          status: 'pending',
          title: instance.event.title,
          category: instance.event.category,
          startTime: Timestamp.fromDate(instance.instanceStart),
          endTime: Timestamp.fromDate(instance.instanceEnd),
          childrenIds: instance.event.childrenIds,
          isStandalone: false,
          createdBy: userId,
        };

        // Only add optional fields if they have values
        if (defaultDriverId) {
          taskData['driverAssignedBy'] = userId;
          taskData['driverAssignedAt'] = Timestamp.now();
        }
        if (instance.event.location) {
          taskData['location'] = instance.event.location;
        }

        tasksToCreate.push(taskData as Omit<TransportationTask, 'id'>);
      }
    }

    // Create the tasks in Firestore
    for (const taskData of tasksToCreate) {
      try {
        await this.firestoreService.createDocument(
          `families/${familyId}/transportationTasks`,
          taskData
        );
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }
  }

  /**
   * Assign a driver to a task
   */
  async assignDriver(taskId: string, driverUserId: string | null): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן משימות');
    }

    try {
      await this.firestoreService.updateDocument(
        `families/${familyId}/transportationTasks/${taskId}`,
        {
          driverUserId,
          driverAssignedBy: driverUserId ? userId : null,
          driverAssignedAt: driverUserId ? Timestamp.now() : null,
        }
      );

      // Update local state
      this._tasks.update(tasks =>
        tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                driverUserId,
                driverAssignedBy: driverUserId ? userId : undefined,
                driverAssignedAt: driverUserId ? Timestamp.now() : undefined,
              }
            : t
        )
      );
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      this._error.set('שגיאה בשיבוץ הנהג');
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TransportationTask['status']): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    try {
      const updateData: Record<string, any> = { status };

      if (status === 'completed') {
        updateData['completedAt'] = Timestamp.now();
        updateData['completedBy'] = userId;
      }

      await this.firestoreService.updateDocument(
        `families/${familyId}/transportationTasks/${taskId}`,
        updateData
      );

      // Update local state
      this._tasks.update(tasks =>
        tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                status,
                ...(status === 'completed' && {
                  completedAt: Timestamp.now(),
                  completedBy: userId,
                }),
              }
            : t
        )
      );
    } catch (error: any) {
      console.error('Error updating task status:', error);
      this._error.set('שגיאה בעדכון סטטוס המשימה');
      throw error;
    }
  }

  /**
   * Create a standalone transportation task
   */
  async createStandaloneTask(data: CreateTransportationTaskData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה ליצור משימות');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const dateKey = this.generateDateKey(data.date);

      // Build task data without undefined values (Firestore doesn't accept undefined)
      const taskData: Record<string, any> = {
        eventId: null,
        dateKey,
        date: Timestamp.fromDate(data.date),
        driverUserId: data.driverUserId ?? null,
        status: 'pending',
        title: data.title,
        category: data.category,
        startTime: Timestamp.fromDate(data.startTime),
        childrenIds: data.childrenIds,
        isStandalone: true,
        createdBy: userId,
      };

      // Only add optional fields if they have values
      if (data.driverUserId) {
        taskData['driverAssignedBy'] = userId;
        taskData['driverAssignedAt'] = Timestamp.now();
      }
      if (data.endTime) {
        taskData['endTime'] = Timestamp.fromDate(data.endTime);
      }
      if (data.location) {
        taskData['location'] = data.location;
      }
      if (data.notes) {
        taskData['notes'] = data.notes;
      }

      const taskId = await this.firestoreService.createDocument(
        `families/${familyId}/transportationTasks`,
        taskData
      );

      // Add to local state if within current view range
      const startKey = this.generateDateKey(this._viewStartDate());
      const endKey = this.generateDateKey(this._viewEndDate());

      if (dateKey >= startKey && dateKey <= endKey) {
        const newTask: TransportationTask = {
          ...taskData,
          id: taskId,
        } as TransportationTask;

        this._tasks.update(tasks => [...tasks, newTask]);
      }

      return taskId;
    } catch (error: any) {
      console.error('Error creating standalone task:', error);
      this._error.set('שגיאה ביצירת המשימה');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update a transportation task
   */
  async updateTask(taskId: string, data: UpdateTransportationTaskData): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן משימות');
    }

    try {
      const updateData: Record<string, any> = {};

      if (data.driverUserId !== undefined) {
        updateData['driverUserId'] = data.driverUserId;
        updateData['driverAssignedBy'] = data.driverUserId ? userId : null;
        updateData['driverAssignedAt'] = data.driverUserId ? Timestamp.now() : null;
      }
      if (data.status !== undefined) updateData['status'] = data.status;
      if (data.notes !== undefined) updateData['notes'] = data.notes || null;
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.startTime !== undefined) updateData['startTime'] = Timestamp.fromDate(data.startTime);
      if (data.endTime !== undefined) updateData['endTime'] = Timestamp.fromDate(data.endTime);
      if (data.childrenIds !== undefined) updateData['childrenIds'] = data.childrenIds;
      if (data.location !== undefined) updateData['location'] = data.location || null;

      await this.firestoreService.updateDocument(
        `families/${familyId}/transportationTasks/${taskId}`,
        updateData
      );

      // Update local state
      this._tasks.update(tasks =>
        tasks.map(t => (t.id === taskId ? { ...t, ...updateData } : t))
      );
    } catch (error: any) {
      console.error('Error updating task:', error);
      this._error.set('שגיאה בעדכון המשימה');
      throw error;
    }
  }

  /**
   * Delete a transportation task
   */
  async deleteTask(taskId: string): Promise<void> {
    const familyId = this.familyService.familyId();

    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק משימות');
    }

    try {
      await this.firestoreService.deleteDocument(
        `families/${familyId}/transportationTasks/${taskId}`
      );

      // Remove from local state
      this._tasks.update(tasks => tasks.filter(t => t.id !== taskId));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      this._error.set('שגיאה במחיקת המשימה');
      throw error;
    }
  }

  /**
   * Get tasks for today and next 2 days for the current user (for dashboard)
   */
  async getMyTasksToday(): Promise<MyDutiesTodayView> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load 2 days ahead (today + 2 more days)
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 2);
    endDate.setHours(23, 59, 59, 999);

    const dateKey = this.generateDateKey(today);

    if (!familyId || !userId) {
      return {
        date: today,
        dateKey,
        myTasks: [],
        totalDuties: 0,
      };
    }

    try {
      // Load tasks for today + 2 days ahead
      await this.loadTasksForDateRange(today, endDate);

      // Get date keys for the 3 days
      const dateKeys: string[] = [];
      const current = new Date(today);
      for (let i = 0; i < 3; i++) {
        dateKeys.push(this.generateDateKey(current));
        current.setDate(current.getDate() + 1);
      }

      // Get my tasks from the loaded data for these 3 days
      const myTasks = this._tasks().filter(
        t => dateKeys.includes(t.dateKey) && t.driverUserId === userId
      );

      // Build task views
      const taskViews = await this.buildTaskViews(myTasks);

      return {
        date: today,
        dateKey,
        myTasks: taskViews,
        totalDuties: taskViews.length,
      };
    } catch (error) {
      console.error('Error loading duties:', error);
      return {
        date: today,
        dateKey,
        myTasks: [],
        totalDuties: 0,
      };
    }
  }

  /**
   * Build week view data for the planner
   */
  async buildWeekView(startDate: Date): Promise<TransportationDayView[]> {
    const days: TransportationDayView[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate end of week (7 days)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Load tasks for the week
    await this.loadTasksForDateRange(startDate, endDate);

    // Build view for each day
    const current = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const dateKey = this.generateDateKey(current);
      const dayTasks = this._tasks().filter(t => t.dateKey === dateKey);
      const taskViews = await this.buildTaskViews(dayTasks);

      const isToday = this.generateDateKey(current) === this.generateDateKey(today);
      const isTomorrow = this.generateDateKey(current) === this.generateDateKey(tomorrow);

      days.push({
        date: new Date(current),
        dateKey,
        dateLabel: this.formatDateLabel(current),
        dayName: this.getHebrewDayName(current.getDay()),
        isToday,
        isTomorrow,
        dayOfWeek: current.getDay(),
        tasks: taskViews,
        totalTasks: taskViews.length,
        assignedTasks: taskViews.filter(t => t.task.driverUserId).length,
        unassignedTasks: taskViews.filter(t => !t.task.driverUserId).length,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Build task views with related data
   */
  private async buildTaskViews(tasks: TransportationTask[]): Promise<TransportationTaskView[]> {
    const userId = this.authService.userId();
    const members = this.familyService.members();
    const children = this.familyService.sortedChildren();

    const views: TransportationTaskView[] = [];

    for (const task of tasks) {
      // Get related event if not standalone
      let event: CalendarEvent | null = null;
      if (task.eventId) {
        event = await this.calendarService.getEvent(task.eventId);
      }

      // Get children for this task
      const taskChildren = children.filter(c => task.childrenIds.includes(c.id));

      // Get driver
      const driver = task.driverUserId
        ? members.find(m => m.id === task.driverUserId) ?? null
        : null;

      views.push({
        task,
        event,
        children: taskChildren,
        driver,
        isCurrentUserDriver: task.driverUserId === userId,
      });
    }

    // Sort by start time
    views.sort((a, b) => a.task.startTime.toMillis() - b.task.startTime.toMillis());

    return views;
  }

  /**
   * Expand calendar events into instances for a date range
   * This duplicates logic from CalendarService but avoids timing issues with computed signals
   */
  private expandEventsForRange(events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEventInstance[] {
    const result: CalendarEventInstance[] = [];

    for (const event of events) {
      if (event.recurrence) {
        // Generate instances for recurring event
        const instances = this.generateRecurringInstances(event, startDate, endDate);
        result.push(...instances);
      } else {
        // Single event - check if it falls within range
        const eventStart = event.start.toDate();
        if (eventStart >= startDate && eventStart <= endDate) {
          result.push({
            event,
            instanceDate: eventStart,
            instanceStart: eventStart,
            instanceEnd: event.end.toDate(),
          });
        }
      }
    }

    return result;
  }

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
   * Get the start of the current week based on family settings
   * Default is Sunday (0), can be configured to Monday (1)
   */
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const weekStartDay = this.familyService.weekStartDay();

    // weekStartDay: 'sunday' = 0, 'monday' = 1
    const startDayNum = weekStartDay === 'monday' ? 1 : 0;

    // Calculate days to go back to reach the start of the week
    let diff = day - startDayNum;
    if (diff < 0) diff += 7;

    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}

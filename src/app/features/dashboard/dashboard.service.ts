import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import {
  query,
  where,
  getDocs,
  collection,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../core/firebase/firebase.config';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { CalendarService } from '../calendar/calendar.service';
import { ShoppingService } from '../shopping/shopping.service';
import { TopicsService } from '../topics/topics.service';
import { CalendarEventInstance } from '../../core/family/family.models';
import { TopicTask } from '../topics/topics.models';
import {
  ChildDashboardView,
  EventDayGroup,
  ShoppingStatusSummary,
  DashboardTask,
  DashboardTopic,
  DashboardStats,
} from './dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService implements OnDestroy {
  private db = getFirestoreDb();
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);
  private calendarService = inject(CalendarService);
  private shoppingService = inject(ShoppingService);
  private topicsService = inject(TopicsService);

  // Private signals
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _lastRefresh = signal<Date | null>(null);
  private _myTasks = signal<TopicTask[]>([]);

  // Public signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastRefresh = this._lastRefresh.asReadonly();

  /**
   * Date range for dashboard (today + 7 days)
   */
  readonly dateRange = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
    return { start: today, end: endDate };
  });

  /**
   * Current user name for greeting
   */
  readonly userName = computed(() => {
    const user = this.authService.user();
    if (!user) return '';
    const displayName = user.displayName || user.email || '';
    // Get first name (before space)
    return displayName.split(' ')[0];
  });

  /**
   * Get time-based greeting in Hebrew
   */
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 17) return 'צהריים טובים';
    if (hour < 21) return 'ערב טוב';
    return 'לילה טוב';
  });

  /**
   * Upcoming events for next 7 days, grouped by day
   */
  readonly upcomingEventsByDay = computed<EventDayGroup[]>(() => {
    const events = this.calendarService.expandedEvents();
    const range = this.dateRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter events within range
    const filtered = events.filter(
      (e) => e.instanceStart >= range.start && e.instanceStart <= range.end
    );

    // Group by date
    const groups = new Map<string, CalendarEventInstance[]>();
    for (const event of filtered) {
      const dateKey = event.instanceDate.toDateString();
      const existing = groups.get(dateKey) || [];
      existing.push(event);
      groups.set(dateKey, existing);
    }

    // Convert to EventDayGroup array
    const result: EventDayGroup[] = [];
    for (const [dateKey, dayEvents] of groups) {
      const date = new Date(dateKey);
      const isToday = date.toDateString() === today.toDateString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      result.push({
        date,
        dateLabel: this.formatDateLabel(date, isToday, isTomorrow),
        isToday,
        isTomorrow,
        events: dayEvents.sort(
          (a, b) => a.instanceStart.getTime() - b.instanceStart.getTime()
        ),
      });
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  /**
   * Children overview with their events and ride needs
   */
  readonly childrenOverview = computed<ChildDashboardView[]>(() => {
    const children = this.familyService.sortedChildren();
    const events = this.calendarService.expandedEvents();
    const range = this.dateRange();

    return children.map((child) => {
      // Filter events for this child within range
      const childEvents = events.filter(
        (e) =>
          e.event.childrenIds?.includes(child.id) &&
          e.instanceStart >= range.start &&
          e.instanceStart <= range.end
      );

      // Events needing rides
      const needsRide = childEvents.filter((e) => e.event.needsRide);

      return {
        child,
        upcomingEvents: childEvents,
        eventsNeedingRide: needsRide,
        hasRideNeeded: needsRide.length > 0,
      };
    });
  });

  /**
   * Shopping status summary
   */
  readonly shoppingStatus = computed<ShoppingStatusSummary>(() => {
    const list = this.shoppingService.activeList();
    return {
      hasActiveList: !!list,
      listName: list?.name || null,
      progress: this.shoppingService.progress(),
      totalItems: this.shoppingService.totalCount(),
      checkedItems: this.shoppingService.checkedCount(),
      isComplete: this.shoppingService.isListComplete(),
      activeShoppers: list?.activeShoppers || [],
      status: list?.status || null,
    };
  });

  /**
   * Important/urgent topics
   */
  readonly importantTopics = computed<DashboardTopic[]>(() => {
    const topics = this.topicsService.topics();
    const now = new Date();

    return topics
      .filter(
        (t) =>
          t.status === 'active' ||
          t.status === 'planning' ||
          t.priority === 'urgent' ||
          t.priority === 'high'
      )
      .map((topic) => {
        const deadline = topic.deadline?.toDate();
        const daysUntilDeadline = deadline
          ? Math.ceil(
              (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;

        const progress =
          topic.taskCount > 0
            ? (topic.completedTaskCount / topic.taskCount) * 100
            : 0;

        return {
          topic,
          isUrgent:
            topic.priority === 'urgent' ||
            (daysUntilDeadline !== null && daysUntilDeadline <= 3),
          daysUntilDeadline,
          progress,
        };
      })
      .sort((a, b) => {
        // Sort: urgent first, then by deadline
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
          return a.daysUntilDeadline - b.daysUntilDeadline;
        }
        return 0;
      })
      .slice(0, 5); // Limit to top 5
  });

  /**
   * My tasks (assigned to current user, not completed)
   */
  readonly myTasks = computed<DashboardTask[]>(() => {
    const tasks = this._myTasks();
    const topics = this.topicsService.topics();
    const now = new Date();

    return tasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .map((task) => {
        const topic = topics.find((t) => t.id === task.topicId);
        const dueDate = task.dueDate?.toDate();
        const daysUntilDue = dueDate
          ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          task,
          topic: topic!,
          isOverdue: daysUntilDue !== null && daysUntilDue < 0,
          daysUntilDue,
        };
      })
      .filter((t) => t.topic) // Only include tasks where we found the topic
      .sort((a, b) => {
        // Sort: overdue first, then by due date, then by priority
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.daysUntilDue !== null && b.daysUntilDue !== null) {
          return a.daysUntilDue - b.daysUntilDue;
        }
        if (a.daysUntilDue !== null) return -1;
        if (b.daysUntilDue !== null) return 1;
        return 0;
      })
      .slice(0, 4); // Limit to top 4
  });

  /**
   * Summary statistics
   */
  readonly stats = computed<DashboardStats>(() => {
    const eventsByDay = this.upcomingEventsByDay();
    const childrenView = this.childrenOverview();
    const topics = this.topicsService.topics();

    const totalEvents = eventsByDay.reduce(
      (sum, day) => sum + day.events.length,
      0
    );
    const ridesNeeded = childrenView.reduce(
      (sum, c) => sum + c.eventsNeedingRide.length,
      0
    );

    return {
      eventsNext7Days: totalEvents,
      ridesNeeded,
      pendingTasks: 0, // Would require cross-topic task loading
      activeTopics: topics.filter((t) => t.status === 'active').length,
      shoppingProgress: this.shoppingService.progress(),
    };
  });

  /**
   * Load all dashboard data
   */
  async loadDashboard(): Promise<void> {
    const range = this.dateRange();
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Start topics subscription (doesn't block)
      this.topicsService.subscribeToTopics();

      // Load calendar and shopping in parallel
      await Promise.all([
        this.calendarService.loadEvents(range.start, range.end),
        this.shoppingService.loadActiveList(),
      ]);

      // Wait for topics to be loaded, then load tasks
      await this.waitForTopicsAndLoadTasks();

      this._lastRefresh.set(new Date());
    } catch (error: unknown) {
      console.error('Error loading dashboard:', error);
      this._error.set('שגיאה בטעינת הדשבורד');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Wait for topics to be loaded, then load tasks
   */
  private async waitForTopicsAndLoadTasks(): Promise<void> {
    // Wait up to 5 seconds for topics to load
    const maxWait = 5000;
    const checkInterval = 100;
    let waited = 0;

    while (this.topicsService.topics().length === 0 && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    console.log('[Dashboard] Topics loaded after', waited, 'ms, count:', this.topicsService.topics().length);

    // Now load tasks
    await this.loadMyTasks();
  }

  /**
   * Load tasks assigned to the current user across all topics
   * Iterates through each topic and loads tasks from subcollection
   */
  private async loadMyTasks(): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    console.log('[Dashboard] loadMyTasks called');
    console.log('[Dashboard] familyId:', familyId);
    console.log('[Dashboard] userId:', userId);

    if (!familyId || !userId) {
      console.log('[Dashboard] Missing familyId or userId, returning empty');
      this._myTasks.set([]);
      return;
    }

    try {
      const topics = this.topicsService.topics();
      console.log('[Dashboard] Topics count:', topics.length);
      console.log('[Dashboard] Topics:', topics.map(t => ({ id: t.id, title: t.title })));

      const allTasks: TopicTask[] = [];

      // Load tasks from each topic's tasks subcollection
      const taskPromises = topics.map(async (topic) => {
        try {
          const tasksPath = `families/${familyId}/topics/${topic.id}/tasks`;
          console.log('[Dashboard] Querying tasks at:', tasksPath);

          const tasksRef = collection(this.db, tasksPath);
          const tasksQuery = query(
            tasksRef,
            where('assignedTo', 'array-contains', userId)
          );
          const snapshot = await getDocs(tasksQuery);

          console.log(`[Dashboard] Topic ${topic.id} - Found ${snapshot.docs.length} tasks assigned to user`);

          for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log('[Dashboard] Task found:', { id: doc.id, title: data['title'], assignedTo: data['assignedTo'], status: data['status'] });
            allTasks.push({
              id: doc.id,
              topicId: topic.id,
              title: data['title'],
              description: data['description'],
              assignedTo: data['assignedTo'] || [],
              dueDate: data['dueDate'],
              status: data['status'],
              priority: data['priority'] || 'medium',
              subtasks: data['subtasks'] || [],
              order: data['order'] || 0,
              createdBy: data['createdBy'],
              createdAt: data['createdAt'],
              updatedAt: data['updatedAt'],
              completedAt: data['completedAt'],
              completedBy: data['completedBy'],
            } as TopicTask);
          }
        } catch (err) {
          console.warn(`[Dashboard] Failed to load tasks for topic ${topic.id}:`, err);
        }
      });

      await Promise.all(taskPromises);
      console.log('[Dashboard] Total tasks loaded:', allTasks.length);
      console.log('[Dashboard] All tasks:', allTasks);
      this._myTasks.set(allTasks);
    } catch (error) {
      console.error('[Dashboard] Error loading my tasks:', error);
      this._myTasks.set([]);
    }
  }

  /**
   * Refresh dashboard data
   */
  async refresh(): Promise<void> {
    await this.loadDashboard();
  }

  /**
   * Format date label for display
   */
  private formatDateLabel(
    date: Date,
    isToday: boolean,
    isTomorrow: boolean
  ): string {
    if (isToday) return 'היום';
    if (isTomorrow) return 'מחר';

    const dayNames = [
      'יום א\'',
      'יום ב\'',
      'יום ג\'',
      'יום ד\'',
      'יום ה\'',
      'יום ו\'',
      'שבת',
    ];
    const day = dayNames[date.getDay()];
    const dateNum = date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'numeric',
    });
    return `${day} ${dateNum}`;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  ngOnDestroy(): void {
    // Clean up if needed
  }
}

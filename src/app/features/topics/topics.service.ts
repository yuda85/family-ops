import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { FirestoreService, where, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { CalendarService } from '../calendar/calendar.service';
import { EventCategory } from '../../core/family/family.models';
import {
  Topic,
  TopicStatus,
  TopicCategory,
  TopicPriority,
  TopicStatusGroup,
  CreateTopicData,
  UpdateTopicData,
  TOPIC_STATUSES,
  getStatusMeta,
  ContentSection,
} from './topics.models';

@Injectable({
  providedIn: 'root',
})
export class TopicsService implements OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);
  private calendarService = inject(CalendarService);

  // Subscriptions for real-time updates
  private topicsSubscription?: Subscription;
  private currentTopicSubscription?: Subscription;

  // Private signals
  private _topics = signal<Topic[]>([]);
  private _currentTopic = signal<Topic | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _filterStatus = signal<TopicStatus | 'all'>('all');
  private _filterCategory = signal<TopicCategory | 'all'>('all');
  private _searchQuery = signal('');
  private _collapsedStatuses = signal<Set<TopicStatus>>(new Set(['completed', 'archived']));

  // Public readonly signals
  readonly topics = this._topics.asReadonly();
  readonly currentTopic = this._currentTopic.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly filterCategory = this._filterCategory.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();

  // Computed signals
  readonly totalCount = computed(() => this._topics().length);

  readonly activeTopicsCount = computed(() =>
    this._topics().filter((t) => t.status === 'active' || t.status === 'planning').length
  );

  readonly filteredTopics = computed(() => {
    let result = this._topics();
    const status = this._filterStatus();
    const category = this._filterCategory();
    const search = this._searchQuery().toLowerCase().trim();

    // Filter by status
    if (status !== 'all') {
      result = result.filter((t) => t.status === status);
    }

    // Filter by category
    if (category !== 'all') {
      result = result.filter((t) => t.category === category);
    }

    // Filter by search query
    if (search) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      );
    }

    return result;
  });

  /**
   * Topics grouped by status for display
   */
  readonly groupedTopics = computed<TopicStatusGroup[]>(() => {
    const topics = this.filteredTopics();
    const collapsed = this._collapsedStatuses();

    // Group topics by status
    const groups = new Map<TopicStatus, Topic[]>();
    for (const topic of topics) {
      const existing = groups.get(topic.status) || [];
      existing.push(topic);
      groups.set(topic.status, existing);
    }

    // Convert to TopicStatusGroup array, sorted by status order
    const result: TopicStatusGroup[] = [];
    for (const statusMeta of TOPIC_STATUSES) {
      const statusTopics = groups.get(statusMeta.id);
      if (statusTopics && statusTopics.length > 0) {
        // Sort: pinned first, then by updatedAt
        statusTopics.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          const aTime = a.updatedAt?.toMillis() ?? a.createdAt?.toMillis() ?? 0;
          const bTime = b.updatedAt?.toMillis() ?? b.createdAt?.toMillis() ?? 0;
          return bTime - aTime;
        });

        result.push({
          status: statusMeta.id,
          statusMeta,
          topics: statusTopics,
          isCollapsed: collapsed.has(statusMeta.id),
        });
      }
    }

    return result;
  });

  /**
   * Progress of current topic (based on tasks)
   */
  readonly currentTopicProgress = computed(() => {
    const topic = this._currentTopic();
    if (!topic || topic.taskCount === 0) return 0;
    return (topic.completedTaskCount / topic.taskCount) * 100;
  });

  /**
   * Check if current topic has any tasks
   */
  readonly currentTopicHasTasks = computed(() => {
    const topic = this._currentTopic();
    return topic ? topic.taskCount > 0 : false;
  });

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  /**
   * Subscribe to all topics for the family
   */
  subscribeToTopics(): void {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._topics.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    // Unsubscribe from previous subscription
    this.topicsSubscription?.unsubscribe();

    // Subscribe to topics collection
    this.topicsSubscription = this.firestoreService
      .getCollection$<Topic>(
        `families/${familyId}/topics`,
        orderBy('updatedAt', 'desc')
      )
      .subscribe({
        next: (topics) => {
          this._topics.set(topics);
          this._isLoading.set(false);
        },
        error: (error) => {
          console.error('Error subscribing to topics:', error);
          this._error.set('שגיאה בטעינת נושאים');
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Subscribe to a specific topic for real-time updates
   */
  subscribeToTopic(topicId: string): void {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._currentTopic.set(null);
      return;
    }

    // Unsubscribe from previous subscription
    this.currentTopicSubscription?.unsubscribe();

    // Subscribe to topic document
    this.currentTopicSubscription = this.firestoreService
      .getDocument$<Topic>(`families/${familyId}/topics/${topicId}`)
      .subscribe({
        next: (topic) => {
          this._currentTopic.set(topic);
        },
        error: (error) => {
          console.error('Error subscribing to topic:', error);
          this._error.set('שגיאה בטעינת נושא');
        },
      });
  }

  /**
   * Load a specific topic (one-time fetch)
   */
  async loadTopic(topicId: string): Promise<Topic | null> {
    const familyId = this.familyService.familyId();
    if (!familyId) return null;

    try {
      const topic = await this.firestoreService.getDocument<Topic>(
        `families/${familyId}/topics/${topicId}`
      );
      this._currentTopic.set(topic);
      return topic;
    } catch (error) {
      console.error('Error loading topic:', error);
      this._error.set('שגיאה בטעינת נושא');
      return null;
    }
  }

  /**
   * Create a new topic
   */
  async createTopic(data: CreateTopicData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה ליצור נושאים');
    }

    const topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'> = {
      familyId,
      title: data.title,
      description: data.description || '',
      category: data.category,
      priority: data.priority || 'medium',
      status: 'planning',
      contentSections: [],
      linkedEventIds: [],
      linkedChildrenIds: data.linkedChildrenIds || [],
      targetDate: data.targetDate ? Timestamp.fromDate(data.targetDate) : undefined,
      deadline: data.deadline ? Timestamp.fromDate(data.deadline) : undefined,
      activeEditors: [],
      taskCount: 0,
      completedTaskCount: 0,
      commentCount: 0,
      attachmentCount: 0,
      isPinned: false,
      createdBy: userId,
    };

    const topicId = await this.firestoreService.createDocument(
      `families/${familyId}/topics`,
      topicData
    );

    // Log activity
    await this.logActivity(topicId, 'topic_created', 'נוצר נושא חדש');

    // Create calendar event if target date is provided
    if (data.targetDate) {
      try {
        const eventCategory = this.mapTopicCategoryToEventCategory(data.category);
        const eventId = await this.calendarService.createEvent({
          title: data.title,
          description: data.description || '',
          category: eventCategory,
          start: data.targetDate,
          end: data.targetDate, // All-day event
          isAllDay: true,
          childrenIds: data.linkedChildrenIds || [],
          needsRide: false,
        });

        // Link the event to the topic
        await this.linkEvent(topicId, eventId);
      } catch (error) {
        console.error('Error creating calendar event for topic:', error);
        // Don't fail the topic creation if calendar event fails
      }
    }

    return topicId;
  }

  /**
   * Map topic category to calendar event category
   */
  private mapTopicCategoryToEventCategory(topicCategory: TopicCategory): EventCategory {
    const mapping: Record<TopicCategory, EventCategory> = {
      vacation: 'vacation',
      home: 'other',
      finance: 'other',
      education: 'school',
      health: 'health',
      celebration: 'family',
      purchase: 'other',
      general: 'general',
    };
    return mapping[topicCategory] || 'general';
  }

  /**
   * Update a topic
   */
  async updateTopic(topicId: string, data: UpdateTopicData): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן נושאים');
    }

    const updateData: Record<string, any> = {
      lastEditedBy: userId,
      lastEditedAt: this.firestoreService.getServerTimestamp(),
    };

    if (data.title !== undefined) updateData['title'] = data.title;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.category !== undefined) updateData['category'] = data.category;
    if (data.priority !== undefined) updateData['priority'] = data.priority;
    if (data.linkedChildrenIds !== undefined) updateData['linkedChildrenIds'] = data.linkedChildrenIds;
    if (data.isPinned !== undefined) {
      updateData['isPinned'] = data.isPinned;
      updateData['pinnedAt'] = data.isPinned ? this.firestoreService.getServerTimestamp() : null;
    }
    if (data.contentSections !== undefined) updateData['contentSections'] = data.contentSections;
    if (data.targetDate !== undefined) {
      updateData['targetDate'] = data.targetDate ? Timestamp.fromDate(data.targetDate) : null;
    }
    if (data.deadline !== undefined) {
      updateData['deadline'] = data.deadline ? Timestamp.fromDate(data.deadline) : null;
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}`,
      updateData
    );

    await this.logActivity(topicId, 'topic_updated', 'עודכנו פרטי הנושא');
  }

  /**
   * Change topic status
   */
  async changeStatus(topicId: string, newStatus: TopicStatus): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לשנות סטטוס');
    }

    const topic = this._currentTopic() || this._topics().find((t) => t.id === topicId);
    const oldStatus = topic?.status;

    const updateData: Record<string, any> = {
      status: newStatus,
      lastEditedBy: userId,
      lastEditedAt: this.firestoreService.getServerTimestamp(),
    };

    if (newStatus === 'completed') {
      updateData['completedAt'] = this.firestoreService.getServerTimestamp();
      updateData['completedBy'] = userId;
    } else {
      updateData['completedAt'] = null;
      updateData['completedBy'] = null;
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}`,
      updateData
    );

    const oldStatusLabel = oldStatus ? getStatusMeta(oldStatus).labelHe : '';
    const newStatusLabel = getStatusMeta(newStatus).labelHe;
    await this.logActivity(
      topicId,
      'status_changed',
      `שונה סטטוס מ-${oldStatusLabel} ל-${newStatusLabel}`,
      undefined,
      undefined,
      oldStatus,
      newStatus
    );
  }

  /**
   * Toggle pin status
   */
  async togglePin(topicId: string): Promise<void> {
    const topic = this._currentTopic() || this._topics().find((t) => t.id === topicId);
    if (!topic) return;

    await this.updateTopic(topicId, { isPinned: !topic.isPinned });
  }

  /**
   * Delete a topic
   */
  async deleteTopic(topicId: string): Promise<void> {
    const familyId = this.familyService.familyId();

    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.isAdmin()) {
      throw new Error('רק מנהל יכול למחוק נושאים');
    }

    // TODO: Delete subcollections (tasks, comments, attachments, activities)

    await this.firestoreService.deleteDocument(
      `families/${familyId}/topics/${topicId}`
    );

    // Clear current topic if it was deleted
    if (this._currentTopic()?.id === topicId) {
      this._currentTopic.set(null);
    }
  }

  /**
   * Link a calendar event to a topic
   */
  async linkEvent(topicId: string, eventId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const topic = this._currentTopic() || this._topics().find((t) => t.id === topicId);
    if (!topic) return;

    const linkedEventIds = [...topic.linkedEventIds];
    if (!linkedEventIds.includes(eventId)) {
      linkedEventIds.push(eventId);
      await this.firestoreService.updateDocument(
        `families/${familyId}/topics/${topicId}`,
        { linkedEventIds }
      );
      await this.logActivity(topicId, 'event_linked', 'קושר אירוע לנושא');
    }
  }

  /**
   * Unlink a calendar event from a topic
   */
  async unlinkEvent(topicId: string, eventId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const topic = this._currentTopic() || this._topics().find((t) => t.id === topicId);
    if (!topic) return;

    const linkedEventIds = topic.linkedEventIds.filter((id) => id !== eventId);
    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}`,
      { linkedEventIds }
    );
  }

  /**
   * Join editing session (for presence tracking)
   */
  async joinEditing(topicId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    if (!familyId || !userId) return;

    const topic = this._currentTopic();
    if (!topic) return;

    const activeEditors = [...topic.activeEditors];
    if (!activeEditors.includes(userId)) {
      activeEditors.push(userId);
      await this.firestoreService.updateDocument(
        `families/${familyId}/topics/${topicId}`,
        { activeEditors }
      );
    }
  }

  /**
   * Leave editing session
   */
  async leaveEditing(topicId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    if (!familyId || !userId) return;

    const topic = this._currentTopic();
    if (!topic) return;

    const activeEditors = topic.activeEditors.filter((id) => id !== userId);
    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}`,
      { activeEditors }
    );
  }

  /**
   * Set status filter
   */
  setStatusFilter(status: TopicStatus | 'all'): void {
    this._filterStatus.set(status);
  }

  /**
   * Set category filter
   */
  setCategoryFilter(category: TopicCategory | 'all'): void {
    this._filterCategory.set(category);
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  /**
   * Toggle status group collapsed state
   */
  toggleStatusCollapsed(status: TopicStatus): void {
    this._collapsedStatuses.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  }

  /**
   * Clear current topic
   */
  clearCurrentTopic(): void {
    this._currentTopic.set(null);
    this.currentTopicSubscription?.unsubscribe();
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Unsubscribe from all real-time subscriptions
   */
  private unsubscribe(): void {
    this.topicsSubscription?.unsubscribe();
    this.currentTopicSubscription?.unsubscribe();
  }

  /**
   * Log activity for a topic
   */
  private async logActivity(
    topicId: string,
    type: string,
    description: string,
    targetId?: string,
    targetType?: string,
    oldValue?: string,
    newValue?: string
  ): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    if (!familyId || !userId) return;

    try {
      await this.firestoreService.createDocument(
        `families/${familyId}/topics/${topicId}/activities`,
        {
          topicId,
          type,
          description,
          targetId: targetId || null,
          targetType: targetType || null,
          oldValue: oldValue || null,
          newValue: newValue || null,
          performedBy: userId,
        }
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // ============================================
  // Dashboard integration methods
  // ============================================

  /**
   * Get count of my pending tasks across all topics
   */
  readonly myPendingTasksCount = computed(() => {
    // This would require loading tasks, for now return 0
    // Will be implemented in TasksService
    return 0;
  });

  /**
   * Get recent activity across topics
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    // This will be implemented in ActivityService
    return [];
  }
}

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { FirestoreService, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import {
  TopicTask,
  TaskStatus,
  TopicPriority,
  Subtask,
  CreateTaskData,
  UpdateTaskData,
} from './topics.models';

@Injectable({
  providedIn: 'root',
})
export class TasksService implements OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Subscriptions
  private tasksSubscription?: Subscription;

  // Private signals
  private _tasks = signal<TopicTask[]>([]);
  private _currentTopicId = signal<string | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly tasks = this._tasks.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly totalCount = computed(() => this._tasks().length);

  readonly completedCount = computed(() =>
    this._tasks().filter((t) => t.status === 'completed').length
  );

  readonly pendingCount = computed(() =>
    this._tasks().filter((t) => t.status === 'pending').length
  );

  readonly inProgressCount = computed(() =>
    this._tasks().filter((t) => t.status === 'in_progress').length
  );

  readonly progress = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return (this.completedCount() / total) * 100;
  });

  /**
   * Tasks grouped by status
   */
  readonly groupedTasks = computed(() => {
    const tasks = this._tasks();
    const pending = tasks
      .filter((t) => t.status === 'pending')
      .sort((a, b) => a.order - b.order);
    const inProgress = tasks
      .filter((t) => t.status === 'in_progress')
      .sort((a, b) => a.order - b.order);
    const completed = tasks
      .filter((t) => t.status === 'completed')
      .sort((a, b) => (b.completedAt?.toMillis() || 0) - (a.completedAt?.toMillis() || 0));

    return { pending, inProgress, completed };
  });

  /**
   * Tasks assigned to current user
   */
  readonly myTasks = computed(() => {
    const userId = this.authService.userId();
    if (!userId) return [];
    return this._tasks().filter((t) => t.assignedTo.includes(userId));
  });

  /**
   * Overdue tasks
   */
  readonly overdueTasks = computed(() => {
    const now = new Date();
    return this._tasks().filter(
      (t) => t.dueDate && t.dueDate.toDate() < now && t.status !== 'completed'
    );
  });

  /**
   * Upcoming tasks (due within 7 days)
   */
  readonly upcomingTasks = computed(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this._tasks()
      .filter(
        (t) =>
          t.dueDate &&
          t.dueDate.toDate() >= now &&
          t.dueDate.toDate() <= weekFromNow &&
          t.status !== 'completed'
      )
      .sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis());
  });

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  /**
   * Subscribe to tasks for a topic
   */
  subscribeToTasks(topicId: string): void {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._tasks.set([]);
      return;
    }

    this._currentTopicId.set(topicId);
    this._isLoading.set(true);
    this._error.set(null);

    // Unsubscribe from previous
    this.tasksSubscription?.unsubscribe();

    // Subscribe to tasks collection
    this.tasksSubscription = this.firestoreService
      .getCollection$<TopicTask>(
        `families/${familyId}/topics/${topicId}/tasks`,
        orderBy('order', 'asc')
      )
      .subscribe({
        next: (tasks) => {
          this._tasks.set(tasks);
          this._isLoading.set(false);
        },
        error: (error) => {
          console.error('Error subscribing to tasks:', error);
          this._error.set('שגיאה בטעינת משימות');
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Create a new task
   */
  async createTask(topicId: string, data: CreateTaskData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה ליצור משימות');
    }

    // Get max order
    const maxOrder = this._tasks().reduce((max, t) => Math.max(max, t.order), -1);

    const taskData: Omit<TopicTask, 'id' | 'createdAt' | 'updatedAt'> = {
      topicId,
      title: data.title,
      description: data.description || '',
      assignedTo: data.assignedTo || [],
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : undefined,
      status: 'pending',
      priority: data.priority || 'medium',
      subtasks: [],
      order: maxOrder + 1,
      createdBy: userId,
    };

    const taskId = await this.firestoreService.createDocument(
      `families/${familyId}/topics/${topicId}/tasks`,
      taskData
    );

    // Update topic task count
    await this.updateTopicTaskCount(topicId, 1, 0);

    return taskId;
  }

  /**
   * Update a task
   */
  async updateTask(topicId: string, taskId: string, data: UpdateTaskData): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן משימות');
    }

    const updateData: Record<string, any> = {};

    if (data.title !== undefined) updateData['title'] = data.title;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.assignedTo !== undefined) updateData['assignedTo'] = data.assignedTo;
    if (data.priority !== undefined) updateData['priority'] = data.priority;
    if (data.subtasks !== undefined) updateData['subtasks'] = data.subtasks;
    if (data.order !== undefined) updateData['order'] = data.order;

    if (data.dueDate !== undefined) {
      updateData['dueDate'] = data.dueDate ? Timestamp.fromDate(data.dueDate) : null;
    }

    if (data.status !== undefined) {
      const task = this._tasks().find((t) => t.id === taskId);
      const wasCompleted = task?.status === 'completed';
      const isNowCompleted = data.status === 'completed';

      updateData['status'] = data.status;

      if (isNowCompleted && !wasCompleted) {
        updateData['completedAt'] = this.firestoreService.getServerTimestamp();
        updateData['completedBy'] = userId;
        // Update topic completed count
        await this.updateTopicTaskCount(topicId, 0, 1);
      } else if (!isNowCompleted && wasCompleted) {
        updateData['completedAt'] = null;
        updateData['completedBy'] = null;
        // Decrease topic completed count
        await this.updateTopicTaskCount(topicId, 0, -1);
      }
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}/tasks/${taskId}`,
      updateData
    );
  }

  /**
   * Toggle task status (pending <-> completed)
   */
  async toggleTaskStatus(topicId: string, taskId: string): Promise<void> {
    const task = this._tasks().find((t) => t.id === taskId);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    await this.updateTask(topicId, taskId, { status: newStatus });
  }

  /**
   * Set task to in_progress
   */
  async startTask(topicId: string, taskId: string): Promise<void> {
    await this.updateTask(topicId, taskId, { status: 'in_progress' });
  }

  /**
   * Delete a task
   */
  async deleteTask(topicId: string, taskId: string): Promise<void> {
    const familyId = this.familyService.familyId();

    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק משימות');
    }

    const task = this._tasks().find((t) => t.id === taskId);
    const wasCompleted = task?.status === 'completed';

    await this.firestoreService.deleteDocument(
      `families/${familyId}/topics/${topicId}/tasks/${taskId}`
    );

    // Update topic task count
    await this.updateTopicTaskCount(topicId, -1, wasCompleted ? -1 : 0);
  }

  /**
   * Add a subtask
   */
  async addSubtask(topicId: string, taskId: string, text: string): Promise<void> {
    const task = this._tasks().find((t) => t.id === taskId);
    if (!task) return;

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      order: task.subtasks.length,
    };

    const subtasks = [...task.subtasks, newSubtask];
    await this.updateTask(topicId, taskId, { subtasks });
  }

  /**
   * Toggle subtask completion
   */
  async toggleSubtask(topicId: string, taskId: string, subtaskId: string): Promise<void> {
    const task = this._tasks().find((t) => t.id === taskId);
    if (!task) return;

    const subtasks = task.subtasks.map((s) =>
      s.id === subtaskId
        ? {
            ...s,
            isCompleted: !s.isCompleted,
            completedAt: !s.isCompleted ? Timestamp.now() : undefined,
          }
        : s
    );

    await this.updateTask(topicId, taskId, { subtasks });
  }

  /**
   * Delete a subtask
   */
  async deleteSubtask(topicId: string, taskId: string, subtaskId: string): Promise<void> {
    const task = this._tasks().find((t) => t.id === taskId);
    if (!task) return;

    const subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    await this.updateTask(topicId, taskId, { subtasks });
  }

  /**
   * Assign users to task
   */
  async assignTask(topicId: string, taskId: string, userIds: string[]): Promise<void> {
    await this.updateTask(topicId, taskId, { assignedTo: userIds });
  }

  /**
   * Reorder tasks
   */
  async reorderTasks(topicId: string, taskIds: string[]): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const operations = taskIds.map((taskId, index) => ({
      type: 'update' as const,
      path: `families/${familyId}/topics/${topicId}/tasks/${taskId}`,
      data: { order: index },
    }));

    await this.firestoreService.batchWrite(operations);
  }

  /**
   * Clear tasks subscription
   */
  clearTasks(): void {
    this._tasks.set([]);
    this._currentTopicId.set(null);
    this.tasksSubscription?.unsubscribe();
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  private unsubscribe(): void {
    this.tasksSubscription?.unsubscribe();
  }

  /**
   * Update topic's task counts
   */
  private async updateTopicTaskCount(
    topicId: string,
    taskDelta: number,
    completedDelta: number
  ): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    try {
      // Get current topic
      const topic = await this.firestoreService.getDocument<any>(
        `families/${familyId}/topics/${topicId}`
      );

      if (topic) {
        await this.firestoreService.updateDocument(
          `families/${familyId}/topics/${topicId}`,
          {
            taskCount: Math.max(0, (topic.taskCount || 0) + taskDelta),
            completedTaskCount: Math.max(0, (topic.completedTaskCount || 0) + completedDelta),
          }
        );
      }
    } catch (error) {
      console.error('Error updating topic task count:', error);
    }
  }
}

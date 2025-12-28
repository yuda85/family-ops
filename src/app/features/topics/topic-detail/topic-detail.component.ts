import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TopicsService } from '../topics.service';
import { TasksService } from '../tasks.service';
import { CommentsService } from '../comments.service';
import { FamilyService } from '../../../core/family/family.service';
import { StatusBadgeComponent } from '../components/status-badge/status-badge.component';
import { ContentSectionComponent } from '../components/content-section/content-section.component';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { CommentThreadComponent } from '../components/comment-thread/comment-thread.component';
import { TopicFormComponent } from '../topic-form/topic-form.component';
import {
  Topic,
  TopicStatus,
  ContentSection,
  ContentSectionType,
  TOPIC_STATUSES,
  TOPIC_PRIORITIES,
  getCategoryMeta,
  getPriorityMeta,
} from '../topics.models';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    StatusBadgeComponent,
    ContentSectionComponent,
    TaskListComponent,
    CommentThreadComponent,
  ],
  template: `
    <div class="topic-detail-page">
      @if (topicsService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען נושא...</p>
        </div>
      } @else if (topic(); as t) {
        <!-- Header -->
        <header class="page-header">
          <button mat-icon-button class="back-btn" routerLink="/app/topics">
            <mat-icon>arrow_forward</mat-icon>
          </button>

          <div class="header-content">
            <div class="title-row">
              <div class="category-icon" [style.--category-color]="getCategoryMeta(t.category).color">
                <mat-icon>{{ getCategoryMeta(t.category).icon }}</mat-icon>
              </div>

              @if (isEditingTitle()) {
                <input
                  class="title-input"
                  [(ngModel)]="editingTitle"
                  (blur)="saveTitle()"
                  (keydown.enter)="saveTitle()"
                  (keydown.escape)="cancelTitleEdit()"
                  #titleInput
                />
              } @else {
                <h1 class="title" (click)="startTitleEdit()">
                  @if (t.isPinned) {
                    <mat-icon class="pin-icon" matTooltip="נעוץ">push_pin</mat-icon>
                  }
                  {{ t.title }}
                </h1>
              }
            </div>

            <div class="meta-row">
              <app-status-badge [status]="t.status"></app-status-badge>

              <span class="priority" [style.color]="getPriorityMeta(t.priority).color">
                <mat-icon>{{ getPriorityMeta(t.priority).icon }}</mat-icon>
                {{ getPriorityMeta(t.priority).labelHe }}
              </span>

              @if (t.targetDate) {
                <span class="target-date" [class.overdue]="isOverdue(t)">
                  <mat-icon>event</mat-icon>
                  {{ formatDate(t.targetDate.toDate()) }}
                </span>
              }

              @if (t.taskCount > 0) {
                <span class="task-progress">
                  <mat-icon>check_box</mat-icon>
                  {{ t.completedTaskCount }}/{{ t.taskCount }}
                </span>
              }
            </div>
          </div>

          <div class="header-actions">
            <button mat-icon-button [matMenuTriggerFor]="statusMenu" matTooltip="שנה סטטוס">
              <mat-icon>swap_horiz</mat-icon>
            </button>
            <mat-menu #statusMenu="matMenu">
              @for (status of statuses; track status.id) {
                <button mat-menu-item (click)="changeStatus(status.id)" [disabled]="status.id === t.status">
                  <mat-icon [style.color]="status.color">{{ status.icon }}</mat-icon>
                  <span>{{ status.labelHe }}</span>
                </button>
              }
            </mat-menu>

            <button mat-icon-button [matMenuTriggerFor]="actionsMenu" matTooltip="פעולות נוספות">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionsMenu="matMenu">
              <button mat-menu-item (click)="openEditDialog()">
                <mat-icon>edit</mat-icon>
                <span>ערוך פרטים</span>
              </button>
              <button mat-menu-item (click)="togglePin()">
                <mat-icon>{{ t.isPinned ? 'push_pin' : 'push_pin' }}</mat-icon>
                <span>{{ t.isPinned ? 'בטל נעיצה' : 'נעץ למעלה' }}</span>
              </button>
              <button mat-menu-item class="delete-item" (click)="deleteTopic()">
                <mat-icon>delete</mat-icon>
                <span>מחק נושא</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Description -->
        @if (t.description || isEditingDescription()) {
          <section class="description-section">
            @if (isEditingDescription()) {
              <textarea
                class="description-input"
                [(ngModel)]="editingDescription"
                (blur)="saveDescription()"
                placeholder="תיאור הנושא..."
                rows="3"
              ></textarea>
            } @else {
              <p class="description" (click)="startDescriptionEdit()">
                {{ t.description || 'לחץ להוספת תיאור...' }}
              </p>
            }
          </section>
        }

        <!-- Children chips -->
        @if (linkedChildren().length > 0) {
          <div class="children-chips">
            @for (child of linkedChildren(); track child.id) {
              <span class="child-chip">
                <span class="chip-dot" [style.background]="child.color"></span>
                {{ child.name }}
              </span>
            }
          </div>
        }

        <!-- Progress bar -->
        @if (t.taskCount > 0) {
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress" [style.width.%]="progressPercent()"></div>
            </div>
            <span class="progress-text">{{ progressPercent() | number:'1.0-0' }}% הושלם</span>
          </div>
        }

        <!-- Content Sections -->
        <div class="content-sections">
          <div class="sections-header">
            <h2>תוכן</h2>
            <button mat-stroked-button [matMenuTriggerFor]="addSectionMenu">
              <mat-icon>add</mat-icon>
              הוסף קטע
            </button>
            <mat-menu #addSectionMenu="matMenu">
              <button mat-menu-item (click)="addSection('text')">
                <mat-icon>notes</mat-icon>
                <span>טקסט</span>
              </button>
              <button mat-menu-item (click)="addSection('checklist')">
                <mat-icon>checklist</mat-icon>
                <span>רשימת משימות</span>
              </button>
              <button mat-menu-item (click)="addSection('links')">
                <mat-icon>link</mat-icon>
                <span>קישורים</span>
              </button>
            </mat-menu>
          </div>

          @if (t.contentSections.length > 0) {
            <div class="sections-list">
              @for (section of t.contentSections; track section.id) {
                <app-content-section
                  [section]="section"
                  (sectionChange)="updateSection($event)"
                  (delete)="deleteSection(section.id)"
                ></app-content-section>
              }
            </div>
          } @else {
            <div class="empty-sections">
              <mat-icon>article</mat-icon>
              <p>אין תוכן עדיין. הוסיפו קטעים באמצעות הכפתור למעלה.</p>
            </div>
          }
        </div>

        <!-- Tasks Section -->
        <section class="tasks-section">
          <app-task-list [topicId]="t.id"></app-task-list>
        </section>

        <!-- Comments Section -->
        <section class="comments-section">
          <h3 class="section-header">
            <mat-icon>chat</mat-icon>
            דיון ({{ t.commentCount }})
          </h3>
          <app-comment-thread [topicId]="t.id"></app-comment-thread>
        </section>

        <!-- Quick stats footer -->
        <footer class="stats-footer">
          <span class="stat">
            <mat-icon>chat_bubble</mat-icon>
            {{ t.commentCount }} תגובות
          </span>
          <span class="stat">
            <mat-icon>attach_file</mat-icon>
            {{ t.attachmentCount }} קבצים
          </span>
          @if (t.linkedEventIds.length > 0) {
            <span class="stat">
              <mat-icon>event</mat-icon>
              {{ t.linkedEventIds.length }} אירועים
            </span>
          }
        </footer>
      } @else {
        <div class="not-found">
          <mat-icon>search_off</mat-icon>
          <h2>הנושא לא נמצא</h2>
          <button mat-flat-button color="primary" routerLink="/app/topics">
            חזרה לרשימה
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .topic-detail-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .loading-container, .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-tertiary);
      }

      p, h2 {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .back-btn {
      flex-shrink: 0;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .category-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      background: color-mix(in srgb, var(--category-color) 15%, transparent);
      flex-shrink: 0;

      mat-icon {
        color: var(--category-color);
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover {
        color: var(--color-primary);
      }

      .pin-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--color-primary);
      }
    }

    .title-input {
      flex: 1;
      font-size: 1.5rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border: 2px solid var(--color-primary);
      border-radius: 0.5rem;
      outline: none;
      background: var(--surface-primary);
      color: var(--text-primary);
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .priority, .target-date, .task-progress {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .target-date {
      color: var(--text-secondary);

      &.overdue {
        color: var(--color-error);
      }
    }

    .task-progress {
      color: var(--color-success);
    }

    .header-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    /* Description */
    .description-section {
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
    }

    .description {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.6;
      cursor: pointer;
      white-space: pre-wrap;

      &:hover {
        color: var(--text-primary);
      }
    }

    .description-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--color-primary);
      border-radius: 0.5rem;
      font-family: inherit;
      font-size: 0.9375rem;
      line-height: 1.6;
      resize: vertical;
      background: var(--surface-primary);
      color: var(--text-primary);
      outline: none;
    }

    /* Children chips */
    .children-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .child-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-secondary);
      border-radius: 9999px;
      font-size: 0.875rem;

      .chip-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
    }

    /* Progress */
    .progress-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--surface-tertiary);
      border-radius: 4px;
      overflow: hidden;

      .progress {
        height: 100%;
        background: var(--color-success);
        transition: width 0.3s ease;
        border-radius: 4px;
      }
    }

    .progress-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-success);
    }

    /* Content Sections */
    .content-sections {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sections-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
    }

    .sections-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .empty-sections {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      text-align: center;
      gap: 0.5rem;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--text-tertiary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    /* Footer */
    .stats-footer {
      display: flex;
      gap: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }

    .stat {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Tasks section */
    .tasks-section {
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
    }

    /* Comments section */
    .comments-section {
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: var(--text-secondary);
      }
    }

    .delete-item {
      color: var(--color-error);
    }
  `]
})
export class TopicDetailComponent implements OnInit, OnDestroy {
  topicsService = inject(TopicsService);
  tasksService = inject(TasksService);
  commentsService = inject(CommentsService);
  private familyService = inject(FamilyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  statuses = TOPIC_STATUSES;
  priorities = TOPIC_PRIORITIES;

  topic = this.topicsService.currentTopic;

  isEditingTitle = signal(false);
  isEditingDescription = signal(false);
  editingTitle = '';
  editingDescription = '';

  linkedChildren = signal<any[]>([]);
  progressPercent = signal(0);

  ngOnInit(): void {
    const topicId = this.route.snapshot.paramMap.get('topicId');
    if (topicId) {
      this.topicsService.subscribeToTopic(topicId);
      this.tasksService.subscribeToTasks(topicId);
      this.commentsService.subscribeToComments(topicId);

      // Update linked children when topic changes
      this.updateLinkedChildren();
    }
  }

  ngOnDestroy(): void {
    this.topicsService.clearCurrentTopic();
    this.tasksService.clearTasks();
    this.commentsService.clearComments();
  }

  private updateLinkedChildren(): void {
    const t = this.topic();
    if (t) {
      const children = this.familyService.children();
      this.linkedChildren.set(
        children.filter(c => t.linkedChildrenIds.includes(c.id))
      );
      this.progressPercent.set(
        t.taskCount > 0 ? (t.completedTaskCount / t.taskCount) * 100 : 0
      );
    }
  }

  getCategoryMeta = getCategoryMeta;
  getPriorityMeta = getPriorityMeta;

  isOverdue(topic: Topic): boolean {
    if (!topic.targetDate) return false;
    return topic.targetDate.toDate() < new Date() && topic.status !== 'completed';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Title editing
  startTitleEdit(): void {
    const t = this.topic();
    if (t) {
      this.editingTitle = t.title;
      this.isEditingTitle.set(true);
    }
  }

  async saveTitle(): Promise<void> {
    const t = this.topic();
    if (t && this.editingTitle.trim() && this.editingTitle.trim() !== t.title) {
      try {
        await this.topicsService.updateTopic(t.id, { title: this.editingTitle.trim() });
      } catch (error: any) {
        this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
      }
    }
    this.isEditingTitle.set(false);
  }

  cancelTitleEdit(): void {
    this.isEditingTitle.set(false);
  }

  // Description editing
  startDescriptionEdit(): void {
    const t = this.topic();
    if (t) {
      this.editingDescription = t.description;
      this.isEditingDescription.set(true);
    }
  }

  async saveDescription(): Promise<void> {
    const t = this.topic();
    if (t && this.editingDescription !== t.description) {
      try {
        await this.topicsService.updateTopic(t.id, { description: this.editingDescription });
      } catch (error: any) {
        this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
      }
    }
    this.isEditingDescription.set(false);
  }

  // Actions
  async changeStatus(status: TopicStatus): Promise<void> {
    const t = this.topic();
    if (!t) return;

    try {
      await this.topicsService.changeStatus(t.id, status);
      this.snackBar.open('הסטטוס עודכן', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async togglePin(): Promise<void> {
    const t = this.topic();
    if (!t) return;

    try {
      await this.topicsService.togglePin(t.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  openEditDialog(): void {
    const t = this.topic();
    if (!t) return;

    const dialogRef = this.dialog.open(TopicFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: { topic: t },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('הנושא עודכן', '', { duration: 2000 });
      }
    });
  }

  async deleteTopic(): Promise<void> {
    const t = this.topic();
    if (!t) return;

    // TODO: Add confirmation dialog
    try {
      await this.topicsService.deleteTopic(t.id);
      this.router.navigate(['/app/topics']);
      this.snackBar.open('הנושא נמחק', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  // Content sections
  async addSection(type: ContentSectionType): Promise<void> {
    const t = this.topic();
    if (!t) return;

    const newSection: ContentSection = {
      id: crypto.randomUUID(),
      type,
      title: '',
      order: t.contentSections.length,
      isCollapsed: false,
      ...(type === 'text' && { content: '' }),
      ...(type === 'checklist' && { items: [] }),
      ...(type === 'links' && { links: [] }),
    };

    const contentSections = [...t.contentSections, newSection];

    try {
      await this.topicsService.updateTopic(t.id, { contentSections });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async updateSection(updatedSection: ContentSection): Promise<void> {
    const t = this.topic();
    if (!t) return;

    const contentSections = t.contentSections.map(s =>
      s.id === updatedSection.id ? updatedSection : s
    );

    try {
      await this.topicsService.updateTopic(t.id, { contentSections });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async deleteSection(sectionId: string): Promise<void> {
    const t = this.topic();
    if (!t) return;

    const contentSections = t.contentSections.filter(s => s.id !== sectionId);

    try {
      await this.topicsService.updateTopic(t.id, { contentSections });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }
}

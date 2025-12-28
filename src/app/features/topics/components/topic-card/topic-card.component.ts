import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Topic, getCategoryMeta, getPriorityMeta } from '../../topics.models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-topic-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  template: `
    <article class="topic-card" [class.pinned]="topic.isPinned" [routerLink]="['/app/topics', topic.id]">
      <!-- Header -->
      <div class="card-header">
        <div class="category-icon" [style.--category-color]="categoryMeta.color">
          <mat-icon>{{ categoryMeta.icon }}</mat-icon>
        </div>
        <div class="header-content">
          <div class="title-row">
            @if (topic.isPinned) {
              <mat-icon class="pin-icon" matTooltip="נושא נעוץ">push_pin</mat-icon>
            }
            <h3 class="title">{{ topic.title }}</h3>
          </div>
          <div class="meta">
            <app-status-badge [status]="topic.status"></app-status-badge>
            @if (topic.priority !== 'medium') {
              <span class="priority" [style.color]="priorityMeta.color">
                <mat-icon>{{ priorityMeta.icon }}</mat-icon>
                {{ priorityMeta.labelHe }}
              </span>
            }
          </div>
        </div>
        <button mat-icon-button class="menu-btn" [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="onPin()">
            <mat-icon>{{ topic.isPinned ? 'push_pin' : 'push_pin' }}</mat-icon>
            <span>{{ topic.isPinned ? 'בטל נעיצה' : 'נעץ למעלה' }}</span>
          </button>
          @if (topic.status === 'planning') {
            <button mat-menu-item (click)="onStatusChange('active')">
              <mat-icon>play_circle</mat-icon>
              <span>התחל</span>
            </button>
          }
          @if (topic.status === 'active') {
            <button mat-menu-item (click)="onStatusChange('completed')">
              <mat-icon>check_circle</mat-icon>
              <span>סיים</span>
            </button>
          }
          @if (topic.status === 'completed') {
            <button mat-menu-item (click)="onStatusChange('archived')">
              <mat-icon>inventory_2</mat-icon>
              <span>העבר לארכיון</span>
            </button>
          }
          <button mat-menu-item class="delete-item" (click)="onDelete()">
            <mat-icon>delete</mat-icon>
            <span>מחק</span>
          </button>
        </mat-menu>
      </div>

      <!-- Description preview -->
      @if (topic.description) {
        <p class="description">{{ topic.description }}</p>
      }

      <!-- Stats -->
      <div class="card-footer">
        <div class="stats">
          @if (topic.taskCount > 0) {
            <span class="stat" matTooltip="משימות">
              <mat-icon>check_box</mat-icon>
              {{ topic.completedTaskCount }}/{{ topic.taskCount }}
            </span>
          }
          @if (topic.commentCount > 0) {
            <span class="stat" matTooltip="תגובות">
              <mat-icon>chat_bubble</mat-icon>
              {{ topic.commentCount }}
            </span>
          }
          @if (topic.attachmentCount > 0) {
            <span class="stat" matTooltip="קבצים">
              <mat-icon>attach_file</mat-icon>
              {{ topic.attachmentCount }}
            </span>
          }
        </div>

        @if (topic.taskCount > 0) {
          <div class="progress-bar">
            <div class="progress" [style.width.%]="progressPercent"></div>
          </div>
        }

        @if (topic.targetDate) {
          <span class="target-date" [class.overdue]="isOverdue">
            <mat-icon>event</mat-icon>
            {{ formatDate(topic.targetDate.toDate()) }}
          </span>
        }
      </div>
    </article>
  `,
  styles: [`
    .topic-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
        box-shadow: var(--shadow-sm);
      }

      &.pinned {
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 3%, var(--surface-primary));
      }
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .category-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      background: color-mix(in srgb, var(--category-color) 15%, transparent);
      flex-shrink: 0;

      mat-icon {
        color: var(--category-color);
      }
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .pin-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--color-primary);
    }

    .title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
      flex-wrap: wrap;
    }

    .priority {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.75rem;
      font-weight: 500;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .menu-btn {
      flex-shrink: 0;
      margin: -0.5rem;
      margin-inline-start: auto;
    }

    .description {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .progress-bar {
      flex: 1;
      height: 4px;
      background: var(--surface-tertiary);
      border-radius: 2px;
      overflow: hidden;
      min-width: 60px;

      .progress {
        height: 100%;
        background: var(--color-success);
        transition: width 0.3s ease;
        border-radius: 2px;
      }
    }

    .target-date {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-inline-start: auto;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.overdue {
        color: var(--color-error);
      }
    }

    .delete-item {
      color: var(--color-error);
    }
  `]
})
export class TopicCardComponent {
  @Input({ required: true }) topic!: Topic;
  @Output() pinToggle = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();

  get categoryMeta() {
    return getCategoryMeta(this.topic.category);
  }

  get priorityMeta() {
    return getPriorityMeta(this.topic.priority);
  }

  get progressPercent(): number {
    if (this.topic.taskCount === 0) return 0;
    return (this.topic.completedTaskCount / this.topic.taskCount) * 100;
  }

  get isOverdue(): boolean {
    if (!this.topic.targetDate) return false;
    return this.topic.targetDate.toDate() < new Date() && this.topic.status !== 'completed';
  }

  onPin(): void {
    this.pinToggle.emit();
  }

  onStatusChange(status: string): void {
    this.statusChange.emit(status);
  }

  onDelete(): void {
    this.delete.emit();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'מחר';
    if (diffDays === -1) return 'אתמול';
    if (diffDays > 0 && diffDays <= 7) return `בעוד ${diffDays} ימים`;
    if (diffDays < 0 && diffDays >= -7) return `לפני ${Math.abs(diffDays)} ימים`;

    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TransportationService } from '../../transportation/transportation.service';
import { FamilyService } from '../../../core/family/family.service';
import {
  MyDutiesTodayView,
  TransportationTaskView,
  getCategoryMeta,
} from '../../../core/family/family.models';

@Component({
  selector: 'app-my-duties-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatRippleModule,
  ],
  template: `
    <section class="card duties-card">
      <div class="card-header">
        <div class="card-title">
          <mat-icon>directions_car</mat-icon>
          <h2>ההסעות שלי</h2>
        </div>
        <a routerLink="/app/transportation" class="card-action" matRipple>
          <span>לתכנון שבועי</span>
          <mat-icon>chevron_left</mat-icon>
        </a>
      </div>

      <div class="card-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
          </div>
        } @else if (myDuties(); as duties) {
          @if (duties.myTasks.length === 0) {
            <div class="empty-state compact">
              <mat-icon>check_circle</mat-icon>
              <p>אין הסעות קרובות</p>
              <span class="empty-hint">אין הסעות בשלושת הימים הקרובים</span>
            </div>
          } @else {
            <div class="duties-list">
              @for (taskView of duties.myTasks.slice(0, 4); track taskView.task.id) {
                <div
                  class="duty-item"
                  [class.completed]="taskView.task.status === 'completed'"
                  [style.--category-color]="getCategoryColor(taskView.task.category)"
                >
                  <div class="duty-time">
                    <span class="time-day">{{ getDayLabel(taskView.task.date.toDate()) }}</span>
                    <span class="time-hour">{{ formatTime(taskView.task.startTime.toDate()) }}</span>
                  </div>
                  <div class="duty-content">
                    <span class="duty-title">{{ taskView.task.title }}</span>
                    @if (taskView.children.length > 0) {
                      <div class="duty-children">
                        @for (child of taskView.children; track child.id) {
                          <span class="child-badge" [style.background]="child.color">
                            {{ child.name.charAt(0) }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                  @if (taskView.task.status === 'completed') {
                    <mat-icon class="completed-icon">check_circle</mat-icon>
                  }
                </div>
              }
              @if (duties.myTasks.length > 4) {
                <div class="more-duties">
                  +{{ duties.myTasks.length - 4 }} נוספות
                </div>
              }
            </div>
          }
        } @else {
          <div class="empty-state compact">
            <mat-icon>check_circle</mat-icon>
            <p>אין הסעות קרובות</p>
            <span class="empty-hint">אין הסעות בשלושת הימים הקרובים</span>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .duties-card {
      background: var(--surface-primary);
      border-radius: 1.25rem;
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      transition: all 0.25s ease;
      animation: cardSlideIn 0.4s ease-out backwards;

      &:hover {
        border-color: var(--border-default);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      }
    }

    @keyframes cardSlideIn {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.375rem;

      mat-icon {
        color: var(--color-warning, #f59e0b);
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      h2 {
        font-family: 'Rubik', var(--font-family-display);
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .card-action {
      display: flex;
      align-items: center;
      gap: 0.125rem;
      color: var(--color-primary);
      font-size: 0.7rem;
      font-weight: 500;
      text-decoration: none;
      padding: 0.25rem 0.5rem;
      border-radius: 0.75rem;
      transition: all 0.2s ease;

      &:hover {
        background: var(--color-primary-alpha);
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .card-content {
      padding: 0.75rem 1rem;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-item {
      height: 48px;
      background: linear-gradient(
        90deg,
        var(--surface-secondary) 25%,
        var(--surface-hover) 50%,
        var(--surface-secondary) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 0.5rem;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--text-tertiary);

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        margin-bottom: 0.5rem;
        opacity: 0.5;
        color: var(--color-success, #10b981);
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .empty-hint {
        font-size: 0.75rem;
        margin-top: 0.25rem;
        opacity: 0.7;
      }
    }

    /* Duties List */
    .duties-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .duty-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      border-right: 3px solid var(--category-color, var(--color-primary));
      transition: all 0.2s ease;

      &:hover {
        background: var(--surface-hover);
        transform: translateX(-2px);
      }

      &.completed {
        opacity: 0.6;

        .duty-title {
          text-decoration: line-through;
        }
      }
    }

    .duty-time {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;

      .time-day {
        font-size: 0.65rem;
        font-weight: 500;
        color: var(--text-tertiary);
      }

      .time-hour {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
      }
    }

    .duty-content {
      flex: 1;
      min-width: 0;
    }

    .duty-title {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .duty-children {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .child-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Rubik', var(--font-family-display);
      font-weight: 600;
      font-size: 0.6rem;
    }

    .completed-icon {
      color: var(--color-success, #10b981);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .more-duties {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      text-align: center;
      padding: 0.25rem;
    }
  `],
})
export class MyDutiesCardComponent implements OnInit {
  private transportationService = inject(TransportationService);
  private familyService = inject(FamilyService);

  private _myDuties = signal<MyDutiesTodayView | null>(null);
  private _isLoading = signal(true);

  readonly myDuties = this._myDuties.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  ngOnInit(): void {
    this.loadDuties();
  }

  async loadDuties(): Promise<void> {
    this._isLoading.set(true);
    try {
      const duties = await this.transportationService.getMyTasksToday();
      this._myDuties.set(duties);
    } catch (error) {
      console.error('Error loading duties:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  getCategoryColor(category: string): string {
    const meta = getCategoryMeta(category as any);
    return meta.color;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDayLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'מחר';
    if (diffDays === 2) return 'מחרתיים';

    const dayNames = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'שבת'];
    return dayNames[date.getDay()];
  }
}

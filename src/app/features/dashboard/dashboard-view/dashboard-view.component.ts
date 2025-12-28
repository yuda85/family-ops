import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { DashboardService } from '../dashboard.service';
import { FamilyService } from '../../../core/family/family.service';
import {
  getCategoryMeta,
  CalendarEventInstance,
  FamilyChild,
} from '../../../core/family/family.models';
import {
  getCategoryMeta as getTopicCategoryMeta,
  getPriorityMeta,
} from '../../topics/topics.models';

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatRippleModule,
  ],
  template: `
    <div class="dashboard">
      <!-- Welcome Header -->
      <header class="welcome-header">
        <div class="greeting-section">
          <h1 class="greeting">
            {{ dashboardService.greeting() }},
            <span class="user-name">{{ dashboardService.userName() }}</span>
          </h1>
          <p class="date-display">{{ todayFormatted }}</p>
        </div>

        <div class="quick-stats">
          @if (dashboardService.stats(); as stats) {
            <div class="stat-chip" [class.has-value]="stats.eventsNext7Days > 0">
              <mat-icon>event</mat-icon>
              <span class="stat-value">{{ stats.eventsNext7Days }}</span>
              <span class="stat-label">אירועים</span>
            </div>
            <div class="stat-chip warning" [class.has-value]="stats.ridesNeeded > 0">
              <mat-icon>directions_car</mat-icon>
              <span class="stat-value">{{ stats.ridesNeeded }}</span>
              <span class="stat-label">הסעות</span>
            </div>
            <div class="stat-chip" [class.has-value]="stats.activeTopics > 0">
              <mat-icon>topic</mat-icon>
              <span class="stat-value">{{ stats.activeTopics }}</span>
              <span class="stat-label">נושאים</span>
            </div>
          }
        </div>
      </header>

      <!-- Kids Strip (Below Header) -->
      @if (dashboardService.childrenOverview().length > 0) {
        <section class="kids-strip">
          <div class="kids-strip-label">
            <mat-icon>child_care</mat-icon>
            <span>הילדים</span>
          </div>
          <div class="kids-strip-items">
            @for (childView of dashboardService.childrenOverview(); track childView.child.id) {
              <div
                class="kid-chip"
                [style.--child-color]="childView.child.color"
              >
                <span class="kid-avatar">{{ getInitial(childView.child.name) }}</span>
                <span class="kid-name">{{ childView.child.name }}</span>
                <div class="kid-badges">
                  <span class="kid-badge events">
                    <mat-icon>event</mat-icon>
                    {{ childView.upcomingEvents.length }}
                  </span>
                  @if (childView.hasRideNeeded) {
                    <span class="kid-badge rides">
                      <mat-icon>directions_car</mat-icon>
                      {{ childView.eventsNeedingRide.length }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Loading State -->
      @if (dashboardService.isLoading()) {
        <div class="loading-container">
          <div class="skeleton-grid">
            <div class="skeleton-card large"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card wide"></div>
          </div>
        </div>
      } @else {
        <!-- Main Content Grid -->
        <div class="dashboard-grid">
          <!-- Upcoming Events Section -->
          <section class="card events-card">
            <div class="card-header">
              <div class="card-title">
                <mat-icon>calendar_month</mat-icon>
                <h2>אירועים קרובים</h2>
              </div>
              <a routerLink="/app/calendar" class="card-action" matRipple>
                <span>לכל היומן</span>
                <mat-icon>chevron_left</mat-icon>
              </a>
            </div>

            <div class="card-content events-timeline">
              @if (dashboardService.upcomingEventsByDay().length === 0) {
                <div class="empty-state">
                  <mat-icon>event_available</mat-icon>
                  <p>אין אירועים קרובים</p>
                  <span class="empty-hint">השבוע הקרוב פנוי</span>
                </div>
              } @else {
                @for (day of dashboardService.upcomingEventsByDay().slice(0, 4); track day.dateLabel) {
                  <div class="day-group" [class.is-today]="day.isToday">
                    <div class="day-header">
                      <span class="day-label">{{ day.dateLabel }}</span>
                      <span class="event-count">{{ day.events.length }} אירועים</span>
                    </div>
                    <div class="events-list">
                      @for (event of day.events.slice(0, 3); track event.event.id + event.instanceDate.toISOString()) {
                        <div
                          class="event-item"
                          [style.--category-color]="getCategoryColor(event)"
                        >
                          <div class="event-time">
                            {{ formatEventTime(event) }}
                          </div>
                          <div class="event-details">
                            <span class="event-title">{{ event.event.title }}</span>
                            @if (event.event.needsRide) {
                              <span class="ride-badge">
                                <mat-icon>directions_car</mat-icon>
                              </span>
                            }
                          </div>
                          <div class="event-children">
                            @for (child of getEventChildren(event); track child.id) {
                              <span class="child-badge" [style.background]="child.color">
                                {{ getInitial(child.name) }}
                              </span>
                            }
                          </div>
                        </div>
                      }
                      @if (day.events.length > 3) {
                        <div class="more-events">
                          +{{ day.events.length - 3 }} עוד
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </section>

          <!-- My Tasks Section -->
          <section class="card tasks-card">
            <div class="card-header">
              <div class="card-title">
                <mat-icon>assignment</mat-icon>
                <h2>המשימות שלי</h2>
              </div>
              <a routerLink="/app/topics" class="card-action" matRipple>
                <span>לכל המשימות</span>
                <mat-icon>chevron_left</mat-icon>
              </a>
            </div>

            <div class="card-content tasks-list">
              @if (dashboardService.myTasks().length === 0) {
                <div class="empty-state compact">
                  <mat-icon>task_alt</mat-icon>
                  <p>אין משימות פעילות</p>
                  <span class="empty-hint">כל המשימות שלך הושלמו!</span>
                </div>
              } @else {
                @for (taskView of dashboardService.myTasks(); track taskView.task.id) {
                  <a
                    [routerLink]="['/app/topics', taskView.topic.id]"
                    class="task-item"
                    [class.overdue]="taskView.isOverdue"
                    [class.due-soon]="!taskView.isOverdue && taskView.daysUntilDue !== null && taskView.daysUntilDue <= 2"
                    matRipple
                  >
                    <div class="task-status-indicator" [class.in-progress]="taskView.task.status === 'in_progress'">
                      <mat-icon>{{ taskView.task.status === 'in_progress' ? 'pending' : 'radio_button_unchecked' }}</mat-icon>
                    </div>
                    <div class="task-content">
                      <span class="task-title">{{ taskView.task.title }}</span>
                      <div class="task-meta">
                        <span class="task-topic">
                          <mat-icon>topic</mat-icon>
                          {{ taskView.topic.title }}
                        </span>
                        @if (taskView.daysUntilDue !== null) {
                          <span class="task-due" [class.overdue]="taskView.isOverdue">
                            <mat-icon>schedule</mat-icon>
                            @if (taskView.isOverdue) {
                              באיחור
                            } @else if (taskView.daysUntilDue === 0) {
                              היום
                            } @else if (taskView.daysUntilDue === 1) {
                              מחר
                            } @else {
                              עוד {{ taskView.daysUntilDue }} ימים
                            }
                          </span>
                        }
                      </div>
                    </div>
                    <div
                      class="task-priority"
                      [style.background]="getTaskPriorityColor(taskView.task.priority)"
                    >
                      <mat-icon>{{ getTaskPriorityIcon(taskView.task.priority) }}</mat-icon>
                    </div>
                  </a>
                }
              }
            </div>
          </section>

          <!-- Shopping Status Section -->
          <section class="card shopping-card" routerLink="/app/shopping" matRipple>
            <div class="card-header">
              <div class="card-title">
                <mat-icon>shopping_cart</mat-icon>
                <h2>קניות</h2>
              </div>
              <mat-icon class="nav-arrow">chevron_left</mat-icon>
            </div>

            <div class="card-content">
              @if (dashboardService.shoppingStatus(); as shopping) {
                @if (!shopping.hasActiveList) {
                  <div class="empty-state compact">
                    <mat-icon>shopping_basket</mat-icon>
                    <p>אין רשימה פעילה</p>
                  </div>
                } @else {
                  <div class="shopping-progress">
                    <div class="progress-header">
                      <span class="progress-label">{{ shopping.listName }}</span>
                      <span class="progress-count">
                        {{ shopping.checkedItems }}/{{ shopping.totalItems }} פריטים
                      </span>
                    </div>
                    <div class="progress-bar-container">
                      <div
                        class="progress-bar-fill"
                        [style.width.%]="shopping.progress"
                        [class.complete]="shopping.isComplete"
                      ></div>
                    </div>
                    <div class="progress-percentage">{{ shopping.progress | number:'1.0-0' }}%</div>
                  </div>
                  @if (shopping.status === 'shopping') {
                    <div class="shopping-active">
                      <mat-icon>store</mat-icon>
                      <span>קניות בתהליך</span>
                    </div>
                  }
                }
              }
            </div>
          </section>

          <!-- Important Topics Section -->
          <section class="card topics-card">
            <div class="card-header">
              <div class="card-title">
                <mat-icon>topic</mat-icon>
                <h2>נושאים חשובים</h2>
              </div>
              <a routerLink="/app/topics" class="card-action" matRipple>
                <span>לכל הנושאים</span>
                <mat-icon>chevron_left</mat-icon>
              </a>
            </div>

            <div class="card-content topics-list">
              @if (dashboardService.importantTopics().length === 0) {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>אין נושאים דחופים</p>
                  <span class="empty-hint">הכל מסודר!</span>
                </div>
              } @else {
                @for (topicView of dashboardService.importantTopics(); track topicView.topic.id) {
                  <a
                    [routerLink]="['/app/topics', topicView.topic.id]"
                    class="topic-item"
                    [class.urgent]="topicView.isUrgent"
                    matRipple
                  >
                    <div
                      class="topic-icon"
                      [style.background]="getTopicCategoryColor(topicView.topic.category)"
                    >
                      <mat-icon>{{ getTopicCategoryIcon(topicView.topic.category) }}</mat-icon>
                    </div>
                    <div class="topic-info">
                      <span class="topic-title">{{ topicView.topic.title }}</span>
                      <div class="topic-meta">
                        @if (topicView.daysUntilDeadline !== null) {
                          <span class="deadline" [class.soon]="topicView.daysUntilDeadline <= 3">
                            @if (topicView.daysUntilDeadline === 0) {
                              היום
                            } @else if (topicView.daysUntilDeadline === 1) {
                              מחר
                            } @else if (topicView.daysUntilDeadline < 0) {
                              באיחור
                            } @else {
                              עוד {{ topicView.daysUntilDeadline }} ימים
                            }
                          </span>
                        }
                        <span class="task-progress">
                          {{ topicView.topic.completedTaskCount }}/{{ topicView.topic.taskCount }} משימות
                        </span>
                      </div>
                    </div>
                    <div class="topic-progress-ring">
                      <svg viewBox="0 0 36 36">
                        <path
                          class="ring-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          class="ring-fill"
                          [style.stroke-dasharray]="topicView.progress + ', 100'"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span class="ring-text">{{ topicView.progress | number:'1.0-0' }}%</span>
                    </div>
                  </a>
                }
              }
            </div>
          </section>

        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100%;
      padding-bottom: 2rem;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ===== Welcome Header ===== */
    .welcome-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding: 0.75rem 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;

      @media (min-width: 768px) {
        padding: 0.875rem 1.25rem;
        gap: 1rem;
      }
    }

    .greeting-section {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .greeting {
      font-family: 'Rubik', var(--font-family-display);
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
      line-height: 1.3;

      @media (min-width: 768px) {
        font-size: 1.25rem;
      }
    }

    .user-name {
      color: var(--color-primary);
    }

    .date-display {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;

      @media (max-width: 480px) {
        width: 100%;
        margin-top: 0.125rem;
      }
    }

    .quick-stats {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--surface-secondary);
      padding: 0.375rem 0.625rem;
      border-radius: 1.5rem;
      font-size: 0.75rem;
      transition: all 0.2s ease;
      color: var(--text-primary);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--text-secondary);
      }

      .stat-value {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--text-primary);
      }

      .stat-label {
        color: var(--text-secondary);
      }

      &.has-value {
        background: var(--color-primary-alpha);

        mat-icon {
          color: var(--color-primary);
        }

        .stat-value,
        .stat-label {
          color: var(--color-primary);
        }
      }

      &.warning.has-value {
        background: rgba(245, 158, 11, 0.15);

        mat-icon,
        .stat-value,
        .stat-label {
          color: var(--color-warning, #f59e0b);
        }
      }
    }

    /* ===== Loading Skeleton ===== */
    .loading-container {
      padding: 1rem 0;
    }

    .skeleton-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .skeleton-card {
      background: linear-gradient(
        90deg,
        var(--surface-secondary) 25%,
        var(--surface-hover) 50%,
        var(--surface-secondary) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 1rem;
      height: 180px;

      &.large {
        height: 280px;
      }

      &.wide {
        @media (min-width: 768px) {
          grid-column: span 2;
        }
      }
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ===== Dashboard Grid ===== */
    .dashboard-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* ===== Card Base Styles ===== */
    .card {
      background: var(--surface-primary);
      border-radius: 1.25rem;
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      transition: all 0.25s ease;
      animation: cardSlideIn 0.4s ease-out backwards;

      &:nth-child(1) { animation-delay: 0.05s; }
      &:nth-child(2) { animation-delay: 0.1s; }
      &:nth-child(3) { animation-delay: 0.15s; }
      &:nth-child(4) { animation-delay: 0.2s; }

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
        color: var(--color-primary);
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

    .nav-arrow {
      color: var(--text-tertiary);
      transition: transform 0.2s ease;
    }

    .shopping-card:hover .nav-arrow {
      transform: translateX(-4px);
    }

    /* ===== Empty States ===== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-tertiary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 0.75rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 0.95rem;
        color: var(--text-secondary);
      }

      .empty-hint {
        font-size: 0.8rem;
        margin-top: 0.25rem;
        opacity: 0.7;
      }

      &.compact {
        padding: 1.5rem 1rem;

        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
          margin-bottom: 0.5rem;
        }
      }
    }

    /* ===== Events Card ===== */
    .events-card {
      @media (min-width: 768px) {
        grid-row: span 2;
      }
    }

    .events-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
      padding-left: 0.5rem;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-subtle);
        border-radius: 2px;
      }
    }

    .day-group {
      position: relative;
      padding-right: 1rem;

      &::before {
        content: '';
        position: absolute;
        right: 0;
        top: 0.5rem;
        bottom: 0;
        width: 2px;
        background: var(--border-subtle);
        border-radius: 1px;
      }

      &.is-today::before {
        background: var(--color-primary);
      }
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.625rem;

      .day-label {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-primary);
      }

      .is-today & .day-label {
        color: var(--color-primary);
      }

      .event-count {
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .event-item {
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
    }

    .event-time {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 40px;
    }

    .event-details {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .event-title {
      font-size: 0.875rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ride-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: var(--color-warning-alpha, rgba(255, 193, 7, 0.15));
      border-radius: 50%;
      flex-shrink: 0;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
        color: var(--color-warning, #f59e0b);
      }
    }

    .event-children {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .child-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Rubik', var(--font-family-display);
      font-weight: 600;
      font-size: 0.7rem;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .more-events {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      padding-right: 0.875rem;
    }

    /* ===== Kids Strip (Below Header) ===== */
    .kids-strip {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.625rem 1rem;
      margin-bottom: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.875rem;
      animation: fadeIn 0.4s ease-out backwards;
      animation-delay: 0.1s;
    }

    .kids-strip-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-tertiary);
      }
    }

    .kids-strip-items {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      flex: 1;
      padding: 0.125rem 0;

      &::-webkit-scrollbar {
        height: 0;
      }
    }

    .kid-chip {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 1rem 0.5rem 0.5rem;
      background: var(--surface-secondary);
      border-radius: 2rem;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      flex-shrink: 0;
      min-width: 120px;

      &:hover {
        background: var(--surface-hover);
        border-color: var(--child-color);
      }
    }

    .kid-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--child-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Rubik', var(--font-family-display);
      font-weight: 600;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .kid-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .kid-badges {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .kid-badge {
      display: flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.7rem;
      color: var(--text-tertiary);

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }

      &.rides {
        color: var(--color-warning, #f59e0b);
      }
    }

    /* ===== Shopping Card ===== */
    .shopping-card {
      cursor: pointer;

      .card-header {
        border-bottom: none;
        padding-bottom: 0;
      }

      .card-content {
        padding-top: 0.5rem;
      }
    }

    .shopping-progress {
      padding: 0.5rem 0;
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .progress-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .progress-count {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .progress-bar-container {
      height: 8px;
      background: var(--surface-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, #10b981));
      border-radius: 4px;
      transition: width 0.4s ease;

      &.complete {
        background: linear-gradient(90deg, #10b981, #34d399);
      }
    }

    .progress-percentage {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      text-align: left;
      margin-top: 0.375rem;
    }

    .shopping-active {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: var(--color-success-alpha, rgba(16, 185, 129, 0.1));
      border-radius: 0.5rem;
      color: var(--color-success, #10b981);
      font-size: 0.8rem;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        animation: pulse 2s infinite;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* ===== Topics Card ===== */
    .topics-card {
      @media (min-width: 768px) {
        grid-column: span 2;
      }
    }

    .topics-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      @media (min-width: 768px) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .topic-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      background: var(--surface-secondary);
      border-radius: 0.875rem;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;

      &:hover {
        background: var(--surface-hover);
        border-color: var(--border-default);
        transform: translateY(-1px);
      }

      &.urgent {
        border-color: var(--color-error-alpha, rgba(239, 68, 68, 0.3));
        background: var(--color-error-alpha, rgba(239, 68, 68, 0.05));

        &:hover {
          border-color: var(--color-error, #ef4444);
        }
      }
    }

    .topic-icon {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .topic-info {
      flex: 1;
      min-width: 0;
    }

    .topic-title {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .topic-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .deadline {
      &.soon {
        color: var(--color-error, #ef4444);
        font-weight: 500;
      }
    }

    .topic-progress-ring {
      position: relative;
      width: 40px;
      height: 40px;
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .ring-bg {
        fill: none;
        stroke: var(--surface-tertiary, #e5e7eb);
        stroke-width: 3;
      }

      .ring-fill {
        fill: none;
        stroke: var(--color-primary);
        stroke-width: 3;
        stroke-linecap: round;
        transition: stroke-dasharray 0.4s ease;
      }

      .ring-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.6rem;
        font-weight: 600;
        color: var(--text-secondary);
      }
    }

    /* ===== My Tasks Card ===== */
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;

      &:hover {
        background: var(--surface-hover);
        border-color: var(--border-default);
        transform: translateX(-2px);
      }

      &.overdue {
        border-color: var(--color-error-alpha, rgba(239, 68, 68, 0.3));
        background: var(--color-error-alpha, rgba(239, 68, 68, 0.05));

        .task-status-indicator mat-icon {
          color: var(--color-error, #ef4444);
        }
      }

      &.due-soon {
        border-color: var(--color-warning-alpha, rgba(245, 158, 11, 0.3));
        background: var(--color-warning-alpha, rgba(245, 158, 11, 0.05));
      }
    }

    .task-status-indicator {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: var(--text-tertiary);
      }

      &.in-progress mat-icon {
        color: var(--color-primary);
        animation: spin 2s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .task-content {
      flex: 1;
      min-width: 0;
    }

    .task-title {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .task-topic,
    .task-due {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .task-due.overdue {
      color: var(--color-error, #ef4444);
      font-weight: 500;
    }

    .task-priority {
      width: 28px;
      height: 28px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: white;
      }
    }

    /* ===== Dark Mode Adjustments ===== */
    :host-context([data-theme='dark']) {
      .card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }

    @media (prefers-color-scheme: dark) {
      :host-context(:not([data-theme='light'])) {
        .card {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      }
    }
  `],
})
export class DashboardViewComponent implements OnInit {
  dashboardService = inject(DashboardService);
  private familyService = inject(FamilyService);

  todayFormatted = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
  }

  getCategoryColor(event: CalendarEventInstance): string {
    const meta = getCategoryMeta(event.event.category);
    return meta.color;
  }

  formatEventTime(event: CalendarEventInstance): string {
    if (event.event.isAllDay) {
      return 'כל היום';
    }
    return event.instanceStart.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitial(name: string): string {
    return name.charAt(0);
  }

  getTopicCategoryColor(category: string): string {
    const meta = getTopicCategoryMeta(category as any);
    return meta.color;
  }

  getTopicCategoryIcon(category: string): string {
    const meta = getTopicCategoryMeta(category as any);
    return meta.icon;
  }

  getTaskPriorityColor(priority: string): string {
    const meta = getPriorityMeta(priority as any);
    return meta.color;
  }

  getTaskPriorityIcon(priority: string): string {
    const meta = getPriorityMeta(priority as any);
    return meta.icon;
  }

  getEventChildren(event: CalendarEventInstance): FamilyChild[] {
    return this.familyService.getChildren(event.event.childrenIds || []);
  }
}

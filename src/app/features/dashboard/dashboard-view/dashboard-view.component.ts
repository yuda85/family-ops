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
import { getUnitMeta, ShoppingUnit } from '../../shopping/shopping.models';
import { MyDutiesCardComponent } from '../my-duties-card/my-duties-card.component';
import { BudgetService } from '../../budget/budget.service';
import { getExpenseTypeMeta } from '../../budget/budget.models';

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
    MyDutiesCardComponent,
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

          <!-- My Duties Today Section (Rides + Tasks) -->
          <app-my-duties-card></app-my-duties-card>

          <!-- Budget Overview Card -->
          @if (budgetService.isSetupComplete()) {
            <section class="card budget-card" routerLink="/app/budget" matRipple>
              @if (budgetService.monthSummary(); as summary) {
                <div class="budget-card-inner">
                  <!-- Gradient Header -->
                  <div class="budget-header">
                    <div class="budget-title-row">
                      <div class="budget-icon-badge" [class.needs-closing]="summary.needsClosing">
                        <mat-icon>account_balance_wallet</mat-icon>
                        @if (summary.needsClosing) {
                          <span class="closing-badge">!</span>
                        }
                      </div>
                      <div class="budget-title-info">
                        <h2>תקציב {{ summary.monthLabel }}</h2>
                        <span class="budget-subtitle">
                          @if (summary.isClosed) {
                            <mat-icon>check_circle</mat-icon> נסגר
                          } @else {
                            {{ summary.byCategory.length }} קטגוריות פעילות
                          }
                        </span>
                      </div>
                    </div>
                    <div class="budget-status-badge" [class]="summary.status">
                      <mat-icon>
                        @switch (summary.status) {
                          @case ('good') { check_circle }
                          @case ('close') { warning }
                          @case ('over') { error }
                        }
                      </mat-icon>
                      <span>
                        @switch (summary.status) {
                          @case ('good') { במסגרת }
                          @case ('close') { קרוב ליעד }
                          @case ('over') { חריגה }
                        }
                      </span>
                    </div>
                  </div>

                  <!-- Main Content -->
                  <div class="budget-body">
                    <!-- Progress Ring -->
                    <div class="budget-progress-section">
                      <div class="budget-ring">
                        <svg viewBox="0 0 100 100">
                          <circle class="ring-track" cx="50" cy="50" r="42" />
                          <circle
                            class="ring-progress"
                            cx="50" cy="50" r="42"
                            [style.stroke-dasharray]="(Math.min(summary.percentUsed, 100) * 2.64) + ', 264'"
                            [class]="summary.status"
                          />
                        </svg>
                        <div class="ring-center">
                          <span class="ring-percent">{{ summary.percentUsed | number:'1.0-0' }}</span>
                          <span class="ring-symbol">%</span>
                        </div>
                      </div>
                      <div class="budget-totals">
                        <div class="total-row actual">
                          <span class="total-label">הוצאות</span>
                          <span class="total-value">{{ formatCurrency(summary.grandTotal) }}</span>
                        </div>
                        <div class="total-divider"></div>
                        <div class="total-row planned">
                          <span class="total-label">תקציב</span>
                          <span class="total-value">{{ formatCurrency(summary.totalPlanned) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Expense Types Breakdown -->
                    <div class="budget-breakdown">
                      <div class="breakdown-item">
                        <div class="breakdown-icon fixed">
                          <mat-icon>lock</mat-icon>
                        </div>
                        <div class="breakdown-info" [ngStyle]="{'margin-right': '35px'}">
                          <span class="breakdown-label">קבוע</span>
                          <span class="breakdown-amount">{{ formatCurrency(budgetService.fixedExpensesTotal()) }}</span>
                        </div>
                      </div>
                      <div class="breakdown-item">
                        <div class="breakdown-icon variable">
                          <mat-icon>trending_up</mat-icon>
                        </div>
                        <div class="breakdown-info">
                          <span class="breakdown-label">משתנה</span>
                          <span class="breakdown-amount">{{ formatCurrency(budgetService.variableExpensesTotal()) }}</span>
                        </div>
                      </div>
                      <div class="breakdown-item">
                        <div class="breakdown-icon occasional">
                          <mat-icon>shopping_bag</mat-icon>
                        </div>
                        <div class="breakdown-info">
                          <span class="breakdown-label">חד פעמי</span>
                          <span class="breakdown-amount">{{ formatCurrency(budgetService.occasionalExpensesTotal()) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer Navigation -->
                  <div class="budget-footer">
                    <span>לפרטים נוספים</span>
                    <mat-icon>chevron_left</mat-icon>
                  </div>
                </div>
              } @else {
                <!-- No budget data yet -->
                <div class="budget-empty">
                  <div class="budget-icon-badge empty">
                    <mat-icon>account_balance_wallet</mat-icon>
                  </div>
                  <p>תקציב חודשי</p>
                  <span>לחץ להגדרת התקציב</span>
                </div>
              }
            </section>
          }

          <!-- Shopping List Section (Full Width) -->
            <section class="card shopping-card-new" routerLink="/app/shopping" matRipple>
              @if (dashboardService.shoppingStatus(); as shopping) {
                @if (shopping.hasActiveList && shopping.totalItems > 0) {
                  <div class="shopping-card-inner">
                    <!-- Header -->
                    <div class="shopping-header">
                      <div class="shopping-title-row">
                        <div class="shopping-icon-badge">
                          <mat-icon>shopping_cart</mat-icon>
                        </div>
                        <div class="shopping-title-info">
                          <h2>{{ shopping.listName || 'רשימת קניות' }}</h2>
                          <span class="shopping-subtitle">{{ shopping.totalItems }} פריטים</span>
                        </div>
                      </div>
                      <div class="shopping-nav-hint">
                        <span>לרשימה</span>
                        <mat-icon>chevron_left</mat-icon>
                      </div>
                    </div>

                    <!-- Body -->
                    <div class="shopping-body">
                      <!-- Progress Section -->
                      <div class="shopping-progress-section">
                        <div class="progress-ring-large">
                          <svg viewBox="0 0 100 100">
                            <circle class="progress-ring-bg" cx="50" cy="50" r="42" />
                            <circle
                              class="progress-ring-fill"
                              cx="50" cy="50" r="42"
                              [style.stroke-dasharray]="(shopping.progress * 2.64) + ', 264'"
                              [class.complete]="shopping.isComplete"
                            />
                          </svg>
                          <div class="progress-ring-content">
                            <span class="progress-value">{{ shopping.progress | number:'1.0-0' }}</span>
                            <span class="progress-symbol">%</span>
                          </div>
                        </div>
                        <div class="progress-stats">
                          <div class="stat-row">
                            <span class="stat-label">סה"כ פריטים</span>
                            <span class="stat-value">{{ shopping.totalItems }}</span>
                          </div>
                          <div class="stat-row checked">
                            <span class="stat-label">נאספו</span>
                            <span class="stat-value">{{ shopping.checkedItems }}</span>
                          </div>
                          <div class="stat-row remaining">
                            <span class="stat-label">נותרו</span>
                            <span class="stat-value">{{ shopping.totalItems - shopping.checkedItems }}</span>
                          </div>
                          @if (shopping.estimatedTotal > 0) {
                            <div class="stat-row total">
                              <span class="stat-label">הערכה</span>
                              <span class="stat-value">₪{{ shopping.estimatedTotal | number:'1.0-0' }}</span>
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Categories Section -->
                      @if (shopping.categories.length > 0) {
                        <div class="shopping-categories">
                          <h4 class="section-label">קטגוריות</h4>
                          <div class="categories-grid">
                            @for (cat of shopping.categories; track cat.category) {
                              <div
                                class="category-chip"
                                [class.complete]="cat.isComplete"
                                [style.--cat-color]="cat.meta.color"
                              >
                                <mat-icon [style.color]="cat.meta.color">{{ cat.meta.icon }}</mat-icon>
                                <span class="cat-name">{{ cat.meta.labelHe }}</span>
                                <span class="cat-count">{{ cat.checkedItems }}/{{ cat.totalItems }}</span>
                              </div>
                            }
                          </div>
                        </div>
                      }

                      <!-- Recent Items Preview -->
                      @if (shopping.recentItems.length > 0) {
                        <div class="shopping-items-preview">
                          <h4 class="section-label">פריטים להוספה</h4>
                          <div class="items-list">
                            @for (item of shopping.recentItems.slice(0, 4); track item.id) {
                              <div class="item-row">
                                <div class="item-check"></div>
                                <span class="item-name">{{ item.name }}</span>
                                <span class="item-qty">{{ item.quantity }} {{ getUnitShort(item.unit) }}</span>
                              </div>
                            }
                            @if (shopping.totalItems - shopping.checkedItems > 4) {
                              <div class="items-more">
                                +{{ shopping.totalItems - shopping.checkedItems - 4 }} עוד
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Active Shopping Banner -->
                    @if (shopping.status === 'shopping') {
                      <div class="shopping-active-banner">
                        <div class="pulse-dot"></div>
                        <span>קניות בתהליך</span>
                        @if (shopping.activeShoppers.length > 0) {
                          <span>({{ shopping.activeShoppers.length }} קונים)</span>
                        }
                      </div>
                    }
                  </div>
                } @else if (!shopping.hasActiveList) {
                  <div class="shopping-empty">
                    <mat-icon>add_shopping_cart</mat-icon>
                    <p>אין רשימה פעילה</p>
                    <span>לחץ ליצירת רשימה חדשה</span>
                  </div>
                } @else {
                  <div class="shopping-empty">
                    <mat-icon>inventory_2</mat-icon>
                    <p>הרשימה ריקה</p>
                    <span>הוסף פריטים לרשימה</span>
                  </div>
                }
              }
            </section>

          <!-- Tasks & Topics Row -->
          <div class="tasks-topics-row">
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

    /* ===== New Shopping Card (Full Width) ===== */
    .shopping-card-new {
      cursor: pointer;
      padding: 0;
      overflow: hidden;

      @media (min-width: 768px) {
        grid-column: span 2;
      }

      &:hover {
        .shopping-nav-hint {
          transform: translateX(-4px);
        }
      }
    }

    .shopping-card-inner {
      display: flex;
      flex-direction: column;
    }

    .shopping-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg,
        color-mix(in srgb, var(--color-primary) 8%, transparent),
        color-mix(in srgb, var(--color-secondary) 5%, transparent)
      );
      border-bottom: 1px solid var(--border-subtle);
    }

    .shopping-title-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .shopping-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 0.875rem;
      background: linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, var(--color-secondary)));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }
    }

    .shopping-title-info {
      h2 {
        font-family: 'Rubik', var(--font-family-display);
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .shopping-subtitle {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.125rem;
        display: block;
      }
    }

    .shopping-nav-hint {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--color-primary);
      font-size: 0.8rem;
      font-weight: 500;
      transition: transform 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .shopping-body {
      display: grid;
      gap: 1.25rem;
      padding: 1.25rem;

      @media (min-width: 768px) {
        grid-template-columns: auto 1fr 1fr;
        align-items: start;
      }
    }

    /* Progress Ring Section */
    .shopping-progress-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;

      @media (min-width: 768px) {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .progress-ring-large {
      position: relative;
      width: 90px;
      height: 90px;
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .progress-ring-bg {
        fill: none;
        stroke: var(--surface-secondary);
        stroke-width: 8;
      }

      .progress-ring-fill {
        fill: none;
        stroke: var(--color-primary);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dasharray 0.6s ease;

        &.complete {
          stroke: var(--color-success, #10b981);
        }
      }

      .progress-ring-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        display: flex;
        align-items: baseline;
        justify-content: center;

        .progress-value {
          font-family: 'Rubik', var(--font-family-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .progress-symbol {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-tertiary);
          margin-right: 1px;
        }
      }
    }

    .progress-stats {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;

      @media (min-width: 768px) {
        width: 100%;
      }
    }

    .stat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--surface-secondary);
      border-radius: 0.5rem;
      font-size: 0.8rem;

      .stat-label {
        color: var(--text-secondary);
      }

      .stat-value {
        font-weight: 600;
        color: var(--text-primary);
      }

      &.checked .stat-value {
        color: var(--color-success, #10b981);
      }

      &.remaining .stat-value {
        color: var(--color-warning, #f59e0b);
      }

      &.total {
        background: linear-gradient(90deg,
          color-mix(in srgb, var(--color-primary) 10%, transparent),
          color-mix(in srgb, var(--color-primary) 5%, transparent)
        );

        .stat-value {
          color: var(--color-primary);
          font-size: 0.9rem;
        }
      }
    }

    /* Categories Section */
    .shopping-categories {
      @media (min-width: 768px) {
        border-right: 1px solid var(--border-subtle);
        padding-right: 1.25rem;
      }
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin: 0 0 0.75rem;
    }

    .categories-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .category-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      background: var(--surface-secondary);
      border-radius: 2rem;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      font-size: 0.75rem;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .cat-name {
        color: var(--text-primary);
        font-weight: 500;
      }

      .cat-count {
        color: var(--text-tertiary);
        font-size: 0.7rem;
      }

      &.complete {
        background: color-mix(in srgb, var(--cat-color) 15%, transparent);
        border-color: color-mix(in srgb, var(--cat-color) 30%, transparent);

        .cat-name {
          text-decoration: line-through;
          opacity: 0.7;
        }
      }
    }

    /* Items Preview Section */
    .shopping-items-preview {
      @media (min-width: 768px) {
        border-right: 1px solid var(--border-subtle);
        padding-right: 1.25rem;
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-secondary);
      border-radius: 0.5rem;
      transition: background 0.15s ease;

      &:hover {
        background: var(--surface-hover);
      }
    }

    .item-check {
      width: 16px;
      height: 16px;
      border: 2px solid var(--border-default);
      border-radius: 4px;
      flex-shrink: 0;
    }

    .item-name {
      flex: 1;
      font-size: 0.85rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-qty {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .items-more {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      text-align: center;
      padding: 0.375rem;
    }

    /* Active Shopping Banner */
    .shopping-active-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 0.75rem;
      background: linear-gradient(90deg,
        color-mix(in srgb, var(--color-success) 15%, transparent),
        color-mix(in srgb, var(--color-success) 10%, transparent)
      );
      color: var(--color-success, #10b981);
      font-size: 0.85rem;
      font-weight: 600;
      border-top: 1px solid color-mix(in srgb, var(--color-success) 20%, transparent);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        background: var(--color-success);
        border-radius: 50%;
        animation: pulseDot 1.5s ease-in-out infinite;
      }
    }

    @keyframes pulseDot {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.3);
        opacity: 0.7;
      }
    }

    /* Empty State */
    .shopping-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-tertiary);
        opacity: 0.5;
        margin-bottom: 0.75rem;
      }

      p {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      span {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        margin-top: 0.25rem;
      }
    }

    /* ===== Topics Card ===== */
    .topics-card {
      /* Now inside tasks-topics-row, no span needed */
    }

    .topics-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      @media (min-width: 768px) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
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

    /* ===== Tasks & Topics Row ===== */
    .tasks-topics-row {
      display: contents;

      @media (min-width: 768px) {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1.25rem;
        grid-column: span 2;
      }
    }

    .tasks-topics-row .tasks-card {
      @media (min-width: 768px) {
        min-height: 280px;
      }
    }

    .tasks-topics-row .topics-card {
      @media (min-width: 768px) {
        min-height: 280px;
      }
    }

    /* ===== Shopping Card Compact ===== */
    .shopping-card-compact {
      cursor: pointer;

      &:hover {
        border-color: var(--color-primary-alpha);
      }
    }

    .shopping-compact-content {
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .shopping-compact-main {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .shopping-compact-ring {
      position: relative;
      width: 70px;
      height: 70px;
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .ring-track {
        fill: none;
        stroke: var(--surface-secondary);
        stroke-width: 8;
      }

      .ring-progress {
        fill: none;
        stroke: var(--color-primary);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dasharray 0.6s ease;

        &.complete {
          stroke: var(--color-success, #10b981);
        }
      }

      .ring-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: baseline;
        justify-content: center;

        .ring-percent {
          font-family: 'Rubik', var(--font-family-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .ring-symbol {
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--text-tertiary);
          margin-right: 1px;
        }
      }
    }

    .shopping-compact-stats {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .compact-stat {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;

      .compact-stat-value {
        font-family: 'Rubik', var(--font-family-display);
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .compact-stat-label {
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }
    }

    .shopping-active-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: color-mix(in srgb, var(--color-success) 10%, transparent);
      border-radius: 0.5rem;
      color: var(--color-success, #10b981);
      font-size: 0.8rem;
      font-weight: 500;

      .pulse-dot {
        width: 8px;
        height: 8px;
        background: var(--color-success);
        border-radius: 50%;
        animation: pulseDot 1.5s ease-in-out infinite;
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

    /* ===== Budget Card ===== */
    .budget-card {
      cursor: pointer;
      padding: 0;
      overflow: hidden;
      background: linear-gradient(145deg,
        var(--surface-primary) 0%,
        color-mix(in srgb, #f59e0b 3%, var(--surface-primary)) 100%
      );
      border: 1px solid color-mix(in srgb, #f59e0b 15%, var(--border-subtle));

      &:hover {
        border-color: color-mix(in srgb, #f59e0b 30%, var(--border-default));
        box-shadow: 0 4px 20px color-mix(in srgb, #f59e0b 15%, transparent);

        .budget-footer {
          transform: translateX(-4px);
        }
      }
    }

    .budget-card-inner {
      display: flex;
      flex-direction: column;
    }

    .budget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg,
        color-mix(in srgb, #f59e0b 12%, transparent),
        color-mix(in srgb, #d97706 8%, transparent)
      );
      border-bottom: 1px solid color-mix(in srgb, #f59e0b 10%, var(--border-subtle));
    }

    .budget-title-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .budget-icon-badge {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 0.875rem;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px color-mix(in srgb, #f59e0b 35%, transparent);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      &.needs-closing {
        animation: budgetPulse 2s ease-in-out infinite;
      }

      &.empty {
        background: var(--surface-secondary);
        box-shadow: none;

        mat-icon {
          color: var(--text-tertiary);
        }
      }

      .closing-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 18px;
        height: 18px;
        background: var(--color-error, #ef4444);
        color: white;
        font-size: 11px;
        font-weight: 700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    @keyframes budgetPulse {
      0%, 100% { box-shadow: 0 4px 12px color-mix(in srgb, #f59e0b 35%, transparent); }
      50% { box-shadow: 0 4px 20px color-mix(in srgb, #f59e0b 50%, transparent); }
    }

    .budget-title-info {
      h2 {
        font-family: 'Rubik', var(--font-family-display);
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .budget-subtitle {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.125rem;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: var(--color-success, #10b981);
        }
      }
    }

    .budget-status-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      font-weight: 600;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.good {
        background: color-mix(in srgb, #40c057 15%, transparent);
        color: #40c057;
      }

      &.close {
        background: color-mix(in srgb, #fab005 15%, transparent);
        color: #d97706;
      }

      &.over {
        background: color-mix(in srgb, #fa5252 15%, transparent);
        color: #fa5252;
      }
    }

    .budget-body {
      display: flex;
      align-items: center;
      padding: 1.25rem;
      gap: 1.5rem;

      @media (max-width: 480px) {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
    }

    .budget-progress-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .budget-ring {
      position: relative;
      width: 80px;
      height: 80px;
      flex-shrink: 0;

      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .ring-track {
        fill: none;
        stroke: var(--surface-secondary);
        stroke-width: 8;
      }

      .ring-progress {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dasharray 0.8s ease;

        &.good { stroke: #40c057; }
        &.close { stroke: #fab005; }
        &.over { stroke: #fa5252; }
      }

      .ring-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: baseline;
        justify-content: center;

        .ring-percent {
          font-family: 'Rubik', var(--font-family-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .ring-symbol {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-tertiary);
          margin-right: 1px;
        }
      }
    }

    .budget-totals {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .total-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .total-value {
        font-family: 'Rubik', var(--font-family-display);
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      &.actual .total-value {
        color: var(--color-primary);
      }
    }

    .total-divider {
      height: 1px;
      background: linear-gradient(90deg,
        transparent,
        var(--border-subtle),
        transparent
      );
      margin: 0.125rem 0;
    }

    .budget-breakdown {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.75rem;
      padding-inline-start: 1.5rem;
      border-inline-start: 1px solid var(--border-subtle);
      min-width: 110px;
      flex-shrink: 0;

      @media (max-width: 480px) {
        flex-direction: row;
        justify-content: space-around;
        padding-inline-start: 0;
        padding-top: 1rem;
        border-inline-start: none;
        border-top: 1px solid var(--border-subtle);
        min-width: auto;
        width: 100%;
      }
    }

    .breakdown-item {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 0.5rem;
      width: 100%;

      @media (max-width: 480px) {
        flex-direction: column !important;
        align-items: center !important;
        gap: 0.25rem;
        text-align: center;
        min-width: 70px;
        width: auto;
      }
    }

    .breakdown-icon {
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
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

      &.fixed { background: #5c7cfa; }
      &.variable { background: #fab005; }
      &.occasional { background: #20c997; }
    }

    .breakdown-info {
      display: flex;
      flex-direction: column;
      gap: 0;
      flex: 1;
      min-width: 0;

      @media (max-width: 480px) {
        align-items: center;
        flex: none;
      }
    }

    .breakdown-label {
      font-size: 0.7rem;
      color: var(--text-tertiary);
      white-space: nowrap;
      line-height: 1.3;
    }

    .breakdown-amount {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      line-height: 1.3;
    }

    .budget-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.75rem;
      color: var(--color-primary);
      font-size: 0.8rem;
      font-weight: 500;
      border-top: 1px solid var(--border-subtle);
      background: color-mix(in srgb, var(--color-primary) 3%, transparent);
      transition: transform 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .budget-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
      text-align: center;

      p {
        margin: 0.75rem 0 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      span {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        margin-top: 0.25rem;
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
  budgetService = inject(BudgetService);
  private familyService = inject(FamilyService);

  Math = Math; // Expose Math for template

  todayFormatted = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
    this.budgetService.initializeBudget();
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

  getUnitShort(unit: ShoppingUnit): string {
    return getUnitMeta(unit).shortHe;
  }

  getExpenseTypeLabel(type: string): string {
    return getExpenseTypeMeta(type as any).labelHe;
  }

  getExpenseTypeColor(type: string): string {
    return getExpenseTypeMeta(type as any).color;
  }

  formatCurrency(amount: number): string {
    return `₪${amount.toLocaleString('he-IL')}`;
  }
}

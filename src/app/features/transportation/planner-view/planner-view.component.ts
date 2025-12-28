import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TransportationService } from '../transportation.service';
import { FamilyService } from '../../../core/family/family.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  TransportationDayView,
  TransportationTaskView,
  FamilyMember,
  getCategoryMeta,
} from '../../../core/family/family.models';
import { AddTaskDialogComponent } from '../add-task-dialog/add-task-dialog.component';

@Component({
  selector: 'app-planner-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatMenuModule,
    MatDialogModule,
  ],
  template: `
    <div class="planner">
      <!-- Header -->
      <header class="planner-header">
        <div class="header-nav">
          <button mat-icon-button (click)="previousWeek()" class="nav-btn">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <div class="week-label">
            <span class="week-range">{{ weekRangeLabel() }}</span>
            @if (isCurrentWeek()) {
              <span class="current-week-badge">השבוע</span>
            }
          </div>
          <button mat-icon-button (click)="nextWeek()" class="nav-btn">
            <mat-icon>chevron_left</mat-icon>
          </button>
        </div>

        <div class="header-actions">
          @if (!isCurrentWeek()) {
            <button mat-stroked-button (click)="goToCurrentWeek()" class="today-btn">
              <mat-icon>today</mat-icon>
              השבוע
            </button>
          }
          <button mat-flat-button color="primary" (click)="openAddTaskDialog()" class="add-btn">
            <mat-icon>add</mat-icon>
            הוסף משימה
          </button>
        </div>
      </header>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <label class="filter-checkbox">
          <input
            type="checkbox"
            [checked]="showOnlyUnassigned()"
            (change)="toggleUnassignedFilter()"
          >
          <span class="checkbox-label">
            <mat-icon>warning</mat-icon>
            רק לא משובצים
          </span>
        </label>
        <label class="filter-checkbox">
          <input
            type="checkbox"
            [checked]="showOnlyMine()"
            (change)="toggleMineFilter()"
          >
          <span class="checkbox-label">
            <mat-icon>person</mat-icon>
            רק שלי
          </span>
        </label>
      </div>

      <!-- Loading State -->
      @if (transportationService.isLoading()) {
        <div class="loading-container">
          <div class="skeleton-grid">
            @for (i of [1,2,3,4,5,6,7]; track i) {
              <div class="skeleton-column"></div>
            }
          </div>
        </div>
      } @else {
        <!-- Week Grid -->
        <div class="week-grid">
          @for (day of filteredDays(); track day.dateKey) {
            <div
              class="day-column"
              [class.is-today]="day.isToday"
              [class.is-tomorrow]="day.isTomorrow"
            >
              <!-- Day Header -->
              <div class="day-header">
                <span class="day-name">{{ day.dayName }}</span>
                <span class="day-date">{{ day.date | date:'d' }}</span>
                @if (day.unassignedTasks > 0) {
                  <span class="unassigned-badge">{{ day.unassignedTasks }}</span>
                }
              </div>

              <!-- Tasks List -->
              <div class="day-tasks">
                @if (day.tasks.length === 0) {
                  <div class="empty-day">
                    <mat-icon>event_available</mat-icon>
                    <span>אין הסעות</span>
                  </div>
                } @else {
                  @for (taskView of day.tasks; track taskView.task.id) {
                    <div
                      class="task-card"
                      [class.unassigned]="!taskView.task.driverUserId"
                      [class.mine]="taskView.isCurrentUserDriver"
                      [class.completed]="taskView.task.status === 'completed'"
                      [style.--category-color]="getCategoryColor(taskView.task.category)"
                    >
                      <!-- Task Time -->
                      <div class="task-time">
                        {{ formatTime(taskView.task.startTime.toDate()) }}
                      </div>

                      <!-- Task Content -->
                      <div class="task-content">
                        <span class="task-title">{{ taskView.task.title }}</span>
                        @if (taskView.task.location) {
                          <span class="task-location">
                            <mat-icon>place</mat-icon>
                            {{ taskView.task.location }}
                          </span>
                        }
                      </div>

                      <!-- Children -->
                      @if (taskView.children.length > 0) {
                        <div class="task-children">
                          @for (child of taskView.children; track child.id) {
                            <span class="child-badge" [style.background]="child.color">
                              {{ child.name.charAt(0) }}
                            </span>
                          }
                        </div>
                      }

                      <!-- Driver Assignment -->
                      <div class="task-driver" [matMenuTriggerFor]="driverMenu">
                        @if (taskView.driver) {
                          <span class="driver-avatar">
                            @if (taskView.driver.photoURL) {
                              <img [src]="taskView.driver.photoURL" [alt]="taskView.driver.displayName">
                            } @else {
                              {{ taskView.driver.displayName.charAt(0) }}
                            }
                          </span>
                          <span class="driver-name">{{ taskView.driver.displayName }}</span>
                        } @else {
                          <span class="unassigned-indicator">
                            <mat-icon>warning</mat-icon>
                            <span>לא משובץ</span>
                          </span>
                        }
                        <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
                      </div>

                      <mat-menu #driverMenu="matMenu">
                        <button mat-menu-item (click)="assignDriver(taskView.task.id, null)">
                          <mat-icon>person_off</mat-icon>
                          <span>ללא שיבוץ</span>
                        </button>
                        <div class="menu-divider"></div>
                        @for (member of familyMembers(); track member.id) {
                          <button
                            mat-menu-item
                            (click)="assignDriver(taskView.task.id, member.id)"
                            [class.selected]="taskView.task.driverUserId === member.id"
                          >
                            <span class="member-avatar">
                              @if (member.photoURL) {
                                <img [src]="member.photoURL" [alt]="member.displayName">
                              } @else {
                                {{ member.displayName.charAt(0) }}
                              }
                            </span>
                            <span>{{ member.displayName }}</span>
                            @if (taskView.task.driverUserId === member.id) {
                              <mat-icon class="check-icon">check</mat-icon>
                            }
                          </button>
                        }
                      </mat-menu>

                      <!-- Complete Button -->
                      @if (taskView.task.status !== 'completed') {
                        <button
                          class="complete-btn"
                          (click)="markComplete(taskView.task.id); $event.stopPropagation()"
                          matRipple
                        >
                          <mat-icon>check_circle</mat-icon>
                        </button>
                      } @else {
                        <div class="completed-indicator">
                          <mat-icon>check_circle</mat-icon>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .planner {
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

    /* ===== Header ===== */
    .planner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-btn {
      color: var(--text-secondary);

      &:hover {
        color: var(--color-primary);
      }
    }

    .week-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 180px;
      justify-content: center;
    }

    .week-range {
      font-family: 'Rubik', var(--font-family-display);
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .current-week-badge {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.125rem 0.5rem;
      background: var(--color-primary-alpha);
      color: var(--color-primary);
      border-radius: 1rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .today-btn {
      font-size: 0.8rem;
      gap: 0.25rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .add-btn {
      font-size: 0.8rem;
      gap: 0.25rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* ===== Filter Bar ===== */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
      user-select: none;

      input {
        width: 16px;
        height: 16px;
        accent-color: var(--color-primary);
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        color: var(--text-secondary);

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    /* ===== Loading ===== */
    .loading-container {
      padding: 1rem 0;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.75rem;
    }

    .skeleton-column {
      background: linear-gradient(
        90deg,
        var(--surface-secondary) 25%,
        var(--surface-hover) 50%,
        var(--surface-secondary) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 1rem;
      height: 400px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ===== Week Grid ===== */
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(7, minmax(140px, 1fr));
      }
    }

    /* ===== Day Column ===== */
    .day-column {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      min-height: 400px;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
      }

      &.is-today {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 1px var(--color-primary-alpha);

        .day-header {
          background: var(--color-primary-alpha);
          border-color: transparent;

          .day-name,
          .day-date {
            color: var(--color-primary);
          }
        }
      }

      &.is-tomorrow {
        .day-header {
          background: var(--surface-secondary);
        }
      }
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      position: relative;
    }

    .day-name {
      font-family: 'Rubik', var(--font-family-display);
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .day-date {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .unassigned-badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      width: 18px;
      height: 18px;
      background: var(--color-warning, #f59e0b);
      color: white;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .day-tasks {
      flex: 1;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;

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

    .empty-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      color: var(--text-tertiary);
      text-align: center;
      flex: 1;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      span {
        font-size: 0.8rem;
      }
    }

    /* ===== Task Card ===== */
    .task-card {
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      padding: 0.625rem;
      border-right: 3px solid var(--category-color, var(--color-primary));
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        background: var(--surface-hover);
        transform: translateX(-2px);
      }

      &.unassigned {
        background: rgba(245, 158, 11, 0.08);
        border-right-color: var(--color-warning, #f59e0b);
      }

      &.mine {
        background: var(--color-primary-alpha);
      }

      &.completed {
        opacity: 0.6;

        .task-title {
          text-decoration: line-through;
        }
      }
    }

    .task-time {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .task-content {
      margin-bottom: 0.375rem;
    }

    .task-title {
      display: block;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-location {
      display: flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.7rem;
      color: var(--text-tertiary);
      margin-top: 0.125rem;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }

    .task-children {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.375rem;
    }

    .child-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Rubik', var(--font-family-display);
      font-weight: 600;
      font-size: 0.65rem;
    }

    .task-driver {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.5rem;
      background: var(--surface-primary);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--surface-hover);
      }
    }

    .driver-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 600;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .driver-name {
      font-size: 0.75rem;
      color: var(--text-primary);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unassigned-indicator {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--color-warning, #f59e0b);
      font-size: 0.75rem;
      flex: 1;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .dropdown-arrow {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--text-tertiary);
    }

    .complete-btn {
      position: absolute;
      top: 0.375rem;
      left: 0.375rem;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: all 0.2s ease;

      &:hover {
        color: var(--color-success, #10b981);
        background: var(--color-success-alpha, rgba(16, 185, 129, 0.1));
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .completed-indicator {
      position: absolute;
      top: 0.375rem;
      left: 0.375rem;
      color: var(--color-success, #10b981);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    /* ===== Menu Styles ===== */
    .menu-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 0.25rem 0;
    }

    .member-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .check-icon {
      margin-right: auto;
      color: var(--color-primary);
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .planner-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-nav {
        justify-content: center;
      }

      .header-actions {
        justify-content: center;
      }

      .week-grid {
        grid-template-columns: repeat(7, minmax(120px, 1fr));
      }

      .day-column {
        min-height: 300px;
      }

      .skeleton-grid {
        grid-template-columns: repeat(7, minmax(120px, 1fr));
      }
    }
  `],
})
export class PlannerViewComponent implements OnInit {
  transportationService = inject(TransportationService);
  private familyService = inject(FamilyService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  // State
  private _weekStartDate = signal<Date>(this.transportationService.getWeekStart(new Date()));
  private _showOnlyUnassigned = signal(false);
  private _showOnlyMine = signal(false);
  private _weekDays = signal<TransportationDayView[]>([]);

  // Public signals
  readonly showOnlyUnassigned = this._showOnlyUnassigned.asReadonly();
  readonly showOnlyMine = this._showOnlyMine.asReadonly();

  readonly familyMembers = computed(() => this.familyService.members());

  readonly weekRangeLabel = computed(() => {
    const start = this._weekStartDate();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startStr = start.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

    return `${startStr} - ${endStr}`;
  });

  readonly isCurrentWeek = computed(() => {
    const currentWeekStart = this.transportationService.getWeekStart(new Date());
    return this._weekStartDate().getTime() === currentWeekStart.getTime();
  });

  readonly filteredDays = computed(() => {
    const days = this._weekDays();
    const showUnassigned = this._showOnlyUnassigned();
    const showMine = this._showOnlyMine();

    if (!showUnassigned && !showMine) {
      return days;
    }

    return days.map(day => ({
      ...day,
      tasks: day.tasks.filter(task => {
        if (showUnassigned && showMine) {
          return !task.task.driverUserId || task.isCurrentUserDriver;
        }
        if (showUnassigned) {
          return !task.task.driverUserId;
        }
        if (showMine) {
          return task.isCurrentUserDriver;
        }
        return true;
      }),
    })).map(day => ({
      ...day,
      totalTasks: day.tasks.length,
      assignedTasks: day.tasks.filter(t => t.task.driverUserId).length,
      unassignedTasks: day.tasks.filter(t => !t.task.driverUserId).length,
    }));
  });

  ngOnInit(): void {
    this.loadWeek();
  }

  async loadWeek(): Promise<void> {
    const days = await this.transportationService.buildWeekView(this._weekStartDate());
    this._weekDays.set(days);
  }

  previousWeek(): void {
    const newStart = new Date(this._weekStartDate());
    newStart.setDate(newStart.getDate() - 7);
    this._weekStartDate.set(newStart);
    this.loadWeek();
  }

  nextWeek(): void {
    const newStart = new Date(this._weekStartDate());
    newStart.setDate(newStart.getDate() + 7);
    this._weekStartDate.set(newStart);
    this.loadWeek();
  }

  goToCurrentWeek(): void {
    this._weekStartDate.set(this.transportationService.getWeekStart(new Date()));
    this.loadWeek();
  }

  toggleUnassignedFilter(): void {
    this._showOnlyUnassigned.update(v => !v);
  }

  toggleMineFilter(): void {
    this._showOnlyMine.update(v => !v);
  }

  async assignDriver(taskId: string, driverId: string | null): Promise<void> {
    try {
      await this.transportationService.assignDriver(taskId, driverId);
      // Reload to refresh the view
      await this.loadWeek();
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  }

  async markComplete(taskId: string): Promise<void> {
    try {
      await this.transportationService.updateTaskStatus(taskId, 'completed');
      await this.loadWeek();
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  }

  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(AddTaskDialogComponent, {
      data: { date: this._weekStartDate() },
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadWeek();
      }
    });
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
}

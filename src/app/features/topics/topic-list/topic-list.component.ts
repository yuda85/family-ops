import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { TopicsService } from '../topics.service';
import { TopicCardComponent } from '../components/topic-card/topic-card.component';
import { TopicFormComponent } from '../topic-form/topic-form.component';
import {
  TopicStatus,
  TopicCategory,
  TopicStatusGroup,
  TOPIC_CATEGORIES,
  TOPIC_STATUSES,
} from '../topics.models';

@Component({
  selector: 'app-topic-list',
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
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EmptyStateComponent,
    TopicCardComponent,
  ],
  template: `
    <div class="topics-page">
      <header class="page-header">
        <div class="header-top">
          <h1>נושאים חשובים</h1>
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            נושא חדש
          </button>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              placeholder="חיפוש נושאים..."
              [ngModel]="topicsService.searchQuery()"
              (ngModelChange)="onSearchChange($event)"
            />
            @if (topicsService.searchQuery()) {
              <button matSuffix mat-icon-button (click)="onSearchChange('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-select
              [value]="topicsService.filterCategory()"
              (valueChange)="onCategoryChange($event)"
            >
              <mat-option value="all">כל הקטגוריות</mat-option>
              @for (cat of categories; track cat.id) {
                <mat-option [value]="cat.id">
                  {{ cat.labelHe }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Stats -->
        @if (topicsService.totalCount() > 0) {
          <div class="stats-bar">
            <span class="stat">{{ topicsService.activeTopicsCount() }} נושאים פעילים</span>
            <span class="stat">{{ topicsService.totalCount() }} סה"כ</span>
          </div>
        }
      </header>

      @if (topicsService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען נושאים...</p>
        </div>
      } @else if (topicsService.groupedTopics().length > 0) {
        <div class="status-groups">
          @for (group of topicsService.groupedTopics(); track group.status) {
            <section class="status-group" [class.collapsed]="group.isCollapsed">
              <button class="group-header" (click)="toggleGroup(group)">
                <div class="group-info">
                  <mat-icon [style.color]="group.statusMeta.color">
                    {{ group.statusMeta.icon }}
                  </mat-icon>
                  <span class="group-name">{{ group.statusMeta.labelHe }}</span>
                  <span class="group-count">{{ group.topics.length }}</span>
                </div>
                <mat-icon class="chevron">
                  {{ group.isCollapsed ? 'expand_more' : 'expand_less' }}
                </mat-icon>
              </button>

              @if (!group.isCollapsed) {
                <div class="topics-grid">
                  @for (topic of group.topics; track topic.id) {
                    <app-topic-card
                      [topic]="topic"
                      (pinToggle)="onTogglePin(topic.id)"
                      (statusChange)="onStatusChange(topic.id, $event)"
                      (delete)="onDelete(topic.id)"
                    ></app-topic-card>
                  }
                </div>
              }
            </section>
          }
        </div>
      } @else if (topicsService.searchQuery() || topicsService.filterCategory() !== 'all') {
        <app-empty-state
          icon="search_off"
          title="לא נמצאו תוצאות"
          description="נסו לשנות את החיפוש או הסינון"
        ></app-empty-state>
      } @else {
        <app-empty-state
          icon="topic"
          title="אין נושאים עדיין"
          description="צרו נושא חדש כדי להתחיל לתכנן יחד עם המשפחה"
          [actionLabel]="'נושא חדש'"
          (action)="openCreateDialog()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .topics-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .filters-bar {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;

      .search-field {
        flex: 1;
        min-width: 200px;
      }

      .filter-field {
        width: 160px;

        @media (max-width: 480px) {
          width: 100%;
        }
      }

      mat-form-field {
        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }
      }
    }

    .stats-bar {
      display: flex;
      gap: 1rem;

      .stat {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .status-groups {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .status-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--surface-secondary);
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: var(--surface-hover);
      }

      .group-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .group-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .group-count {
          background: var(--surface-tertiary);
          color: var(--text-secondary);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      }

      .chevron {
        color: var(--text-tertiary);
      }
    }

    .topics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TopicListComponent implements OnInit, OnDestroy {
  topicsService = inject(TopicsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  categories = TOPIC_CATEGORIES;
  statuses = TOPIC_STATUSES;

  ngOnInit(): void {
    this.topicsService.subscribeToTopics();
  }

  ngOnDestroy(): void {
    // Service handles cleanup in its own ngOnDestroy
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TopicFormComponent, {
      width: '100%',
      maxWidth: '500px',
      panelClass: 'topic-form-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('נושא נוצר בהצלחה', '', { duration: 2000 });
      }
    });
  }

  toggleGroup(group: TopicStatusGroup): void {
    this.topicsService.toggleStatusCollapsed(group.status);
  }

  onSearchChange(query: string): void {
    this.topicsService.setSearchQuery(query);
  }

  onCategoryChange(category: TopicCategory | 'all'): void {
    this.topicsService.setCategoryFilter(category);
  }

  async onTogglePin(topicId: string): Promise<void> {
    try {
      await this.topicsService.togglePin(topicId);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async onStatusChange(topicId: string, newStatus: string): Promise<void> {
    try {
      await this.topicsService.changeStatus(topicId, newStatus as TopicStatus);
      this.snackBar.open('הסטטוס עודכן', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async onDelete(topicId: string): Promise<void> {
    // TODO: Add confirmation dialog
    try {
      await this.topicsService.deleteTopic(topicId);
      this.snackBar.open('הנושא נמחק', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      @if (icon) {
        <mat-icon class="empty-state-icon">{{ icon }}</mat-icon>
      }
      <h3 class="empty-state-title">{{ title }}</h3>
      @if (description) {
        <p class="empty-state-description">{{ description }}</p>
      }
      @if (actionLabel) {
        <button mat-flat-button color="primary" (click)="action.emit()">
          @if (actionIcon) {
            <mat-icon>{{ actionIcon }}</mat-icon>
          }
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .empty-state-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
      opacity: 0.6;
    }

    .empty-state-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
    }

    .empty-state-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      max-width: 300px;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    button {
      mat-icon {
        margin-inline-end: 0.5rem;
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() title = 'אין נתונים';
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Output() action = new EventEmitter<void>();
}

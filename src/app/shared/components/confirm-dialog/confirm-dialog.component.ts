import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      @if (data.icon) {
        <mat-icon class="dialog-icon" [class.warn]="data.confirmColor === 'warn'">
          {{ data.icon }}
        </mat-icon>
      }

      <h2 mat-dialog-title>{{ data.title }}</h2>

      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="start">
        <button mat-button [mat-dialog-close]="false">
          {{ data.cancelLabel || 'ביטול' }}
        </button>
        <button
          mat-flat-button
          [color]="data.confirmColor || 'primary'"
          [mat-dialog-close]="true"
        >
          {{ data.confirmLabel || 'אישור' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      text-align: center;
      padding: 1rem;
    }

    .dialog-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-primary);
      margin-bottom: 1rem;

      &.warn {
        color: var(--color-error);
      }
    }

    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
    }

    mat-dialog-content {
      padding: 0 0 1rem;

      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    }

    mat-dialog-actions {
      padding: 0;
      gap: 0.75rem;
      justify-content: center;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}

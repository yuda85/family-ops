import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TopicStatus, getStatusMeta } from '../../topics.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="status-badge" [style.--badge-color]="statusMeta.color">
      <mat-icon>{{ statusMeta.icon }}</mat-icon>
      <span class="label">{{ statusMeta.labelHe }}</span>
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: color-mix(in srgb, var(--badge-color) 15%, transparent);
      color: var(--badge-color);

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: TopicStatus;

  get statusMeta() {
    return getStatusMeta(this.status);
  }
}

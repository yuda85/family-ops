import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen" [class.overlay]="overlay">
      <div class="spinner-wrapper">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
        @if (message) {
          <p class="loading-message">{{ message }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;

      &.fullscreen {
        position: fixed;
        inset: 0;
        background: var(--surface-app);
        z-index: 9999;
      }

      &.overlay {
        position: absolute;
        inset: 0;
        background: var(--surface-overlay);
        z-index: 100;
      }
    }

    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      border: 3px solid var(--border-default);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-message {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size = 32;
  @Input() message?: string;
  @Input() fullscreen = false;
  @Input() overlay = false;
}

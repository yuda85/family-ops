import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfettiService } from '../../confetti.service';

@Component({
  selector: 'app-confetti',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confettiService.isActive()) {
      <div class="confetti-container" [class.big]="confettiService.intensity() === 'big'">
        @for (i of confettiPieces; track i) {
          <div
            class="confetti-piece"
            [style.--delay]="getDelay(i)"
            [style.--left]="getLeft(i)"
            [style.--color]="getColor(i)"
            [style.--rotation]="getRotation(i)"
            [style.--size]="getSize(i)"
          ></div>
        }
      </div>
    }
  `,
  styles: [`
    .confetti-container {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    }

    .confetti-piece {
      position: absolute;
      top: -20px;
      width: calc(var(--size) * 1px);
      height: calc(var(--size) * 1.5px);
      background: var(--color);
      left: calc(var(--left) * 1%);
      animation: confetti-fall 2s ease-out forwards;
      animation-delay: calc(var(--delay) * 1ms);
      transform: rotate(calc(var(--rotation) * 1deg));
      border-radius: 2px;
    }

    .confetti-container.big .confetti-piece {
      animation-duration: 3s;
    }

    @keyframes confetti-fall {
      0% {
        top: -20px;
        opacity: 1;
        transform: rotate(calc(var(--rotation) * 1deg)) translateX(0);
      }
      100% {
        top: 100vh;
        opacity: 0;
        transform: rotate(calc(var(--rotation) * 1deg + 720deg)) translateX(calc(var(--left) * 0.5px - 25px));
      }
    }
  `]
})
export class ConfettiComponent {
  confettiService = inject(ConfettiService);

  // Generate pieces based on intensity
  get confettiPieces(): number[] {
    const count = this.confettiService.intensity() === 'big' ? 100 : 30;
    return Array.from({ length: count }, (_, i) => i);
  }

  private colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
    '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
  ];

  getDelay(index: number): number {
    return Math.random() * 500;
  }

  getLeft(index: number): number {
    return Math.random() * 100;
  }

  getColor(index: number): string {
    return this.colors[index % this.colors.length];
  }

  getRotation(index: number): number {
    return Math.random() * 360;
  }

  getSize(index: number): number {
    return 8 + Math.random() * 8;
  }
}

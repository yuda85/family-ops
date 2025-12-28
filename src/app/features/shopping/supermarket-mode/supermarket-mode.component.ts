import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-supermarket-mode',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="supermarket-page">
      <app-empty-state
        icon="shopping_basket"
        title="מצב סופר"
        description="מצב הסופר עם מטרות מגע גדולות יהיה זמין בקרוב"
      ></app-empty-state>
    </div>
  `,
  styles: [`
    .supermarket-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class SupermarketModeComponent {}

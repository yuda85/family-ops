import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-staples',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="staples-page">
      <h1>מוצרים קבועים</h1>
      <app-empty-state
        icon="star"
        title="אין מוצרים קבועים"
        description="הוסיפו מוצרים שאתם קונים באופן קבוע"
        actionLabel="הוסף מוצרים"
        actionIcon="add"
      ></app-empty-state>
    </div>
  `,
  styles: [`
    .staples-page {
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 1.5rem;
        color: var(--text-primary);
      }
    }
  `]
})
export class StaplesComponent {}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-rides-view',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="rides-view-page">
      <h1>הסעות</h1>
      <app-empty-state
        icon="directions_car"
        title="לוח הסעות"
        description="לוח ההסעות יהיה זמין בקרוב"
      ></app-empty-state>
    </div>
  `,
  styles: [`
    .rides-view-page {
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 1.5rem;
        color: var(--text-primary);
      }
    }
  `]
})
export class RidesViewComponent {}

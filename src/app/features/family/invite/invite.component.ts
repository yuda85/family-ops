import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="invite-page">
      <h1>הזמנה למשפחה</h1>
      <app-empty-state
        icon="mail"
        title="יצירת הזמנה"
        description="יצירת הזמנות תהיה זמינה בקרוב"
      ></app-empty-state>
    </div>
  `,
  styles: [`
    .invite-page {
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 1.5rem;
        color: var(--text-primary);
      }
    }
  `]
})
export class InviteComponent {}

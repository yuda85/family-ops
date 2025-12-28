import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="event-detail-page">
      <app-empty-state
        icon="event"
        title="פרטי אירוע"
        description="תצוגת פרטי האירוע תהיה זמינה בקרוב"
      ></app-empty-state>
    </div>
  `,
  styles: [`
    .event-detail-page {
      padding: 2rem;
    }
  `]
})
export class EventDetailComponent {}

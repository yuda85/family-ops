import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent {}

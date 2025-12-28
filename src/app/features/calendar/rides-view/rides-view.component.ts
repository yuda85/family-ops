import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-rides-view',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './rides-view.component.html',
  styleUrl: './rides-view.component.scss',
})
export class RidesViewComponent {}

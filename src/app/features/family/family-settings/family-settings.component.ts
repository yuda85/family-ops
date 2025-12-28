import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-family-settings',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="family-settings-page">
      <h1>הגדרות משפחה</h1>
      <app-empty-state
        icon="settings"
        title="הגדרות משפחה"
        description="הגדרות המשפחה יהיו זמינות בקרוב"
      ></app-empty-state>
    </div>
  `,
  styles: [`
    .family-settings-page {
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 1.5rem;
        color: var(--text-primary);
      }
    }
  `]
})
export class FamilySettingsComponent {}

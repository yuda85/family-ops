import { Component } from '@angular/core';

import { ActivitiesComponent } from '../settings/activities/activities.component';
import { PREVIEW_PROVIDERS } from './preview-data';

/** Development-only harness for the recurring activities screen. */
@Component({
  selector: 'app-activities-preview',
  standalone: true,
  imports: [ActivitiesComponent],
  providers: PREVIEW_PROVIDERS,
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; padding: 0 16px; }'],
  template: `<app-activities></app-activities>`,
})
export class ActivitiesPreviewComponent {}

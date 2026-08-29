import { Component } from '@angular/core';

import { AvailabilityComponent } from '../settings/availability/availability.component';
import { PREVIEW_PROVIDERS } from './preview-data';

/** Development-only harness for the parent availability editor. */
@Component({
  selector: 'app-availability-preview',
  standalone: true,
  imports: [AvailabilityComponent],
  providers: PREVIEW_PROVIDERS,
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; padding: 0 16px; }'],
  template: `<app-availability></app-availability>`,
})
export class AvailabilityPreviewComponent {}

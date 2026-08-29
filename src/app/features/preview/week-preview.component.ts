import { Component } from '@angular/core';

import { WeekComponent } from '../week/week.component';
import { PREVIEW_PROVIDERS } from './preview-data';

/** Development-only harness for the Week screen. */
@Component({
  selector: 'app-week-preview',
  standalone: true,
  imports: [WeekComponent],
  providers: PREVIEW_PROVIDERS,
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; padding: 0 16px; }'],
  template: `<app-week></app-week>`,
})
export class WeekPreviewComponent {}

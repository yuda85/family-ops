import { Component } from '@angular/core';

import { TodayComponent } from '../today/today.component';
import { PREVIEW_PROVIDERS } from './preview-data';

/** Development-only harness for the Today screen. */
@Component({
  selector: 'app-today-preview',
  standalone: true,
  imports: [TodayComponent],
  providers: PREVIEW_PROVIDERS,
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; padding: 0 16px; }'],
  template: `<app-today></app-today>`,
})
export class TodayPreviewComponent {}

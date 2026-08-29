import { Component } from '@angular/core';

import { ImportScheduleComponent } from '../settings/import/import-schedule.component';
import { SeedService } from '../../core/schedule/seed.service';
import { PREVIEW_PROVIDERS } from './preview-data';

/** Development-only harness. Parses and previews, but never writes. */
@Component({
  selector: 'app-import-preview',
  standalone: true,
  imports: [ImportScheduleComponent],
  providers: [
    ...PREVIEW_PROVIDERS,
    { provide: SeedService, useValue: { apply: async () => ({ children: 0, activities: 0 }) } },
  ],
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; padding: 0 16px; }'],
  template: `<app-import-schedule></app-import-schedule>`,
})
export class ImportPreviewComponent {}

import { Component } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { PresenceSheetComponent } from '../../shared/sheets/presence-sheet.component';
import { toDateStr } from '../../core/schedule/date-utils';
import { PREVIEW_PROVIDERS } from './preview-data';

/**
 * Development-only harness. A bottom sheet is normally created in the root
 * injector, so the preview stubs never reach it; rendering it directly is the
 * only way to see it against sample data.
 */
@Component({
  selector: 'app-presence-preview',
  standalone: true,
  imports: [PresenceSheetComponent],
  providers: [
    ...PREVIEW_PROVIDERS,
    {
      provide: MAT_BOTTOM_SHEET_DATA,
      useValue: {
        date: toDateStr(new Date()),
        presence: [{ memberId: 'm1', worksFromHome: true }],
      },
    },
    { provide: MatBottomSheetRef, useValue: { dismiss: () => undefined } },
  ],
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; }'],
  template: `<app-presence-sheet></app-presence-sheet>`,
})
export class PresencePreviewComponent {}

import { Component } from '@angular/core';

import { SettingsHomeComponent } from '../settings/settings-home/settings-home.component';
import { PREVIEW_PROVIDERS } from './preview-data';

/** Development-only harness for the settings screen. */
@Component({
  selector: 'app-settings-preview',
  standalone: true,
  imports: [SettingsHomeComponent],
  providers: PREVIEW_PROVIDERS,
  styles: [':host { display: block; max-width: 640px; margin-inline: auto; padding: 0 16px; }'],
  template: `<app-settings-home></app-settings-home>`,
})
export class SettingsPreviewComponent {}

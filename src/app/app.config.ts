import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';
import { registerLocaleData } from '@angular/common';
import localeHe from '@angular/common/locales/he';

// Hebrew day and month names for the date pipe.
registerLocaleData(localeHe, 'he');

import { routes } from './app.routes';
import { initializeFirebase } from './core/firebase/firebase.config';

// Firebase initialization function
function initializeApp(): () => Promise<void> {
  return () => {
    return new Promise((resolve) => {
      initializeFirebase();
      resolve();
    });
  };
}

// Material Symbols replaces the legacy Material Icons font; mat-icon needs to
// be told which ligature class to render with.
function useMaterialSymbols(registry: MatIconRegistry): () => void {
  return () => registry.setDefaultFontSetClass('material-symbols-rounded');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Hash routing keeps deep links working on GitHub Pages static hosting.
    // View transitions are deliberately off: they threw InvalidStateError on
    // every navigation here, and the design does not rely on them.
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(),
    // Provide native date adapter for datepicker
    provideNativeDateAdapter(),
    // Set locale for dates - en-GB uses DD/MM/YYYY format
    { provide: LOCALE_ID, useValue: 'he' },
    { provide: MAT_DATE_LOCALE, useValue: 'he-IL' },
    // Initialize Firebase before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: useMaterialSymbols,
      deps: [MatIconRegistry],
      multi: true,
    },
  ],
};

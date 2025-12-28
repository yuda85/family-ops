import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, withHashLocation, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withHashLocation(), // Use hash-based routing for GitHub Pages
      withViewTransitions() // Smooth page transitions
    ),
    provideAnimationsAsync(),
    // Provide native date adapter for datepicker
    provideNativeDateAdapter(),
    // Set locale for dates - en-GB uses DD/MM/YYYY format
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    // Initialize Firebase before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
  ],
};

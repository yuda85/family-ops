import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, withHashLocation, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

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
    // Initialize Firebase before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
  ],
};

import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard that checks if user is authenticated
 * Redirects to login page if not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to fully initialize (including user document)
  if (!authService.isInitialized()) {
    // Return a promise that resolves when initialization is complete
    return new Promise<boolean>((resolve) => {
      const checkAuth = () => {
        if (authService.isInitialized()) {
          if (authService.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: state.url },
            });
            resolve(false);
          }
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};

/**
 * Guard that checks if user is NOT authenticated
 * Redirects to app if already authenticated (for login/register pages)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to fully initialize (including user document)
  if (!authService.isInitialized()) {
    return new Promise<boolean>((resolve) => {
      const checkAuth = () => {
        if (authService.isInitialized()) {
          if (!authService.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/app']);
            resolve(false);
          }
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/app']);
  return false;
};

/**
 * Route matcher for auth guard
 */
export const authMatch: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isInitialized()) {
    return new Promise<boolean>((resolve) => {
      const checkAuth = () => {
        if (authService.isInitialized()) {
          resolve(authService.isAuthenticated());
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  return authService.isAuthenticated();
};

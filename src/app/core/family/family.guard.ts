import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { FamilyService } from './family.service';

/**
 * Guard that checks if user has an active family
 * Redirects to family selection if no active family
 */
export const familyGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const familyService = inject(FamilyService);
  const router = inject(Router);

  // Wait for auth to be ready
  if (authService.isLoading()) {
    await new Promise<void>((resolve) => {
      const checkLoading = () => {
        if (!authService.isLoading()) {
          resolve();
        } else {
          setTimeout(checkLoading, 50);
        }
      };
      checkLoading();
    });
  }

  // Check if authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const user = authService.user();
  const activeFamilyId = authService.activeFamilyId();

  // Check if user has any families
  if (!user || Object.keys(user.familyMemberships).length === 0) {
    // No families - redirect to create/join family
    router.navigate(['/family-select']);
    return false;
  }

  // Check if there's an active family
  if (!activeFamilyId) {
    // Has families but none selected
    const familyIds = Object.keys(user.familyMemberships);
    if (familyIds.length === 1) {
      // Auto-select if only one family
      await authService.setActiveFamily(familyIds[0]);
    } else {
      // Multiple families - go to selection
      router.navigate(['/family-select']);
      return false;
    }
  }

  // Verify active family is valid
  const finalActiveFamilyId = authService.activeFamilyId();
  if (finalActiveFamilyId && user.familyMemberships[finalActiveFamilyId]) {
    // Load the family if not already loaded
    if (familyService.familyId() !== finalActiveFamilyId) {
      try {
        await familyService.loadFamily(finalActiveFamilyId);
      } catch (error) {
        console.error('Error loading family:', error);
        router.navigate(['/family-select']);
        return false;
      }
    }
    return true;
  }

  // Active family is invalid
  router.navigate(['/family-select']);
  return false;
};

/**
 * Guard for family admin routes
 */
export const familyAdminGuard: CanActivateFn = async (route, state) => {
  const familyService = inject(FamilyService);
  const router = inject(Router);

  // First check the family guard
  const hasFamily = await familyGuard(route, state);
  if (!hasFamily) {
    return false;
  }

  // Check if user is admin
  if (!familyService.isAdmin()) {
    router.navigate(['/app']);
    return false;
  }

  return true;
};

/**
 * Guard for family owner routes
 */
export const familyOwnerGuard: CanActivateFn = async (route, state) => {
  const familyService = inject(FamilyService);
  const router = inject(Router);

  // First check the family guard
  const hasFamily = await familyGuard(route, state);
  if (!hasFamily) {
    return false;
  }

  // Check if user is owner
  if (!familyService.isOwner()) {
    router.navigate(['/app']);
    return false;
  }

  return true;
};

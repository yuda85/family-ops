import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemePreference } from '../auth/auth.models';

const THEME_STORAGE_KEY = 'familyops-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);

  // Signal for theme preference
  private _themePreference = signal<ThemePreference>(this.getStoredTheme());

  // Signal for system preference
  private _systemPrefersDark = signal(this.getSystemPreference());

  // Public readable signals
  readonly themePreference = this._themePreference.asReadonly();
  readonly systemPrefersDark = this._systemPrefersDark.asReadonly();

  // Computed actual theme (resolves 'system' to actual theme)
  readonly isDarkMode = computed(() => {
    const preference = this._themePreference();
    if (preference === 'system') {
      return this._systemPrefersDark();
    }
    return preference === 'dark';
  });

  readonly currentTheme = computed<'light' | 'dark'>(() => {
    return this.isDarkMode() ? 'dark' : 'light';
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Listen to system preference changes
      this.setupSystemPreferenceListener();

      // Apply theme on initialization
      this.applyTheme();

      // React to theme changes
      effect(() => {
        this.applyTheme();
      });
    }
  }

  /**
   * Set theme preference
   */
  setTheme(theme: ThemePreference): void {
    this._themePreference.set(theme);
    this.storeTheme(theme);
  }

  /**
   * Toggle between light and dark (ignores system preference)
   */
  toggleTheme(): void {
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Cycle through themes: light -> dark -> system -> light
   */
  cycleTheme(): void {
    const current = this._themePreference();
    const themes: ThemePreference[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  /**
   * Apply the current theme to the document
   */
  private applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const theme = this.currentTheme();
    const html = document.documentElement;

    // Remove existing theme
    html.removeAttribute('data-theme');

    // Apply new theme
    html.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === 'dark' ? '#1e1e1e' : '#ffffff'
      );
    }
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): ThemePreference {
    if (!isPlatformBrowser(this.platformId)) return 'system';

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  }

  /**
   * Store theme preference in localStorage
   */
  private storeTheme(theme: ThemePreference): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  /**
   * Get system color scheme preference
   */
  private getSystemPreference(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Setup listener for system preference changes
   */
  private setupSystemPreferenceListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      this._systemPrefersDark.set(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
  }

  /**
   * Get theme icon based on current preference
   */
  getThemeIcon(): string {
    const preference = this._themePreference();
    switch (preference) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'system':
        return 'contrast';
      default:
        return 'contrast';
    }
  }

  /**
   * Get theme label in Hebrew
   */
  getThemeLabel(): string {
    const preference = this._themePreference();
    switch (preference) {
      case 'light':
        return 'בהיר';
      case 'dark':
        return 'כהה';
      case 'system':
        return 'מערכת';
      default:
        return 'מערכת';
    }
  }
}

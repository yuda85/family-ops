import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingSpinnerComponent],
  template: `
    @if (authService.isLoading()) {
      <app-loading-spinner
        [fullscreen]="true"
        message="טוען..."
      ></app-loading-spinner>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class App implements OnInit {
  authService = inject(AuthService);
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    // Theme service initializes automatically
    // Auth state is monitored by AuthService
  }
}

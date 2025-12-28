import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    HeaderComponent,
    BottomNavComponent,
  ],
  template: `
    <div class="app-layout">
      <app-header
        [showMenuButton]="true"
        (menuClick)="toggleSidenav()"
      ></app-header>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          [mode]="sidenavMode()"
          [opened]="sidenavOpened()"
          (openedChange)="sidenavOpened.set($event)"
          position="end"
          class="sidenav"
        >
          <nav class="sidenav-nav">
            <mat-nav-list>
              @for (item of navItems; track item.path) {
                <a
                  mat-list-item
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  (click)="closeSidenavOnMobile()"
                >
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span matListItemTitle>{{ item.label }}</span>
                </a>
              }
            </mat-nav-list>
          </nav>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <main class="page-container">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <app-bottom-nav class="mobile-nav"></app-bottom-nav>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .sidenav-container {
      flex: 1;
    }

    .sidenav {
      width: 280px;
      background: var(--sidebar-bg);
      border-inline-start: 1px solid var(--border-subtle);

      @media (max-width: 767px) {
        width: 260px;
      }
    }

    .sidenav-nav {
      padding-top: 1rem;
    }

    .main-content {
      background: var(--surface-app);
      min-height: 100%;
    }

    .page-container {
      padding: 1.5rem;
      padding-bottom: calc(1.5rem + 64px); // Account for bottom nav on mobile
      max-width: 1200px;
      margin: 0 auto;

      @media (min-width: 768px) {
        padding: 2rem;
        padding-bottom: 2rem;
      }
    }

    .mobile-nav {
      @media (min-width: 768px) {
        display: none;
      }
    }

    // Navigation item styles
    mat-nav-list {
      a {
        border-radius: 0.75rem;
        margin: 0.25rem 0.75rem;

        &.active {
          background: var(--color-primary-alpha);
          color: var(--color-primary);

          mat-icon {
            color: var(--color-primary);
          }
        }
      }
    }
  `]
})
export class MainLayoutComponent {
  sidenavOpened = signal(false);
  sidenavMode = signal<'over' | 'side'>('over');

  navItems: NavItem[] = [
    { path: '/app/calendar', icon: 'calendar_month', label: 'יומן משפחתי' },
    { path: '/app/shopping', icon: 'shopping_cart', label: 'רשימת קניות' },
    { path: '/app/family/children', icon: 'child_care', label: 'הילדים' },
    { path: '/app/family/members', icon: 'group', label: 'חברי משפחה' },
    { path: '/app/settings', icon: 'settings', label: 'הגדרות' },
  ];

  constructor() {
    // Check screen size on init
    this.updateSidenavMode();

    // Listen for resize
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.updateSidenavMode());
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((v) => !v);
  }

  closeSidenavOnMobile(): void {
    if (this.sidenavMode() === 'over') {
      this.sidenavOpened.set(false);
    }
  }

  private updateSidenavMode(): void {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      this.sidenavMode.set(isDesktop ? 'side' : 'over');
      // Auto-open on desktop
      if (isDesktop && !this.sidenavOpened()) {
        this.sidenavOpened.set(true);
      }
    }
  }
}

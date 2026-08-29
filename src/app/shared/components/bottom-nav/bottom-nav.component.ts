import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

/**
 * Primary navigation. Three destinations, no more.
 * Icon + label always (icon-only nav harms discoverability).
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatRippleModule],
  template: `
    <nav class="bottom-nav" aria-label="ניווט ראשי">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          #rla="routerLinkActive"
          [attr.aria-current]="rla.isActive ? 'page' : null"
          class="nav-item"
          matRipple
        >
          <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .bottom-nav {
        position: fixed;
        inset-inline: 0;
        bottom: 0;
        display: flex;
        align-items: stretch;
        justify-content: space-around;
        background: var(--surface);
        border-top: 1px solid var(--border);
        padding-bottom: env(safe-area-inset-bottom, 0);
        z-index: 100;
      }

      .nav-item {
        flex: 1;
        min-height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        color: var(--text-muted);
        text-decoration: none;
        transition: color 160ms ease;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        &.active {
          color: var(--accent);
          font-weight: 600;
        }
      }

      .nav-label {
        font-size: 0.6875rem;
        line-height: 1;
      }

      @media (prefers-reduced-motion: reduce) {
        .nav-item {
          transition: none;
        }
      }
    `,
  ],
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    { path: '/app/today', icon: 'today', label: 'היום' },
    { path: '/app/week', icon: 'view_week', label: 'השבוע' },
    { path: '/app/settings', icon: 'settings', label: 'הגדרות' },
  ];
}

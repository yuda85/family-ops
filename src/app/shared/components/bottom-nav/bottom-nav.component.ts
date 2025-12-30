import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';

import { BudgetService } from '../../../features/budget/budget.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  exactMatch?: boolean;
  hasBadge?: boolean;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, MatBadgeModule],
  template: `
    <nav class="bottom-nav">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.exactMatch ?? false }"
          class="nav-item"
          matRipple
        >
          <div class="icon-wrapper">
            <mat-icon
              [matBadge]="item.hasBadge && showBudgetBadge() ? '!' : null"
              matBadgeColor="warn"
              matBadgeSize="small"
            >{{ item.icon }}</mat-icon>
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: var(--bottom-nav-bg);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 1000;
      padding-bottom: env(safe-area-inset-bottom, 0);

      @media (min-width: 768px) {
        display: none;
      }
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      color: var(--text-tertiary);
      text-decoration: none;
      transition: all 0.2s ease;
      border-radius: 0.75rem;
      min-width: 56px;

      .icon-wrapper {
        position: relative;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &:hover {
        color: var(--text-secondary);
        background: var(--surface-hover);
      }

      &.active {
        color: var(--color-primary);

        mat-icon {
          transform: scale(1.1);
        }
      }
    }

    .nav-label {
      font-size: 0.625rem;
      font-weight: 500;
      text-align: center;
    }

    ::ng-deep .mat-badge-content {
      font-size: 10px !important;
      width: 16px !important;
      height: 16px !important;
      line-height: 16px !important;
    }
  `]
})
export class BottomNavComponent {
  private budgetService = inject(BudgetService);

  showBudgetBadge = this.budgetService.needsClosingBadge;

  navItems: NavItem[] = [
    { path: '/app/dashboard', icon: 'dashboard', label: 'בית', exactMatch: true },
    { path: '/app/calendar', icon: 'calendar_month', label: 'יומן', exactMatch: false },
    { path: '/app/shopping', icon: 'shopping_cart', label: 'קניות', exactMatch: false },
    { path: '/app/budget', icon: 'account_balance_wallet', label: 'תקציב', exactMatch: false, hasBadge: true },
    { path: '/app/topics', icon: 'topic', label: 'נושאים', exactMatch: false },
  ];
}

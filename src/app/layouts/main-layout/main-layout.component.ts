import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

/**
 * App shell: scrolling content + fixed bottom nav.
 * No sidenav - three destinations do not justify one.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, BottomNavComponent],
  template: `
    <div class="app-layout">
      <main class="page" id="main-content" tabindex="-1">
        <router-outlet></router-outlet>
      </main>
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [
    `
      .app-layout {
        min-height: 100dvh;
        background: var(--surface-sunken);
      }

      .page {
        max-width: 640px;
        margin-inline: auto;
        padding: 0 16px;
        /* clear the fixed bottom nav */
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
      }
    `,
  ],
})
export class MainLayoutComponent {}

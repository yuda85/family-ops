import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../../core/family/family.service';
import type { DayChore } from '../../../core/schedule/schedule.models';

/**
 * The day's chores, below the schedule rather than inside it.
 *
 * Two decisions keep this from taking over the screen. Finished chores fold
 * away behind a count, because a list that only grows is what makes a chore
 * list feel like a wall. And nothing here is coloured: the schedule owns the
 * colour, this is a checklist.
 */
@Component({
  selector: 'app-chores-section',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="chores" [class.embedded]="embedded()" aria-label="מטלות">
      @if (!embedded()) {
        <h2>
          מטלות
          @if (open().length) {
            <span class="count">{{ open().length }}</span>
          }
        </h2>
      }

      @for (chore of open(); track chore.id) {
        <div class="row">
          <button
            type="button"
            class="check"
            [attr.aria-label]="'סמן ' + chore.title + ' כבוצע'"
            [attr.aria-pressed]="false"
            (click)="toggle.emit(chore)"
          >
            <span class="box"></span>
          </button>
          <button type="button" class="body" (click)="edit.emit(chore)">
            <span class="title">{{ chore.title }}</span>
            @if (assignee(chore); as name) {
              <span class="who">{{ name }}</span>
            }
          </button>
        </div>
      } @empty {
        @if (!done().length) {
          <p class="empty">אין מטלות היום.</p>
        }
      }

      @if (done().length) {
        <button
          type="button"
          class="toggle-done"
          (click)="showDone.set(!showDone())"
          [attr.aria-expanded]="showDone()"
        >
          <mat-icon aria-hidden="true">{{ showDone() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span>{{ done().length }} בוצעו</span>
        </button>

        @if (showDone()) {
          @for (chore of done(); track chore.id) {
            <div class="row is-done">
              <button
                type="button"
                class="check"
                [attr.aria-label]="'בטל סימון של ' + chore.title"
                [attr.aria-pressed]="true"
                (click)="toggle.emit(chore)"
              >
                <span class="box checked">
                  <mat-icon aria-hidden="true">check</mat-icon>
                </span>
              </button>
              <button type="button" class="body" (click)="edit.emit(chore)">
                <span class="title">{{ chore.title }}</span>
              </button>
            </div>
          }
        }
      }

      <button type="button" class="add" (click)="add.emit()">
        <mat-icon aria-hidden="true">add</mat-icon>
        <span>מטלה</span>
      </button>
    </section>
  `,
  styles: [
    `
      .chores {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
      }

      /* Inside a day card the row above already names and separates it. */
      .chores.embedded {
        margin-top: 0;
        padding-top: 4px;
        border-top: 0;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 4px;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--text);
      }

      .count {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .row {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
      }

      .check {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        flex: 0 0 48px;
        border: 0;
        background: none;
        cursor: pointer;
      }

      .box {
        display: grid;
        place-items: center;
        width: 20px;
        height: 20px;
        border-radius: 6px;
        border: 1.5px solid var(--border-strong);
      }

      .box.checked {
        border-color: var(--text-faint);
        color: var(--text-faint);
      }

      .box mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .body {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        min-height: 48px;
        padding: 0;
        border: 0;
        background: none;
        text-align: start;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      .title {
        flex: 1;
        min-width: 0;
        font-size: 0.9375rem;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .who {
        flex: 0 0 auto;
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .is-done .title {
        text-decoration: line-through;
        color: var(--text-faint);
      }

      .empty {
        margin: 4px 0;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .toggle-done,
      .add {
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 44px;
        padding: 0 4px;
        background: none;
        border: 0;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
      }

      .add {
        color: var(--accent);
      }

      .toggle-done mat-icon,
      .add mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    `,
  ],
})
export class ChoresSectionComponent {
  readonly chores = input.required<DayChore[]>();
  /** Rendered inside a card that already provides the heading. */
  readonly embedded = input(false);
  readonly toggle = output<DayChore>();
  readonly edit = output<DayChore>();
  readonly add = output<void>();

  private family = inject(FamilyService);

  readonly showDone = signal(false);

  readonly open = computed(() => this.chores().filter((c) => !c.done));
  readonly done = computed(() => this.chores().filter((c) => c.done));

  assignee(chore: DayChore): string | null {
    if (!chore.assigneeId) return null;
    return this.family.members().find((m) => m.id === chore.assigneeId)?.displayName ?? null;
  }
}

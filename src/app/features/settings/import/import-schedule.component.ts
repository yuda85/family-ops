import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../../environments/environment';
import { SeedService } from '../../../core/schedule/seed.service';
import { parseSeed, summarise, type Seed } from '../../../core/schedule/seed-schedule';

/**
 * One-time bulk import of the recurring schedule.
 *
 * The file is pasted rather than bundled: it holds the children's names and
 * the hours each of them is somewhere, and this repository is public. Pasting
 * keeps that out of the build entirely.
 */
@Component({
  selector: 'app-import-schedule',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <h1>ייבוא לוז</h1>
    <p class="lead">
      @if (prefilled()) {
        נטען מ-<code>public/seed.local.json</code>. שום דבר לא נכתב עד שתאשר.
      } @else {
        הדבק את התוכן של <code>seed/schedule.json</code>. שום דבר לא נכתב עד שתאשר.
      }
    </p>

    <textarea
      [ngModel]="text()"
      (ngModelChange)="onText($event)"
      name="seed"
      rows="10"
      spellcheck="false"
      dir="ltr"
      placeholder='{ "children": [...], "activities": [...] }'
      aria-label="תוכן קובץ הלוז"
    ></textarea>

    @if (problems().length) {
      <section class="panel danger" role="alert">
        <h2>{{ problems().length }} בעיות. לא ניכתב כלום.</h2>
        <ul>
          @for (problem of problems(); track problem) {
            <li>{{ problem }}</li>
          }
        </ul>
      </section>
    } @else if (preview().length) {
      <section class="panel">
        <h2>מה ייכתב</h2>
        <ul>
          @for (line of preview(); track line) {
            <li>{{ line }}</li>
          }
        </ul>
        <p class="hint">
          ייבוא חוזר של אותו קובץ מעדכן את אותם חוגים במקום להוסיף כפילויות.
        </p>
      </section>
    }

    @if (result(); as outcome) {
      <p class="done" role="status">
        <mat-icon aria-hidden="true">check_circle</mat-icon>
        נכתבו {{ outcome.children }} ילדים ו-{{ outcome.activities }} חוגים.
      </p>
    }

    @if (error(); as message) {
      <p class="failed" role="alert">{{ message }}</p>
    }

    <button type="button" class="primary" [disabled]="!seed() || busy()" (click)="run()">
      {{ busy() ? 'כותב…' : 'ייבא' }}
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 20px;
      }

      h1 {
        margin: 0 0 4px;
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--text);
      }

      .lead {
        margin: 0 0 16px;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      code {
        font-family: var(--font-family-mono);
        font-size: 0.8125rem;
      }

      textarea {
        width: 100%;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--text);
        font-family: var(--font-family-mono);
        font-size: 0.8125rem;
        line-height: 1.5;
        resize: vertical;
        /* JSON reads left to right even on an RTL page. */
        text-align: left;
      }

      textarea:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
      }

      .panel {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--surface);
        border: 1px solid var(--border);
      }

      .panel.danger {
        background: var(--danger-wash);
        border-color: var(--danger);
      }

      .panel h2 {
        margin: 0 0 8px;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--text);
      }

      .panel.danger h2 {
        color: var(--danger);
      }

      .panel ul {
        margin: 0;
        padding-inline-start: 18px;
        font-size: 0.875rem;
        color: var(--text-muted);
      }

      .panel li {
        margin-bottom: 4px;
      }

      .hint {
        margin: 10px 0 0;
        font-size: 0.8125rem;
        color: var(--text-faint);
      }

      .done,
      .failed {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 16px;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .done {
        color: var(--success);
      }

      .failed {
        color: var(--danger);
      }

      .primary {
        width: 100%;
        min-height: 48px;
        margin: 20px 0 40px;
        border: 0;
        border-radius: 12px;
        background: var(--accent);
        color: var(--text-on-accent);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .primary:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ImportScheduleComponent {
  private seeder = inject(SeedService);

  readonly text = signal('');
  readonly prefilled = signal(false);
  readonly seed = signal<Seed | null>(null);
  readonly problems = signal<string[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<{ children: number; activities: number } | null>(null);

  readonly preview = computed(() => {
    const seed = this.seed();
    return seed ? summarise(seed) : [];
  });

  constructor() {
    // In development, prefill from a local file that is deliberately not in
    // the repository - the schedule names children and says where each of
    // them is at a given hour. Fetched at runtime rather than imported, so a
    // clean CI checkout without the file still builds.
    if (!environment.production) void this.loadLocal();
  }

  private async loadLocal(): Promise<void> {
    try {
      const response = await fetch('seed.local.json');
      if (!response.ok) return;
      this.onText(await response.text());
      this.prefilled.set(true);
    } catch {
      // No local file. The textarea stays empty, which is the normal case.
    }
  }

  onText(value: string): void {
    this.text.set(value);
    this.result.set(null);
    this.error.set(null);

    if (!value.trim()) {
      this.seed.set(null);
      this.problems.set([]);
      return;
    }

    const { seed, problems } = parseSeed(value);
    this.seed.set(seed);
    this.problems.set(problems);
  }

  async run(): Promise<void> {
    const seed = this.seed();
    if (!seed) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      this.result.set(await this.seeder.apply(seed));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'הכתיבה נכשלה.');
    } finally {
      this.busy.set(false);
    }
  }
}

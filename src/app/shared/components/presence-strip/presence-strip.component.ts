import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { FamilyService } from '../../../core/family/family.service';
import type { DayShape, MemberPresence } from '../../../core/schedule/schedule.models';

interface Chip {
  memberId: string;
  label: string;
  icon: string;
}

/**
 * Who is around this afternoon, in one line.
 *
 * Every chip carries an icon and words, never colour alone. Only the late
 * case is tinted, because that is the one that needs someone to do something
 * about it - tinting the good days too would make the tint mean nothing.
 */
@Component({
  selector: 'app-presence-strip',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (chips().length) {
      <div class="strip" [class.late]="shape() === 'late'">
        @if (shape() === 'late') {
          <span class="flag">
            <mat-icon aria-hidden="true">bedtime</mat-icon>
            יום מאוחר
          </span>
        }
        @for (chip of chips(); track chip.memberId) {
          <span class="chip">
            <mat-icon aria-hidden="true">{{ chip.icon }}</mat-icon>
            {{ chip.label }}
          </span>
        }
      </div>
    }
  `,
  styles: [
    `
      .strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
        margin-top: 8px;
        padding: 6px 10px;
        border-radius: 10px;
        background: var(--surface-hover);
      }

      .strip.late {
        background: var(--warning-wash);
      }

      .chip,
      .flag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .flag {
        font-weight: 700;
        color: var(--warning);
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class PresenceStripComponent {
  readonly presence = input.required<MemberPresence[]>();
  readonly shape = input.required<DayShape>();

  private family = inject(FamilyService);

  readonly chips = computed<Chip[]>(() =>
    this.presence().map((entry) => {
      const name = this.family.members().find((m) => m.id === entry.memberId)?.displayName ?? '';
      return entry.worksFromHome
        ? { memberId: entry.memberId, icon: 'home', label: `${name} בבית` }
        : {
            memberId: entry.memberId,
            icon: 'schedule',
            label: entry.returnTime ? `${name} חוזר ${entry.returnTime}` : `${name} בחוץ`,
          };
    })
  );
}

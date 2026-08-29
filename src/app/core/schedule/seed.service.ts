import { Injectable, inject } from '@angular/core';

import { FirestoreService } from '../firebase/firestore.service';
import { FamilyService } from '../family/family.service';
import { AuthService } from '../auth/auth.service';
import { activityId, type Seed } from './seed-schedule';

export interface SeedOutcome {
  children: number;
  activities: number;
}

/**
 * Writes a bulk schedule import.
 *
 * Runs in the browser as the signed-in family member, which is exactly the
 * permission the security rules already grant - no service account needed to
 * get the schedule in. Document ids come from the content, so importing a
 * corrected file updates in place rather than duplicating.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private firestore = inject(FirestoreService);
  private family = inject(FamilyService);
  private auth = inject(AuthService);

  async apply(seed: Seed): Promise<SeedOutcome> {
    const familyId = this.family.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    const base = `families/${familyId}`;
    const createdBy = this.auth.user()?.id ?? null;

    for (const child of seed.children) {
      await this.firestore.setDocument(
        `${base}/children/${child.id}`,
        { name: child.name, color: child.color, order: child.order, createdBy },
        true
      );
    }

    for (const activity of seed.activities) {
      await this.firestore.setDocument(
        `${base}/activities/${activityId(activity)}`,
        {
          childId: activity.childId,
          title: activity.title.trim(),
          ...(activity.location ? { location: activity.location.trim() } : {}),
          daysOfWeek: [...activity.daysOfWeek].sort((a, b) => a - b),
          startTime: activity.startTime,
          ...(activity.endTime ? { endTime: activity.endTime } : {}),
          ...(activity.departureTime ? { departureTime: activity.departureTime } : {}),
          drivers: Object.fromEntries(
            Object.entries(activity.drivers ?? {}).map(([day, id]) => [Number(day), id])
          ),
          prepItems: activity.prepItems ?? [],
          createdBy,
        },
        true
      );
    }

    return { children: seed.children.length, activities: seed.activities.length };
  }
}

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { FirestoreService, where } from '../firebase/firestore.service';
import { FamilyService } from '../family/family.service';
import { AuthService } from '../auth/auth.service';
import { buildDayView, type DayInput } from './day-builder';
import { addDays, toDateStr } from './date-utils';
import type {
  Activity,
  DateStr,
  DayEntry,
  DayView,
  Meal,
  Override,
} from './schedule.models';

/**
 * How far back dated documents stay subscribed. Enough history to look at last
 * week, small enough that the live payload stays tiny.
 */
const HISTORY_DAYS = 14;

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private firestore = inject(FirestoreService);
  private family = inject(FamilyService);
  private auth = inject(AuthService);

  private _activities = signal<Activity[]>([]);
  private _overrides = signal<Override[]>([]);
  private _meals = signal<Meal[]>([]);
  private _isLoading = signal(false);

  readonly activities = this._activities.asReadonly();
  readonly overrides = this._overrides.asReadonly();
  readonly meals = this._meals.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  private subscriptions: Subscription[] = [];

  constructor() {
    // Re-subscribe whenever the active family changes.
    effect(() => {
      const familyId = this.family.familyId();
      this.unsubscribe();
      if (familyId) this.subscribe(familyId);
    });
  }

  // ============================================
  // Reads
  // ============================================

  /** Everything happening on a date, derived fresh. */
  dayView(date: DateStr): DayView {
    return buildDayView(date, this.snapshot());
  }

  /** Seven consecutive days starting at `from`. */
  weekView(from: DateStr): DayView[] {
    const data = this.snapshot();
    return Array.from({ length: 7 }, (_, i) => buildDayView(addDays(from, i), data));
  }

  private snapshot(): DayInput {
    return {
      activities: this._activities(),
      overrides: this._overrides(),
      meals: this._meals(),
    };
  }

  // ============================================
  // Writes
  // ============================================

  async createActivity(data: Omit<Activity, 'id'>): Promise<string> {
    return this.firestore.createDocument(this.path('activities'), {
      ...data,
      createdBy: this.auth.user()?.id ?? null,
    });
  }

  async updateActivity(id: string, data: Partial<Activity>): Promise<void> {
    return this.firestore.updateDocument(`${this.path('activities')}/${id}`, data);
  }

  async deleteActivity(id: string): Promise<void> {
    return this.firestore.deleteDocument(`${this.path('activities')}/${id}`);
  }

  async createOverride(data: Omit<Override, 'id'>): Promise<string> {
    return this.firestore.createDocument(this.path('overrides'), {
      ...data,
      createdBy: this.auth.user()?.id ?? null,
    });
  }

  async updateOverride(id: string, data: Partial<Override>): Promise<void> {
    return this.firestore.updateDocument(`${this.path('overrides')}/${id}`, data);
  }

  async deleteOverride(id: string): Promise<void> {
    return this.firestore.deleteDocument(`${this.path('overrides')}/${id}`);
  }

  /** One dinner per date: the date is the document id, so it cannot duplicate. */
  async setMeal(meal: Omit<Meal, 'id'>): Promise<void> {
    return this.firestore.setDocument(`${this.path('meals')}/${meal.date}`, meal, true);
  }

  async deleteMeal(date: DateStr): Promise<void> {
    return this.firestore.deleteDocument(`${this.path('meals')}/${date}`);
  }

  // ============================================
  // Day edits
  //
  // Editing a specific day never touches the Activity template - it writes an
  // Override. One reusable override per (date, activity) so repeated edits do
  // not pile up documents.
  // ============================================

  /** Assign or clear the driver for one entry on one date. */
  async setDriver(date: DateStr, entry: DayEntry, driverId: string | null): Promise<void> {
    if (entry.overrideId && !entry.activityId) {
      return this.updateOverride(entry.overrideId, { driverId });
    }

    const existing = this.findOverride(date, entry.activityId, 'driverChanged');
    if (existing) return this.updateOverride(existing.id, { driverId });

    await this.createOverride({
      date,
      type: 'driverChanged',
      activityId: entry.activityId,
      driverId,
    });
  }

  /** Cancel an entry for one date, or undo a cancellation. */
  async setCancelled(
    date: DateStr,
    entry: DayEntry,
    cancelled: boolean,
    reason?: string
  ): Promise<void> {
    const existing = this.findOverride(date, entry.activityId, 'cancelled');

    if (!cancelled) {
      // Only a stored cancellation can be undone here; a holiday cancellation
      // is undone by explicitly rescheduling the entry instead.
      if (existing) await this.deleteOverride(existing.id);
      return;
    }

    if (existing) return this.updateOverride(existing.id, { reason });
    await this.createOverride({ date, type: 'cancelled', activityId: entry.activityId, reason });
  }

  private findOverride(
    date: DateStr,
    activityId: string | undefined,
    type: Override['type']
  ): Override | undefined {
    return this._overrides().find(
      (o) => o.date === date && o.activityId === activityId && o.type === type
    );
  }

  // ============================================
  // Plumbing
  // ============================================

  private path(collection: string): string {
    const familyId = this.family.familyId();
    if (!familyId) throw new Error('No active family');
    return `families/${familyId}/${collection}`;
  }

  private subscribe(familyId: string): void {
    this._isLoading.set(true);
    const since = addDays(toDateStr(new Date()), -HISTORY_DAYS);
    const base = `families/${familyId}`;

    this.subscriptions = [
      this.firestore
        .getCollection$<Activity>(`${base}/activities`)
        .subscribe((rows) => {
          this._activities.set(rows);
          this._isLoading.set(false);
        }),
      this.firestore
        .getCollection$<Override>(`${base}/overrides`, where('date', '>=', since))
        .subscribe((rows) => this._overrides.set(rows)),
      this.firestore
        .getCollection$<Meal>(`${base}/meals`, where('date', '>=', since))
        .subscribe((rows) => this._meals.set(rows)),
    ];
  }

  private unsubscribe(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this._activities.set([]);
    this._overrides.set([]);
    this._meals.set([]);
  }
}

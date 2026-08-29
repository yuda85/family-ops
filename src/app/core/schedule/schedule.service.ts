import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { FirestoreService, where } from '../firebase/firestore.service';
import { FamilyService } from '../family/family.service';
import { AuthService } from '../auth/auth.service';
import { buildDayView, type DayInput } from './day-builder';
import { addDays, dayOfWeekOf, toDateStr } from './date-utils';
import type {
  Activity,
  Availability,
  DateStr,
  DayEntry,
  DayView,
  DayWork,
  Meal,
  MealPlan,
  Override,
  TimeStr,
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
  private _mealPlans = signal<MealPlan[]>([]);
  private _availability = signal<Availability[]>([]);
  private _isLoading = signal(false);

  readonly activities = this._activities.asReadonly();
  readonly overrides = this._overrides.asReadonly();
  readonly meals = this._meals.asReadonly();
  readonly mealPlans = this._mealPlans.asReadonly();
  readonly availability = this._availability.asReadonly();
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
      mealPlans: this._mealPlans(),
      availability: this._availability(),
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

  /** A member's whole week, replacing whatever was there. */
  async setAvailability(memberId: string, days: Record<number, DayWork>): Promise<void> {
    return this.firestore.setDocument(`${this.path('availability')}/${memberId}`, { days }, false);
  }

  /**
   * One dinner per date: the date is the document id, so it cannot duplicate.
   * Doubles as the override for a repeating plan.
   */
  async setMeal(meal: Omit<Meal, 'id'>): Promise<void> {
    return this.firestore.setDocument(`${this.path('meals')}/${meal.date}`, meal, true);
  }

  async deleteMeal(date: DateStr): Promise<void> {
    return this.firestore.deleteDocument(`${this.path('meals')}/${date}`);
  }

  /** Skip a repeating dinner for one date without touching the plan. */
  async skipMeal(date: DateStr): Promise<void> {
    return this.firestore.setDocument(`${this.path('meals')}/${date}`, { date, cancelled: true }, false);
  }

  async createMealPlan(data: Omit<MealPlan, 'id'>): Promise<string> {
    return this.firestore.createDocument(this.path('mealPlans'), {
      ...data,
      createdBy: this.auth.user()?.id ?? null,
    });
  }

  async updateMealPlan(id: string, data: Partial<MealPlan>): Promise<void> {
    return this.firestore.updateDocument(`${this.path('mealPlans')}/${id}`, data);
  }

  async deleteMealPlan(id: string): Promise<void> {
    return this.firestore.deleteDocument(`${this.path('mealPlans')}/${id}`);
  }

  // ============================================
  // Day edits
  //
  // Editing a specific day never touches the Activity template - it writes an
  // Override. One reusable override per (date, activity) so repeated edits do
  // not pile up documents.
  // ============================================

  /**
   * Assign or clear the driver.
   *
   * 'series' writes the weekday's driver on the template, which is where a
   * standing arrangement belongs - a lift rota changes often, and splitting
   * the template on every swap would leave a pile of fragments within weeks.
   * The cost is that looking back shows the current driver rather than
   * whoever actually drove, which is a fact nobody needs.
   *
   * 'once' writes an override for that date and leaves the arrangement alone.
   */
  async setDriver(
    date: DateStr,
    entry: DayEntry,
    driverId: string | null,
    scope: 'series' | 'once' = 'series'
  ): Promise<void> {
    // A one-off event has no template behind it; only the override exists.
    if (entry.overrideId && !entry.activityId) {
      return this.updateOverride(entry.overrideId, { driverId });
    }

    if (scope === 'series' && entry.activityId) {
      const activity = this._activities().find((a) => a.id === entry.activityId);
      if (!activity) throw new Error('missing activity');

      const drivers: Record<number, string> = { ...activity.drivers };
      const day = dayOfWeekOf(date);
      if (driverId) drivers[day] = driverId;
      else delete drivers[day];

      await this.updateActivity(activity.id, { drivers });

      // A per-date override would keep shadowing the arrangement we just set.
      const shadowing = this.findOverride(date, entry.activityId, 'driverChanged');
      if (shadowing) await this.deleteOverride(shadowing.id);
      return;
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

  /**
   * Move one occurrence to another date and time. The original date keeps a
   * struck-through entry pointing at the new one.
   */
  async moveOccurrence(
    date: DateStr,
    entry: DayEntry,
    to: { date: DateStr; startTime: TimeStr; endTime?: TimeStr; departureTime?: TimeStr }
  ): Promise<void> {
    const patch = {
      movedToDate: to.date,
      startTime: to.startTime,
      ...(to.endTime ? { endTime: to.endTime } : {}),
      ...(to.departureTime ? { departureTime: to.departureTime } : {}),
    };

    const existing = this.findOverride(date, entry.activityId, 'moved');
    if (existing) return this.updateOverride(existing.id, patch);

    await this.createOverride({ date, type: 'moved', activityId: entry.activityId, ...patch });
  }

  /**
   * Change a template from a date onwards: the old one is closed the day
   * before and a new one opens. Editing the template in place would rewrite
   * weeks that already happened, so looking back would show a week that never
   * took place.
   */
  async moveSeriesFrom(
    fromDate: DateStr,
    activity: Activity,
    patch: Pick<Activity, 'daysOfWeek' | 'startTime'> &
      Partial<Pick<Activity, 'endTime' | 'departureTime'>>
  ): Promise<void> {
    await this.updateActivity(activity.id, { activeUntil: addDays(fromDate, -1) });

    await this.createActivity({
      childId: activity.childId,
      title: activity.title,
      ...(activity.location ? { location: activity.location } : {}),
      daysOfWeek: [...patch.daysOfWeek].sort((a, b) => a - b),
      startTime: patch.startTime,
      ...(patch.endTime ? { endTime: patch.endTime } : {}),
      ...(patch.departureTime ? { departureTime: patch.departureTime } : {}),
      drivers: activity.drivers ?? {},
      prepItems: activity.prepItems ?? [],
      activeFrom: fromDate,
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
      this.firestore
        .getCollection$<MealPlan>(`${base}/mealPlans`)
        .subscribe((rows) => this._mealPlans.set(rows)),
      this.firestore
        .getCollection$<Availability>(`${base}/availability`)
        .subscribe((rows) => this._availability.set(rows)),
    ];
  }

  private unsubscribe(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this._activities.set([]);
    this._overrides.set([]);
    this._meals.set([]);
    this._mealPlans.set([]);
    this._availability.set([]);
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService, orderBy, where } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { ShoppingTrip, PurchasePattern } from './shopping.models';

export interface MonthlySpending {
  month: string; // YYYY-MM
  monthLabel: string; // e.g., "ינואר 2024"
  totalEstimated: number;
  totalActual: number;
  tripCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShoppingHistoryService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Private signals
  private _history = signal<ShoppingTrip[]>([]);
  private _patterns = signal<PurchasePattern[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly history = this._history.asReadonly();
  readonly patterns = this._patterns.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Monthly spending aggregation
   */
  readonly monthlySpending = computed<MonthlySpending[]>(() => {
    const trips = this._history();
    const monthMap = new Map<string, MonthlySpending>();

    const hebrewMonths = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    for (const trip of trips) {
      // Prefer completedAt, fall back to createdAt
      const timestamp = trip.completedAt ?? trip.createdAt;
      const date = timestamp ? timestamp.toDate() : new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${hebrewMonths[date.getMonth()]} ${date.getFullYear()}`;

      const existing = monthMap.get(monthKey) || {
        month: monthKey,
        monthLabel,
        totalEstimated: 0,
        totalActual: 0,
        tripCount: 0,
      };

      existing.totalEstimated += trip.estimatedTotal;
      existing.totalActual += trip.actualTotal;
      existing.tripCount += 1;

      monthMap.set(monthKey, existing);
    }

    // Sort by month descending
    return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
  });

  /**
   * Total spending statistics
   */
  readonly totalStats = computed(() => {
    const trips = this._history();
    return {
      totalTrips: trips.length,
      totalEstimated: trips.reduce((sum, t) => sum + t.estimatedTotal, 0),
      totalActual: trips.reduce((sum, t) => sum + t.actualTotal, 0),
      averageTrip: trips.length > 0
        ? trips.reduce((sum, t) => sum + t.actualTotal, 0) / trips.length
        : 0,
    };
  });

  /**
   * Estimate vs actual comparison
   */
  readonly estimateAccuracy = computed(() => {
    const stats = this.totalStats();
    if (stats.totalEstimated === 0) return 100;
    return Math.round((stats.totalActual / stats.totalEstimated) * 100);
  });

  /**
   * Load shopping history
   */
  async loadHistory(limit: number = 50): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._history.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Fetch all documents without ordering (some may not have completedAt)
      let trips = await this.firestoreService.getCollection<ShoppingTrip>(
        `families/${familyId}/shoppingHistory`
      );

      // Sort client-side - prefer completedAt, fall back to createdAt
      trips = trips.sort((a, b) => {
        const dateA = a.completedAt?.toMillis() ?? a.createdAt?.toMillis() ?? 0;
        const dateB = b.completedAt?.toMillis() ?? b.createdAt?.toMillis() ?? 0;
        return dateB - dateA; // Descending
      });

      this._history.set(trips.slice(0, limit));
    } catch (error: any) {
      console.error('Error loading history:', error);
      this._error.set('שגיאה בטעינת היסטוריית הקניות');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load purchase patterns for smart suggestions
   */
  async loadPatterns(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._patterns.set([]);
      return;
    }

    try {
      const patterns = await this.firestoreService.getCollection<PurchasePattern>(
        `families/${familyId}/purchasePatterns`,
        orderBy('purchaseCount', 'desc')
      );

      this._patterns.set(patterns);
    } catch (error: any) {
      console.error('Error loading patterns:', error);
    }
  }

  /**
   * Get a single trip by ID
   */
  async getTrip(tripId: string): Promise<ShoppingTrip | null> {
    const familyId = this.familyService.familyId();
    if (!familyId) return null;

    try {
      return await this.firestoreService.getDocument<ShoppingTrip>(
        `families/${familyId}/shoppingHistory/${tripId}`
      );
    } catch (error: any) {
      console.error('Error getting trip:', error);
      return null;
    }
  }

  /**
   * Update purchase patterns after completing a trip
   */
  async updatePatterns(trip: ShoppingTrip): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const now = Timestamp.now();

    for (const item of trip.items) {
      if (!item.wasChecked) continue;

      // Find or create pattern
      const existingPattern = this._patterns().find(
        (p) => p.itemName === item.name && p.category === item.category
      );

      if (existingPattern) {
        // Update existing pattern
        const daysSinceLastPurchase = Math.floor(
          (now.toMillis() - existingPattern.lastPurchased.toMillis()) / (1000 * 60 * 60 * 24)
        );

        const newCount = existingPattern.purchaseCount + 1;
        const newAvgQuantity =
          (existingPattern.averageQuantity * existingPattern.purchaseCount + item.quantity) / newCount;
        const newAvgInterval =
          (existingPattern.averageIntervalDays * (existingPattern.purchaseCount - 1) + daysSinceLastPurchase) /
          existingPattern.purchaseCount;

        await this.firestoreService.updateDocument(
          `families/${familyId}/purchasePatterns/${existingPattern.id}`,
          {
            purchaseCount: newCount,
            lastPurchased: now,
            averageQuantity: newAvgQuantity,
            averageIntervalDays: newAvgInterval,
          }
        );
      } else {
        // Create new pattern
        await this.firestoreService.createDocument(
          `families/${familyId}/purchasePatterns`,
          {
            familyId,
            catalogItemId: null, // Could be linked if from catalog
            itemName: item.name,
            category: item.category,
            purchaseCount: 1,
            lastPurchased: now,
            averageQuantity: item.quantity,
            averageIntervalDays: 7, // Default to weekly
          }
        );
      }
    }

    // Reload patterns
    await this.loadPatterns();
  }

  /**
   * Get items that are due for purchase based on patterns
   */
  getSuggestedItems(): PurchasePattern[] {
    const patterns = this._patterns();
    const now = Date.now();

    return patterns.filter((pattern) => {
      const lastPurchased = pattern.lastPurchased.toMillis();
      const daysSincePurchase = Math.floor((now - lastPurchased) / (1000 * 60 * 60 * 24));
      return daysSincePurchase >= pattern.averageIntervalDays * 0.8; // 80% of average interval
    });
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}

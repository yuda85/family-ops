import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Subscription, Subject } from 'rxjs';
import { FirestoreService, where, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import {
  BudgetSettings,
  BudgetCategoryConfig,
  MonthlyBudget,
  BudgetEntry,
  OccasionalExpense,
  BudgetCategory,
  ExpenseType,
  MonthlyBudgetSummary,
  BudgetCategorySummary,
  BudgetGroupedByType,
  CloseMonthEntry,
  BudgetStatus,
  CategoryConfigData,
  AddOccasionalExpenseData,
  UpdateEntryData,
  getBudgetStatus,
  getBudgetCategoryMeta,
  getExpenseTypeMeta,
  formatMonthLabel,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
  EXPENSE_TYPES,
  BUDGET_CATEGORIES,
} from './budget.models';

@Injectable({
  providedIn: 'root',
})
export class BudgetService implements OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Subscriptions for real-time updates
  private settingsSubscription?: Subscription;
  private configsSubscription?: Subscription;
  private currentMonthSubscription?: Subscription;
  private entriesSubscription?: Subscription;
  private occasionalSubscription?: Subscription;

  // Event emitter for shopping integration
  private _shoppingTripCompleted = new Subject<{ tripId: string; actualTotal: number }>();
  readonly shoppingTripCompleted$ = this._shoppingTripCompleted.asObservable();

  // Private signals
  private _settings = signal<BudgetSettings | null>(null);
  private _categoryConfigs = signal<BudgetCategoryConfig[]>([]);
  private _currentMonth = signal<MonthlyBudget | null>(null);
  private _entries = signal<BudgetEntry[]>([]);
  private _occasionalExpenses = signal<OccasionalExpense[]>([]);
  private _historicalMonths = signal<MonthlyBudget[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _collapsedTypes = signal<Set<ExpenseType>>(new Set());
  private _selectedYearMonth = signal<string>(getCurrentYearMonth());

  // Public readonly signals
  readonly settings = this._settings.asReadonly();
  readonly categoryConfigs = this._categoryConfigs.asReadonly();
  readonly currentMonth = this._currentMonth.asReadonly();
  readonly entries = this._entries.asReadonly();
  readonly occasionalExpenses = this._occasionalExpenses.asReadonly();
  readonly historicalMonths = this._historicalMonths.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedYearMonth = this._selectedYearMonth.asReadonly();

  // ============================================
  // COMPUTED: Setup State
  // ============================================

  readonly isSetupComplete = computed(() => {
    const settings = this._settings();
    return settings?.isSetupComplete ?? false;
  });

  readonly hasConfigs = computed(() => {
    return this._categoryConfigs().length > 0;
  });

  // ============================================
  // COMPUTED: Current Year-Month
  // ============================================

  readonly currentYearMonth = computed(() => getCurrentYearMonth());

  readonly currentMonthLabel = computed(() => {
    return formatMonthLabel(this._selectedYearMonth());
  });

  readonly isViewingCurrentMonth = computed(() => {
    return this._selectedYearMonth() === getCurrentYearMonth();
  });

  // ============================================
  // COMPUTED: Budget Summary
  // ============================================

  readonly monthSummary = computed<MonthlyBudgetSummary | null>(() => {
    const month = this._currentMonth();
    const entries = this._entries();
    const occasional = this._occasionalExpenses();

    if (!month) return null;

    const categorySummaries = this.buildCategorySummaries(entries);
    const occasionalTotal = occasional.reduce((sum, e) => sum + e.amount, 0);

    const totalPlanned = entries.reduce((sum, e) => sum + e.plannedAmount, 0);
    const totalActual = entries.reduce((sum, e) => sum + e.actualAmount, 0);
    const grandTotal = totalActual + occasionalTotal;

    // Calculate comparison to last month
    const lastMonth = this._historicalMonths().find(
      (m) => m.yearMonth === getPreviousYearMonth(month.yearMonth)
    );
    const comparisonToLastMonth = lastMonth
      ? ((grandTotal - lastMonth.totalActual) / lastMonth.totalActual) * 100
      : 0;

    // Calculate comparison to 3-month average
    const avgActual = this.getThreeMonthAverage();
    const comparisonToAverage = avgActual > 0
      ? ((grandTotal - avgActual) / avgActual) * 100
      : 0;

    // Check if month needs closing
    const needsClosing = this.checkNeedsClosing();

    return {
      yearMonth: month.yearMonth,
      monthLabel: formatMonthLabel(month.yearMonth),
      totalPlanned,
      totalActual,
      totalOccasional: occasionalTotal,
      grandTotal,
      status: getBudgetStatus(grandTotal, totalPlanned),
      percentUsed: totalPlanned > 0 ? (grandTotal / totalPlanned) * 100 : 0,
      byCategory: categorySummaries,
      comparisonToLastMonth,
      comparisonToAverage,
      isClosed: month.status === 'closed',
      needsClosing,
    };
  });

  // ============================================
  // COMPUTED: Grouped by Type
  // ============================================

  readonly groupedByType = computed<BudgetGroupedByType[]>(() => {
    const summaries = this.monthSummary()?.byCategory || [];
    const collapsed = this._collapsedTypes();

    return EXPENSE_TYPES
      .filter((typeMeta) => typeMeta.id !== 'occasional') // Occasional shown separately
      .map((typeMeta) => {
        const categories = summaries.filter((s) => s.expenseType === typeMeta.id);
        const totalPlanned = categories.reduce((sum, c) => sum + c.planned, 0);
        const totalActual = categories.reduce((sum, c) => sum + c.actual, 0);

        return {
          expenseType: typeMeta.id,
          meta: typeMeta,
          categories,
          totalPlanned,
          totalActual,
          isCollapsed: collapsed.has(typeMeta.id),
        };
      });
  });

  // ============================================
  // COMPUTED: Needs Closing Badge
  // ============================================

  readonly needsClosingBadge = computed(() => {
    return this.checkNeedsClosing();
  });

  // ============================================
  // COMPUTED: Close Month Suggestions
  // ============================================

  readonly closeMonthSuggestions = computed<CloseMonthEntry[]>(() => {
    const configs = this._categoryConfigs();
    const entries = this._entries();

    return configs
      .filter((c) => c.isActive && c.expenseType === 'variable')
      .sort((a, b) => a.order - b.order)
      .map((config) => {
        const entry = entries.find((e) => e.category === config.category);
        const meta = getBudgetCategoryMeta(config.category);

        // Determine best suggestion
        let suggestedAmount = entry?.lastMonthActual || config.targetAmount;
        let suggestionSource: 'last_month' | 'three_month_avg' | 'shopping' | 'manual' = 'last_month';

        // If shopping integration available (for groceries), prefer that
        if (entry?.shoppingTotal && entry.shoppingTotal > 0 && config.category === 'groceries') {
          suggestedAmount = entry.shoppingTotal + (entry.manualAdjustment || 0);
          suggestionSource = 'shopping';
        } else if (entry?.threeMonthAverage && entry.threeMonthAverage > 0) {
          // Use 3-month average if significantly different from last month
          const lastMonth = entry.lastMonthActual || 0;
          const diff = Math.abs(lastMonth - entry.threeMonthAverage);
          if (diff > entry.threeMonthAverage * 0.15) {
            suggestedAmount = entry.threeMonthAverage;
            suggestionSource = 'three_month_avg';
          }
        }

        return {
          category: config.category,
          categoryLabel: meta?.labelHe || config.category,
          categoryIcon: meta?.icon || 'category',
          categoryColor: meta?.color || '#868e96',
          expenseType: config.expenseType,
          plannedAmount: config.targetAmount,
          suggestedAmount: Math.round(suggestedAmount),
          actualAmount: Math.round(suggestedAmount),
          suggestionSource,
          lastMonthActual: entry?.lastMonthActual,
          threeMonthAverage: entry?.threeMonthAverage,
          shoppingTotal: entry?.shoppingTotal,
        };
      });
  });

  // ============================================
  // COMPUTED: Fixed Expenses Total
  // ============================================

  readonly fixedExpensesTotal = computed(() => {
    return this._entries()
      .filter((e) => e.expenseType === 'fixed')
      .reduce((sum, e) => sum + e.actualAmount, 0);
  });

  readonly variableExpensesTotal = computed(() => {
    return this._entries()
      .filter((e) => e.expenseType === 'variable')
      .reduce((sum, e) => sum + e.actualAmount, 0);
  });

  readonly occasionalExpensesTotal = computed(() => {
    return this._occasionalExpenses().reduce((sum, e) => sum + e.amount, 0);
  });

  // ============================================
  // LIFECYCLE
  // ============================================

  ngOnDestroy(): void {
    this.unsubscribe();
    this._shoppingTripCompleted.complete();
  }

  private unsubscribe(): void {
    this.settingsSubscription?.unsubscribe();
    this.configsSubscription?.unsubscribe();
    this.currentMonthSubscription?.unsubscribe();
    this.entriesSubscription?.unsubscribe();
    this.occasionalSubscription?.unsubscribe();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async initializeBudget(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._settings.set(null);
      this._categoryConfigs.set([]);
      this._currentMonth.set(null);
      this._entries.set([]);
      this._occasionalExpenses.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Load settings or create defaults
      await this.loadOrCreateSettings();

      // Subscribe to configs
      this.subscribeToConfigs();

      // Load historical months for comparison
      await this.loadHistoricalMonths();

      // If setup is complete, load current month
      if (this._settings()?.isSetupComplete) {
        await this.loadOrCreateMonth(this._selectedYearMonth());
      }
    } catch (error: any) {
      console.error('Error initializing budget:', error);
      this._error.set('שגיאה בטעינת התקציב');
    } finally {
      this._isLoading.set(false);
    }
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  private async loadOrCreateSettings(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const path = `families/${familyId}/budgetSettings/settings`;
    let settings = await this.firestoreService.getDocument<BudgetSettings>(path);

    if (!settings) {
      // Create default settings
      const defaultSettings = {
        familyId,
        currency: 'ILS',
        monthClosingDay: 1,
        isSetupComplete: false,
      };

      await this.firestoreService.setDocument(path, defaultSettings);
      settings = await this.firestoreService.getDocument<BudgetSettings>(path);
    }

    this._settings.set(settings);

    // Subscribe to real-time updates
    this.settingsSubscription?.unsubscribe();
    this.settingsSubscription = this.firestoreService
      .getDocument$<BudgetSettings>(path)
      .subscribe((s) => this._settings.set(s));
  }

  async updateSettings(data: Partial<BudgetSettings>): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן הגדרות');
    }

    const path = `families/${familyId}/budgetSettings/settings`;
    await this.firestoreService.updateDocument(path, data);
  }

  async completeSetup(): Promise<void> {
    await this.updateSettings({ isSetupComplete: true });
    // Create first month after setup
    await this.loadOrCreateMonth(getCurrentYearMonth());
  }

  // ============================================
  // CATEGORY CONFIG MANAGEMENT
  // ============================================

  private subscribeToConfigs(): void {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.configsSubscription?.unsubscribe();
    this.configsSubscription = this.firestoreService
      .getCollection$<BudgetCategoryConfig>(
        `families/${familyId}/budgetConfigs`,
        orderBy('order', 'asc')
      )
      .subscribe({
        next: (configs) => this._categoryConfigs.set(configs),
        error: (err) => console.error('Error loading configs:', err),
      });
  }

  async createCategoryConfig(data: CategoryConfigData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    if (!familyId || !userId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה להוסיף קטגוריות');
    }

    const meta = getBudgetCategoryMeta(data.category);
    const existingConfigs = this._categoryConfigs();
    const maxOrder = existingConfigs.reduce((max, c) => Math.max(max, c.order), -1);

    const configData = {
      familyId,
      category: data.category,
      expenseType: data.expenseType,
      targetAmount: data.targetAmount,
      isActive: true,
      order: meta?.order ?? maxOrder + 1,
      notes: data.notes || null,
      createdBy: userId,
    };

    return await this.firestoreService.createDocument(
      `families/${familyId}/budgetConfigs`,
      configData
    );
  }

  async updateCategoryConfig(configId: string, data: Partial<CategoryConfigData>): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן קטגוריות');
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/budgetConfigs/${configId}`,
      data
    );
  }

  async toggleCategoryConfig(configId: string, isActive: boolean): Promise<void> {
    await this.updateCategoryConfig(configId, { isActive } as any);
  }

  async deleteCategoryConfig(configId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק קטגוריות');
    }

    await this.firestoreService.deleteDocument(
      `families/${familyId}/budgetConfigs/${configId}`
    );
  }

  // ============================================
  // MONTHLY BUDGET MANAGEMENT
  // ============================================

  async loadOrCreateMonth(yearMonth: string): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this._selectedYearMonth.set(yearMonth);

    const path = `families/${familyId}/monthlyBudgets/${yearMonth}`;
    let month = await this.firestoreService.getDocument<MonthlyBudget>(path);

    if (!month) {
      // Create new month based on configs
      await this.createMonthFromConfigs(yearMonth);
      month = await this.firestoreService.getDocument<MonthlyBudget>(path);
    }

    this._currentMonth.set(month);

    // Subscribe to real-time updates
    this.currentMonthSubscription?.unsubscribe();
    this.currentMonthSubscription = this.firestoreService
      .getDocument$<MonthlyBudget>(path)
      .subscribe((m) => this._currentMonth.set(m));

    // Load entries for this month
    this.subscribeToEntries(yearMonth);

    // Load occasional expenses for this month
    this.subscribeToOccasional(yearMonth);
  }

  private async createMonthFromConfigs(yearMonth: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    if (!familyId || !userId) return;

    const configs = this._categoryConfigs();
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Calculate totals from configs
    const totalPlanned = configs
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + c.targetAmount, 0);

    // Create monthly budget document
    await this.firestoreService.setDocument(
      `families/${familyId}/monthlyBudgets/${yearMonth}`,
      {
        familyId,
        yearMonth,
        year,
        month,
        status: 'active',
        totalPlanned,
        totalActual: 0,
        totalOccasional: 0,
      }
    );

    // Get previous month data for suggestions
    const prevYearMonth = getPreviousYearMonth(yearMonth);
    const lastMonthEntries = await this.fetchEntriesForMonth(prevYearMonth);

    // Create entries for each active config
    for (const config of configs.filter((c) => c.isActive)) {
      const meta = getBudgetCategoryMeta(config.category);
      const lastEntry = lastMonthEntries.find((e) => e.category === config.category);
      const threeMonthAvg = await this.calculateThreeMonthAverage(config.category, yearMonth);

      // For fixed expenses, actual = planned
      const actualAmount = config.expenseType === 'fixed' ? config.targetAmount : 0;

      await this.firestoreService.createDocument(
        `families/${familyId}/budgetEntries`,
        {
          familyId,
          monthlyBudgetId: yearMonth,
          yearMonth,
          category: config.category,
          categoryLabel: meta?.labelHe || config.category,
          expenseType: config.expenseType,
          plannedAmount: config.targetAmount,
          actualAmount,
          lastMonthActual: lastEntry?.actualAmount || 0,
          threeMonthAverage: threeMonthAvg,
          linkedShoppingTripIds: [],
          shoppingTotal: 0,
          manualAdjustment: 0,
        }
      );
    }
  }

  async navigateToMonth(yearMonth: string): Promise<void> {
    await this.loadOrCreateMonth(yearMonth);
  }

  async goToPreviousMonth(): Promise<void> {
    const prev = getPreviousYearMonth(this._selectedYearMonth());
    await this.navigateToMonth(prev);
  }

  async goToNextMonth(): Promise<void> {
    const next = getNextYearMonth(this._selectedYearMonth());
    await this.navigateToMonth(next);
  }

  // ============================================
  // ENTRIES MANAGEMENT
  // ============================================

  private subscribeToEntries(yearMonth: string): void {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.entriesSubscription?.unsubscribe();
    this.entriesSubscription = this.firestoreService
      .getCollection$<BudgetEntry>(
        `families/${familyId}/budgetEntries`,
        where('yearMonth', '==', yearMonth),
        orderBy('createdAt', 'asc')
      )
      .subscribe({
        next: (entries) => this._entries.set(entries),
        error: (err) => console.error('Error loading entries:', err),
      });
  }

  private async fetchEntriesForMonth(yearMonth: string): Promise<BudgetEntry[]> {
    const familyId = this.familyService.familyId();
    if (!familyId) return [];

    return await this.firestoreService.getCollection<BudgetEntry>(
      `families/${familyId}/budgetEntries`,
      where('yearMonth', '==', yearMonth)
    );
  }

  async updateEntry(entryId: string, data: UpdateEntryData): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן');
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/budgetEntries/${entryId}`,
      data
    );

    // Recalculate monthly totals
    await this.recalculateMonthlyTotals();
  }

  // ============================================
  // OCCASIONAL EXPENSES
  // ============================================

  private subscribeToOccasional(yearMonth: string): void {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    this.occasionalSubscription?.unsubscribe();
    this.occasionalSubscription = this.firestoreService
      .getCollection$<OccasionalExpense>(
        `families/${familyId}/occasionalExpenses`,
        where('yearMonth', '==', yearMonth),
        orderBy('date', 'desc')
      )
      .subscribe({
        next: (expenses) => this._occasionalExpenses.set(expenses),
        error: (err) => console.error('Error loading occasional:', err),
      });
  }

  async addOccasionalExpense(data: AddOccasionalExpenseData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    const yearMonth = this._selectedYearMonth();

    if (!familyId || !userId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה להוסיף הוצאות');
    }

    const expenseId = await this.firestoreService.createDocument(
      `families/${familyId}/occasionalExpenses`,
      {
        familyId,
        yearMonth,
        description: data.description,
        category: data.category,
        amount: data.amount,
        date: Timestamp.fromDate(data.date),
        createdBy: userId,
      }
    );

    await this.recalculateMonthlyTotals();
    return expenseId;
  }

  async updateOccasionalExpense(
    expenseId: string,
    data: Partial<AddOccasionalExpenseData>
  ): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן הוצאות');
    }

    const updateData: Record<string, any> = {};
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.category !== undefined) updateData['category'] = data.category;
    if (data.amount !== undefined) updateData['amount'] = data.amount;
    if (data.date !== undefined) updateData['date'] = Timestamp.fromDate(data.date);

    await this.firestoreService.updateDocument(
      `families/${familyId}/occasionalExpenses/${expenseId}`,
      updateData
    );

    await this.recalculateMonthlyTotals();
  }

  async deleteOccasionalExpense(expenseId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק הוצאות');
    }

    await this.firestoreService.deleteDocument(
      `families/${familyId}/occasionalExpenses/${expenseId}`
    );

    await this.recalculateMonthlyTotals();
  }

  // ============================================
  // CLOSE MONTH FLOW
  // ============================================

  async closeMonth(entries: CloseMonthEntry[]): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    const yearMonth = this._selectedYearMonth();

    if (!familyId || !userId) throw new Error('אין משפחה פעילה');

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לסגור חודש');
    }

    // Update all variable entries with actual amounts
    const existingEntries = this._entries();
    for (const closeEntry of entries) {
      const entry = existingEntries.find((e) => e.category === closeEntry.category);
      if (entry) {
        await this.firestoreService.updateDocument(
          `families/${familyId}/budgetEntries/${entry.id}`,
          { actualAmount: closeEntry.actualAmount }
        );
      }
    }

    // Recalculate totals
    await this.recalculateMonthlyTotals();

    // Mark month as closed
    await this.firestoreService.updateDocument(
      `families/${familyId}/monthlyBudgets/${yearMonth}`,
      {
        status: 'closed',
        closedAt: this.firestoreService.getServerTimestamp(),
        closedBy: userId,
      }
    );

    // Pre-create next month
    const nextMonth = getNextYearMonth(yearMonth);
    await this.createMonthFromConfigs(nextMonth);
  }

  getSameAsLastMonth(category: BudgetCategory | string): number {
    const entry = this._entries().find((e) => e.category === category);
    return entry?.lastMonthActual || 0;
  }

  // ============================================
  // SHOPPING INTEGRATION
  // ============================================

  async linkShoppingTrip(tripId: string, actualTotal: number): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    // Find the groceries entry for current month
    const entry = this._entries().find((e) => e.category === 'groceries');
    if (!entry) return;

    // Update linked trips and shopping total
    const linkedIds = [...entry.linkedShoppingTripIds, tripId];
    const newShoppingTotal = entry.shoppingTotal + actualTotal;

    await this.firestoreService.updateDocument(
      `families/${familyId}/budgetEntries/${entry.id}`,
      {
        linkedShoppingTripIds: linkedIds,
        shoppingTotal: newShoppingTotal,
        actualAmount: newShoppingTotal + entry.manualAdjustment,
      }
    );

    await this.recalculateMonthlyTotals();

    // Emit event for any listeners
    this._shoppingTripCompleted.next({ tripId, actualTotal });
  }

  async updateManualAdjustment(entryId: string, adjustment: number): Promise<void> {
    const entry = this._entries().find((e) => e.id === entryId);
    if (!entry) return;

    const actualAmount = entry.shoppingTotal + adjustment;
    await this.updateEntry(entryId, { manualAdjustment: adjustment, actualAmount });
  }

  // ============================================
  // HISTORICAL DATA
  // ============================================

  private async loadHistoricalMonths(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const months = await this.firestoreService.getCollection<MonthlyBudget>(
      `families/${familyId}/monthlyBudgets`,
      where('status', '==', 'closed'),
      orderBy('yearMonth', 'desc')
    );

    this._historicalMonths.set(months.slice(0, 12)); // Keep last 12 months
  }

  private async calculateThreeMonthAverage(
    category: BudgetCategory | string,
    currentYearMonth: string
  ): Promise<number> {
    const familyId = this.familyService.familyId();
    if (!familyId) return 0;

    const months = [
      getPreviousYearMonth(currentYearMonth),
      getPreviousYearMonth(getPreviousYearMonth(currentYearMonth)),
      getPreviousYearMonth(getPreviousYearMonth(getPreviousYearMonth(currentYearMonth))),
    ];

    let total = 0;
    let count = 0;

    for (const ym of months) {
      const entries = await this.firestoreService.getCollection<BudgetEntry>(
        `families/${familyId}/budgetEntries`,
        where('yearMonth', '==', ym),
        where('category', '==', category)
      );
      if (entries.length > 0 && entries[0].actualAmount > 0) {
        total += entries[0].actualAmount;
        count++;
      }
    }

    return count > 0 ? Math.round(total / count) : 0;
  }

  private getThreeMonthAverage(): number {
    const history = this._historicalMonths();
    if (history.length === 0) return 0;
    const slice = history.slice(0, 3);
    const total = slice.reduce((sum, m) => sum + m.totalActual + m.totalOccasional, 0);
    return total / slice.length;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private buildCategorySummaries(entries: BudgetEntry[]): BudgetCategorySummary[] {
    return entries.map((entry) => {
      const meta = getBudgetCategoryMeta(entry.category);
      const status = getBudgetStatus(entry.actualAmount, entry.plannedAmount);

      return {
        category: entry.category,
        categoryLabel: entry.categoryLabel || meta?.labelHe || entry.category,
        categoryIcon: meta?.icon || 'category',
        categoryColor: meta?.color || '#868e96',
        expenseType: entry.expenseType,
        planned: entry.plannedAmount,
        actual: entry.actualAmount,
        status,
        percentUsed: entry.plannedAmount > 0
          ? (entry.actualAmount / entry.plannedAmount) * 100
          : 0,
        seasonalContext: meta?.seasonalContext,
      };
    });
  }

  private checkNeedsClosing(): boolean {
    const month = this._currentMonth();
    if (!month || month.status === 'closed') return false;

    const now = new Date();
    const [yearStr, monthStr] = month.yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    // If current date is in a later month, needs closing
    if (now.getFullYear() > year) return true;
    if (now.getFullYear() === year && now.getMonth() + 1 > monthNum) return true;

    return false;
  }

  private async recalculateMonthlyTotals(): Promise<void> {
    const familyId = this.familyService.familyId();
    const yearMonth = this._selectedYearMonth();
    if (!familyId) return;

    const entries = this._entries();
    const occasional = this._occasionalExpenses();

    const totalPlanned = entries.reduce((sum, e) => sum + e.plannedAmount, 0);
    const totalActual = entries.reduce((sum, e) => sum + e.actualAmount, 0);
    const totalOccasional = occasional.reduce((sum, o) => sum + o.amount, 0);

    await this.firestoreService.updateDocument(
      `families/${familyId}/monthlyBudgets/${yearMonth}`,
      { totalPlanned, totalActual, totalOccasional }
    );
  }

  // ============================================
  // UI HELPERS
  // ============================================

  toggleTypeCollapsed(expenseType: ExpenseType): void {
    this._collapsedTypes.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(expenseType)) {
        newSet.delete(expenseType);
      } else {
        newSet.add(expenseType);
      }
      return newSet;
    });
  }

  clearError(): void {
    this._error.set(null);
  }
}

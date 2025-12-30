import { Timestamp } from 'firebase/firestore';

// ============================================
// EXPENSE TYPE DEFINITIONS
// ============================================

export type ExpenseType = 'fixed' | 'variable' | 'occasional';

export interface ExpenseTypeMeta {
  id: ExpenseType;
  labelHe: string;
  icon: string;
  color: string;
  description: string;
}

export const EXPENSE_TYPES: ExpenseTypeMeta[] = [
  {
    id: 'fixed',
    labelHe: 'קבוע חודשי',
    icon: 'lock',
    color: '#5c7cfa',
    description: 'הוצאה קבועה כל חודש (שכירות, טלפון)',
  },
  {
    id: 'variable',
    labelHe: 'משתנה חודשי',
    icon: 'trending_up',
    color: '#fab005',
    description: 'הוצאה עם יעד אך סכום משתנה (סופר, דלק)',
  },
  {
    id: 'occasional',
    labelHe: 'חד פעמי',
    icon: 'shopping_bag',
    color: '#20c997',
    description: 'רכישות חד פעמיות לפי הצורך',
  },
];

/**
 * Get expense type metadata by ID
 */
export function getExpenseTypeMeta(typeId: ExpenseType): ExpenseTypeMeta {
  return EXPENSE_TYPES.find((t) => t.id === typeId) ?? EXPENSE_TYPES[0];
}

// ============================================
// BUDGET CATEGORY DEFINITIONS
// ============================================

export type BudgetCategory =
  // Fixed categories (typically fixed monthly)
  | 'rent' // שכירות/משכנתא
  | 'utilities' // חשבונות (חשמל, מים, גז, ועד בית)
  | 'phone' // טלפון ואינטרנט
  | 'insurance' // ביטוחים
  | 'subscriptions' // מינויים (נטפליקס, ספוטיפיי וכו')
  | 'education' // חינוך (צהרונים, חוגים קבועים)
  | 'loans' // הלוואות
  // Variable categories
  | 'groceries' // מזון וסופר
  | 'fuel' // דלק
  | 'transportation' // תחבורה ציבורית
  | 'dining' // אוכל בחוץ
  | 'health' // בריאות ותרופות
  | 'clothing' // ביגוד והנעלה
  | 'kids' // הוצאות ילדים
  | 'entertainment' // בילויים ופנאי
  | 'pets' // חיות מחמד
  | 'online_shopping' // קניות אונליין
  // Occasional/General
  | 'home' // בית ורהיטים
  | 'electronics' // אלקטרוניקה
  | 'gifts' // מתנות
  | 'vacation' // חופשות
  | 'car' // רכב (לא דלק)
  | 'other'; // אחר

export interface BudgetCategoryMeta {
  id: BudgetCategory;
  labelHe: string;
  icon: string;
  color: string;
  defaultType: ExpenseType;
  order: number;
  seasonalContext?: string;
}

export const BUDGET_CATEGORIES: BudgetCategoryMeta[] = [
  // Fixed (typically)
  { id: 'rent', labelHe: 'שכירות/משכנתא', icon: 'home', color: '#845ef7', defaultType: 'fixed', order: 0 },
  { id: 'utilities', labelHe: 'חשבונות בית', icon: 'bolt', color: '#fab005', defaultType: 'fixed', order: 1, seasonalContext: 'חשמל גבוה יותר בקיץ (מזגן) ובחורף (חימום)' },
  { id: 'phone', labelHe: 'טלפון ואינטרנט', icon: 'wifi', color: '#5c7cfa', defaultType: 'fixed', order: 2 },
  { id: 'insurance', labelHe: 'ביטוחים', icon: 'shield', color: '#868e96', defaultType: 'fixed', order: 3 },
  { id: 'subscriptions', labelHe: 'מינויים', icon: 'subscriptions', color: '#e64980', defaultType: 'fixed', order: 4 },
  { id: 'education', labelHe: 'חינוך וחוגים', icon: 'school', color: '#5c7cfa', defaultType: 'fixed', order: 5, seasonalContext: 'תשלומים גבוהים יותר בתחילת שנה"ל' },
  { id: 'loans', labelHe: 'הלוואות', icon: 'account_balance', color: '#c4704f', defaultType: 'fixed', order: 6 },
  // Variable
  { id: 'groceries', labelHe: 'מזון וסופר', icon: 'shopping_cart', color: '#40c057', defaultType: 'variable', order: 7, seasonalContext: 'הוצאות גבוהות יותר בחגים' },
  { id: 'fuel', labelHe: 'דלק', icon: 'local_gas_station', color: '#ff922b', defaultType: 'variable', order: 8 },
  { id: 'transportation', labelHe: 'תחבורה', icon: 'directions_bus', color: '#20c997', defaultType: 'variable', order: 9 },
  { id: 'dining', labelHe: 'אוכל בחוץ', icon: 'restaurant', color: '#e64980', defaultType: 'variable', order: 10 },
  { id: 'health', labelHe: 'בריאות', icon: 'medical_services', color: '#fa5252', defaultType: 'variable', order: 11 },
  { id: 'clothing', labelHe: 'ביגוד והנעלה', icon: 'checkroom', color: '#be4bdb', defaultType: 'variable', order: 12 },
  { id: 'kids', labelHe: 'הוצאות ילדים', icon: 'child_care', color: '#74c0fc', defaultType: 'variable', order: 13 },
  { id: 'entertainment', labelHe: 'בילויים', icon: 'theater_comedy', color: '#f783ac', defaultType: 'variable', order: 14 },
  { id: 'pets', labelHe: 'חיות מחמד', icon: 'pets', color: '#a9e34b', defaultType: 'variable', order: 15 },
  { id: 'online_shopping', labelHe: 'קניות אונליין', icon: 'local_shipping', color: '#339af0', defaultType: 'variable', order: 16 },
  // Occasional
  { id: 'home', labelHe: 'בית ורהיטים', icon: 'weekend', color: '#845ef7', defaultType: 'occasional', order: 17 },
  { id: 'electronics', labelHe: 'אלקטרוניקה', icon: 'devices', color: '#228be6', defaultType: 'occasional', order: 18 },
  { id: 'gifts', labelHe: 'מתנות', icon: 'card_giftcard', color: '#f06595', defaultType: 'occasional', order: 19, seasonalContext: 'גבוה יותר בתקופת חגים ומועדים' },
  { id: 'vacation', labelHe: 'חופשות', icon: 'flight_takeoff', color: '#20c997', defaultType: 'occasional', order: 20, seasonalContext: 'קיץ ופסח - תקופות חופשה עיקריות' },
  { id: 'car', labelHe: 'רכב (טיפולים)', icon: 'directions_car', color: '#845ef7', defaultType: 'occasional', order: 21 },
  { id: 'other', labelHe: 'אחר', icon: 'more_horiz', color: '#868e96', defaultType: 'occasional', order: 22 },
];

/**
 * Get budget category metadata by ID
 */
export function getBudgetCategoryMeta(categoryId: BudgetCategory | string): BudgetCategoryMeta | undefined {
  return BUDGET_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * Get categories by expense type
 */
export function getCategoriesByType(type: ExpenseType): BudgetCategoryMeta[] {
  return BUDGET_CATEGORIES.filter((c) => c.defaultType === type);
}

// ============================================
// BUDGET STATUS
// ============================================

export type BudgetStatus = 'good' | 'close' | 'over';

export interface BudgetStatusMeta {
  id: BudgetStatus;
  labelHe: string;
  icon: string;
  color: string;
}

export const BUDGET_STATUSES: BudgetStatusMeta[] = [
  { id: 'good', labelHe: 'במסגרת', icon: 'check_circle', color: '#40c057' },
  { id: 'close', labelHe: 'קרוב ליעד', icon: 'warning', color: '#fab005' },
  { id: 'over', labelHe: 'חריגה', icon: 'error', color: '#fa5252' },
];

/**
 * Calculate budget status based on actual vs planned
 */
export function getBudgetStatus(actual: number, planned: number): BudgetStatus {
  if (planned === 0) return 'good';
  const ratio = actual / planned;
  if (ratio <= 0.9) return 'good';
  if (ratio <= 1.0) return 'close';
  return 'over';
}

/**
 * Get budget status metadata
 */
export function getBudgetStatusMeta(status: BudgetStatus): BudgetStatusMeta {
  return BUDGET_STATUSES.find((s) => s.id === status) ?? BUDGET_STATUSES[0];
}

// ============================================
// BUDGET SETTINGS (per family)
// ============================================

export interface BudgetSettings {
  id: string;
  familyId: string;
  currency: string; // Default: 'ILS'
  monthClosingDay: number; // 1-28, day of month when budget period ends (default: 1)
  isSetupComplete: boolean; // Whether initial setup has been done
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CustomCategory {
  id: string;
  labelHe: string;
  icon: string;
  color: string;
  defaultType: ExpenseType;
  order: number;
}

// ============================================
// BUDGET CATEGORY CONFIG (monthly targets)
// ============================================

export interface BudgetCategoryConfig {
  id: string;
  familyId: string;
  category: BudgetCategory | string; // string for custom categories
  expenseType: ExpenseType;
  targetAmount: number; // Monthly target/expected amount in shekels
  isActive: boolean;
  order: number;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Data for creating/updating a category config
 */
export interface CategoryConfigData {
  category: BudgetCategory | string;
  expenseType: ExpenseType;
  targetAmount: number;
  notes?: string;
}

// ============================================
// MONTHLY BUDGET RECORD
// ============================================

export interface MonthlyBudget {
  id: string;
  familyId: string;
  yearMonth: string; // Format: "2025-01"
  year: number;
  month: number; // 1-12
  status: 'active' | 'closed';

  // Summary (denormalized for quick access)
  totalPlanned: number;
  totalActual: number;
  totalOccasional: number;

  // Metadata
  closedAt?: Timestamp;
  closedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// BUDGET ENTRY (per category per month)
// ============================================

export interface BudgetEntry {
  id: string;
  familyId: string;
  monthlyBudgetId: string;
  yearMonth: string;

  // Category info
  category: BudgetCategory | string;
  categoryLabel: string; // Denormalized for display
  expenseType: ExpenseType;

  // Amounts
  plannedAmount: number; // Target/expected
  actualAmount: number; // Actual spent

  // Historical data for suggestions
  lastMonthActual?: number;
  threeMonthAverage?: number;

  // Shopping integration (for groceries category)
  linkedShoppingTripIds: string[];
  shoppingTotal: number; // Sum from shopping trips
  manualAdjustment: number; // User override amount (+/-)

  // Metadata
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Data for updating a budget entry
 */
export interface UpdateEntryData {
  actualAmount?: number;
  manualAdjustment?: number;
  notes?: string;
}

// ============================================
// OCCASIONAL EXPENSE (one-off purchases)
// ============================================

export interface OccasionalExpense {
  id: string;
  familyId: string;
  yearMonth: string;

  // Details
  description: string;
  category: BudgetCategory | string;
  amount: number;
  date: Timestamp;

  // Optional link to shopping
  linkedShoppingTripId?: string;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Data for adding an occasional expense
 */
export interface AddOccasionalExpenseData {
  description: string;
  category: BudgetCategory | string;
  amount: number;
  date: Date;
}

// ============================================
// CLOSE MONTH WIZARD DATA
// ============================================

export interface CloseMonthEntry {
  category: BudgetCategory | string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  expenseType: ExpenseType;
  plannedAmount: number;
  suggestedAmount: number;
  actualAmount: number;
  suggestionSource: 'last_month' | 'three_month_avg' | 'shopping' | 'manual';
  lastMonthActual?: number;
  threeMonthAverage?: number;
  shoppingTotal?: number;
}

// ============================================
// DASHBOARD/DISPLAY MODELS
// ============================================

export interface BudgetCategorySummary {
  category: BudgetCategory | string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  expenseType: ExpenseType;
  planned: number;
  actual: number;
  status: BudgetStatus;
  percentUsed: number;
  seasonalContext?: string;
}

export interface MonthlyBudgetSummary {
  yearMonth: string;
  monthLabel: string; // "ינואר 2025"
  totalPlanned: number;
  totalActual: number;
  totalOccasional: number;
  grandTotal: number;
  status: BudgetStatus;
  percentUsed: number;
  byCategory: BudgetCategorySummary[];
  comparisonToLastMonth: number; // +/- percentage
  comparisonToAverage: number;
  isClosed: boolean;
  needsClosing: boolean;
}

export interface BudgetGroupedByType {
  expenseType: ExpenseType;
  meta: ExpenseTypeMeta;
  categories: BudgetCategorySummary[];
  totalPlanned: number;
  totalActual: number;
  isCollapsed: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format year-month string for display in Hebrew
 */
export function formatMonthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ];
  const monthIndex = parseInt(monthStr, 10) - 1;
  return `${monthNames[monthIndex]} ${yearStr}`;
}

/**
 * Get current year-month string
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get previous year-month string
 */
export function getPreviousYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month === 0) {
    month = 12;
    year--;
  }
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Get next year-month string
 */
export function getNextYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month === 13) {
    month = 1;
    year++;
  }
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Format amount in shekels
 */
export function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`;
}

/**
 * Get default categories for initial setup
 */
export function getDefaultCategories(): BudgetCategoryMeta[] {
  // Return commonly used categories for initial setup
  return BUDGET_CATEGORIES.filter((c) =>
    ['rent', 'utilities', 'phone', 'groceries', 'fuel', 'dining', 'health', 'entertainment'].includes(c.id)
  );
}

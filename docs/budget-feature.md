# Budget Management Feature

## Overview

The Budget Management feature helps families track and manage their monthly expenses with minimal friction. It categorizes expenses into three types and provides tools for monitoring spending against targets.

## Design Philosophy

- **Low friction**: Minimal steps to track expenses, smart suggestions based on history
- **No shaming**: Positive language, neutral status indicators, focus on helping rather than judging
- **Family-friendly**: Shared budget accessible to all family members with appropriate permissions
- **Hebrew-first**: Full RTL support with Hebrew labels and currency (₪)

## Expense Types

### 1. Fixed Monthly (קבוע חודשי)
Predictable expenses that are the same every month.
- Examples: Rent, insurance, phone bills, subscriptions
- These are automatically carried forward each month

### 2. Variable Monthly (משתנה חודשי)
Regular expenses with targets but varying amounts.
- Examples: Groceries, fuel, dining out, entertainment
- Smart suggestions based on previous months

### 3. Occasional (חד פעמי)
One-off purchases that don't occur regularly.
- Examples: Electronics, furniture, gifts, vacation
- Tracked separately without monthly targets

## Features

### Budget Setup Wizard
First-time setup flow for new families:
1. Select relevant categories from predefined list
2. Set monthly targets for each category
3. Review and confirm

### Budget Dashboard
Main overview showing:
- Month selector with navigation
- Summary card with total planned vs actual
- Progress ring visualization
- Categories grouped by expense type (collapsible)
- Quick actions for adding expenses

### Category Management
- Add/edit/delete budget categories
- Set monthly targets
- Assign expense types
- Toggle categories active/inactive

### Occasional Expenses
- Quick-add form for one-off purchases
- List view with filtering by category
- Monthly subtotals

### Close Month Wizard
End-of-month flow with smart suggestions:
1. **Welcome**: Overview of month's data
2. **Variable Categories**: One per screen with:
   - Suggested amount based on history
   - "Same as last month" quick action
   - Manual input option
3. **Occasional Review**: Verify one-off expenses
4. **Summary**: Final totals and comparison to target
5. **Celebration**: Confetti animation on completion!

### Shopping Integration
When a shopping trip is completed, the total is automatically linked to the "groceries" budget category.

### Badge Indicator
When a month needs closing, a badge appears on the budget navigation item.

## Data Model

### Collections (Firestore)

```
families/{familyId}/
├── budgetSettings          # Family budget settings
├── budgetConfigs/          # Per-category targets and settings
├── monthlyBudgets/         # One doc per month: "2025-01"
├── budgetEntries/          # Entries per category per month
└── occasionalExpenses/     # One-off expenses
```

### Key Interfaces

```typescript
// Category types
type BudgetCategory = 'rent' | 'groceries' | 'fuel' | ...

// Expense classification
type ExpenseType = 'fixed' | 'variable' | 'occasional'

// Category configuration with targets
interface BudgetCategoryConfig {
  category: BudgetCategory
  expenseType: ExpenseType
  targetAmount: number
  isActive: boolean
}

// Monthly budget snapshot
interface MonthlyBudget {
  yearMonth: string        // "2025-01"
  status: 'active' | 'closed'
  totalPlanned: number
  totalActual: number
  totalOccasional: number
}

// Individual budget entry
interface BudgetEntry {
  category: BudgetCategory
  plannedAmount: number
  actualAmount: number
  linkedShoppingTripIds: string[]
}
```

## Default Categories

### Fixed (קבוע חודשי)
| ID | Hebrew | Icon |
|----|--------|------|
| rent | שכירות/משכנתא | home |
| utilities | חשבונות בית | bolt |
| phone | טלפון ואינטרנט | wifi |
| insurance | ביטוחים | shield |
| subscriptions | מינויים | subscriptions |
| education | חינוך וחוגים | school |
| loans | הלוואות | account_balance |

### Variable (משתנה חודשי)
| ID | Hebrew | Icon |
|----|--------|------|
| groceries | מזון וסופר | shopping_cart |
| fuel | דלק | local_gas_station |
| transportation | תחבורה | directions_bus |
| dining | אוכל בחוץ | restaurant |
| health | בריאות | medical_services |
| clothing | ביגוד והנעלה | checkroom |
| kids | הוצאות ילדים | child_care |
| entertainment | בילויים | theater_comedy |
| pets | חיות מחמד | pets |

### Occasional (חד פעמי)
| ID | Hebrew | Icon |
|----|--------|------|
| home | בית ורהיטים | weekend |
| electronics | אלקטרוניקה | devices |
| gifts | מתנות | card_giftcard |
| vacation | חופשות | flight_takeoff |
| car | רכב (טיפולים) | directions_car |
| other | אחר | more_horiz |

## Routes

```
/app/budget                 # Dashboard (main view)
/app/budget/setup           # First-time setup wizard
/app/budget/categories      # Category management
/app/budget/occasional      # Occasional expenses list
/app/budget/close-month     # Close month wizard
/app/budget/history         # Historical view
```

## Status Indicators

Budget status is calculated based on actual vs planned spending:

| Status | Hebrew | Condition | Color |
|--------|--------|-----------|-------|
| good | במסגרת | ≤90% of target | Green (#40c057) |
| close | קרוב ליעד | 90-100% of target | Yellow (#fab005) |
| over | חריגה | >100% of target | Red (#fa5252) |

## Smart Suggestions

During month closing, the system suggests amounts based on:

1. **Last month's actual**: Previous month's spending
2. **3-month average**: Rolling average for more stable prediction
3. **Shopping data**: Linked shopping trips total (for groceries)
4. **Manual**: User's custom input

## Permissions

Budget follows the family's role-based permissions:
- **Owner/Admin**: Full access (create, edit, close month)
- **Member**: Can view and add expenses
- **Viewer**: Read-only access

## File Structure

```
src/app/features/budget/
├── budget.models.ts              # Types, interfaces, constants
├── budget.service.ts             # Service with signals, CRUD
├── budget.routes.ts              # Route configuration
├── budget-setup/
│   └── budget-setup.component.ts
├── budget-dashboard/
│   └── budget-dashboard.component.ts
├── category-config/
│   ├── category-config-list.component.ts
│   └── category-config-dialog.component.ts
├── occasional-expenses/
│   ├── occasional-list.component.ts
│   └── add-occasional-dialog.component.ts
├── close-month/
│   └── close-month-wizard.component.ts
└── budget-history/
    └── budget-history.component.ts
```

## Technical Notes

### State Management
Uses Angular Signals for reactive state:
- `categoryConfigs`: Active budget categories
- `currentMonth`: Current month's budget data
- `entries`: Budget entries for selected month
- `occasionalExpenses`: One-off expenses
- `monthSummary`: Computed summary with totals
- `needsClosingBadge`: Signal for navigation badge

### Shopping Integration
The shopping service calls `budgetService.linkShoppingTrip()` when a trip is completed:
```typescript
await budgetService.linkShoppingTrip(tripId, actualTotal);
```
This automatically updates the groceries category's actual amount.

### Real-time Updates
All data uses Firestore real-time subscriptions for immediate sync across devices.

## Future Enhancements

- [ ] Month-over-month comparison charts
- [ ] Export to CSV/Excel
- [ ] Budget templates for quick setup
- [ ] Recurring expense reminders
- [ ] Category-specific insights and tips

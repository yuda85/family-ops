# Dashboard Feature

Unified family overview displaying upcoming events, tasks, shopping status, and children activity.

## Overview

The dashboard serves as the home page for FamilyOps, aggregating data from multiple features into a single view:

- Personalized greeting with time-based Hebrew salutations
- Quick stats summary (events, rides, topics)
- Children strip with event counts and ride indicators
- Upcoming events for the next 7 days with child avatars
- User's assigned tasks from topics
- Shopping list progress
- Important/urgent topics with deadlines

## User Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Dashboard Flow                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  /app/dashboard (Home Page)                                   │
│  ├── Welcome Header                                          │
│  │   ├── Greeting + User Name                                │
│  │   ├── Today's Date                                        │
│  │   └── Quick Stats (events, rides, topics)                 │
│  │                                                            │
│  ├── Kids Strip                                              │
│  │   └── Child chips with event/ride counts                  │
│  │                                                            │
│  ├── Upcoming Events Card                                    │
│  │   ├── Events grouped by day                               │
│  │   ├── Child avatars per event                             │
│  │   └── Link to calendar                                    │
│  │                                                            │
│  ├── My Tasks Card                                           │
│  │   ├── Tasks assigned to current user                      │
│  │   ├── Due dates with overdue indicators                   │
│  │   └── Link to topics                                      │
│  │                                                            │
│  ├── Shopping Status Card                                    │
│  │   ├── Active list progress                                │
│  │   └── Link to shopping                                    │
│  │                                                            │
│  └── Important Topics Card                                   │
│      ├── Active/urgent topics                                │
│      ├── Progress rings                                      │
│      └── Link to topics                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/app/dashboard` | DashboardViewComponent | Main dashboard view (default home) |

## Architecture

### File Structure

```
src/app/features/dashboard/
├── dashboard.models.ts           # Data models and interfaces
├── dashboard.service.ts          # Data aggregation and loading
├── dashboard.routes.ts           # Route configuration
│
└── dashboard-view/               # Main dashboard component
    └── dashboard-view.component.ts
```

### Data Flow

```
DashboardService (aggregates from multiple services)
    │
    ├── CalendarService
    │   └── expandedEvents → upcomingEventsByDay
    │
    ├── FamilyService
    │   ├── sortedChildren → childrenOverview
    │   └── getChildren() → event child lookup
    │
    ├── ShoppingService
    │   ├── activeList
    │   ├── progress
    │   ├── totalCount
    │   └── checkedCount → shoppingStatus
    │
    ├── TopicsService
    │   └── topics → importantTopics
    │
    └── Firestore (direct query)
        └── tasks subcollections → myTasks
```

## Data Models

### ChildDashboardView

```typescript
interface ChildDashboardView {
  child: FamilyChild;
  upcomingEvents: CalendarEventInstance[];
  eventsNeedingRide: CalendarEventInstance[];
  hasRideNeeded: boolean;
}
```

### EventDayGroup

```typescript
interface EventDayGroup {
  date: Date;
  dateLabel: string;        // "היום", "מחר", "יום ב' 15/01"
  isToday: boolean;
  isTomorrow: boolean;
  events: CalendarEventInstance[];
}
```

### ShoppingStatusSummary

```typescript
interface ShoppingStatusSummary {
  hasActiveList: boolean;
  listName: string | null;
  progress: number;         // 0-100
  totalItems: number;
  checkedItems: number;
  isComplete: boolean;
  activeShoppers: string[]; // User IDs
  status: 'active' | 'shopping' | 'completed' | null;
}
```

### DashboardTask

```typescript
interface DashboardTask {
  task: TopicTask;
  topic: Topic;
  isOverdue: boolean;
  daysUntilDue: number | null;
}
```

### DashboardTopic

```typescript
interface DashboardTopic {
  topic: Topic;
  isUrgent: boolean;
  daysUntilDeadline: number | null;
  progress: number;         // Task completion percentage
}
```

### DashboardStats

```typescript
interface DashboardStats {
  eventsNext7Days: number;
  ridesNeeded: number;
  pendingTasks: number;
  activeTopics: number;
  shoppingProgress: number;
}
```

## Service

### DashboardService

**Path**: `src/app/features/dashboard/dashboard.service.ts`

Central service that aggregates data from CalendarService, ShoppingService, TopicsService, and FamilyService.

**Signals**:

```typescript
// State
readonly isLoading: Signal<boolean>;
readonly error: Signal<string | null>;
readonly lastRefresh: Signal<Date | null>;

// Computed
readonly dateRange: Signal<{ start: Date; end: Date }>;  // Today + 7 days
readonly userName: Signal<string>;                        // First name from user
readonly greeting: Signal<string>;                        // Hebrew time-based greeting

// Data aggregations
readonly upcomingEventsByDay: Signal<EventDayGroup[]>;
readonly childrenOverview: Signal<ChildDashboardView[]>;
readonly shoppingStatus: Signal<ShoppingStatusSummary>;
readonly importantTopics: Signal<DashboardTopic[]>;
readonly myTasks: Signal<DashboardTask[]>;
readonly stats: Signal<DashboardStats>;
```

**Key Methods**:

```typescript
// Load all dashboard data
async loadDashboard(): Promise<void>

// Refresh dashboard
async refresh(): Promise<void>

// Clear error state
clearError(): void
```

**Greeting Logic**:

```typescript
readonly greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';      // Good morning
  if (hour < 17) return 'צהריים טובים';  // Good afternoon
  if (hour < 21) return 'ערב טוב';       // Good evening
  return 'לילה טוב';                     // Good night
});
```

**Task Loading**:

Tasks are loaded by iterating through each topic and querying its tasks subcollection:

```typescript
private async loadMyTasks(): Promise<void> {
  const topics = this.topicsService.topics();

  const taskPromises = topics.map(async (topic) => {
    const tasksPath = `families/${familyId}/topics/${topic.id}/tasks`;
    const tasksRef = collection(this.db, tasksPath);
    const tasksQuery = query(
      tasksRef,
      where('assignedTo', 'array-contains', userId)
    );
    const snapshot = await getDocs(tasksQuery);
    // ... process tasks
  });

  await Promise.all(taskPromises);
}
```

## Component

### DashboardViewComponent

**Path**: `src/app/features/dashboard/dashboard-view/dashboard-view.component.ts`

Main dashboard display component.

**Features**:

- Responsive grid layout (2 columns on desktop, 1 on mobile)
- Time-based Hebrew greeting
- Animated card entrance (staggered fade-in)
- Loading skeleton states
- Empty states with helpful messages
- Dark mode support
- RTL layout

**Sections**:

1. **Welcome Header**: Greeting, user name, date, quick stats chips
2. **Kids Strip**: Horizontal child chips with avatars and event/ride counts
3. **Upcoming Events**: Events grouped by day with child avatars
4. **My Tasks**: User's assigned tasks with due date indicators
5. **Shopping Status**: Active list progress bar
6. **Important Topics**: Urgent/active topics with progress rings

**Helper Methods**:

```typescript
// Get category color for event display
getCategoryColor(event: CalendarEventInstance): string

// Format event time (or "כל היום" for all-day)
formatEventTime(event: CalendarEventInstance): string

// Get first character for avatar
getInitial(name: string): string

// Get children assigned to an event
getEventChildren(event: CalendarEventInstance): FamilyChild[]

// Topic category helpers
getTopicCategoryColor(category: string): string
getTopicCategoryIcon(category: string): string

// Task priority helpers
getTaskPriorityColor(priority: string): string
getTaskPriorityIcon(priority: string): string
```

## UI Layout

### Desktop Layout (>768px)

```
┌────────────────────────────────────────────────────────────────┐
│  בוקר טוב, יוסי                    יום שני, 28 בינואר          │
│                              [🗓 5 אירועים] [🚗 2 הסעות] [📋 3] │
├────────────────────────────────────────────────────────────────┤
│  👶 הילדים: [נ נועה 3 🗓] [י יעל 2 🗓 1 🚗]                    │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │ 🗓 אירועים קרובים           │  │ ✓ המשימות שלי          │  │
│  │                             │  │                         │  │
│  │  היום                       │  │  ○ להזמין מלון         │  │
│  │  ├─ 08:00 בית ספר [נ]      │  │    📋 חופשה לפסח       │  │
│  │  └─ 16:00 חוג כדורגל [י]   │  │                         │  │
│  │                             │  │  ○ לקנות מתנה          │  │
│  │  מחר                        │  │    📋 יום הולדת נועה   │  │
│  │  └─ 10:00 רופא [נ] [י]     │  │                         │  │
│  │                             │  │                         │  │
│  │           [לכל היומן >]     │  │      [לכל המשימות >]   │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │ 🛒 קניות                    │  │ 📌 נושאים חשובים       │  │
│  │                             │  │                         │  │
│  │  רשימה שבועית               │  │  ┌───────────────────┐  │  │
│  │  ████████░░░░░ 60%          │  │  │ ✈ חופשה פסח  75%  │  │  │
│  │  12/20 פריטים               │  │  │   עוד 15 ימים     │  │  │
│  │                             │  │  └───────────────────┘  │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

Single column layout with sections stacking vertically.

## Styling

### CSS Custom Properties Used

```css
--surface-primary         /* Card backgrounds */
--surface-secondary       /* Inner elements, chips */
--surface-hover          /* Hover states */
--border-subtle          /* Card borders */
--border-default         /* Active borders */
--text-primary           /* Main text */
--text-secondary         /* Secondary text */
--text-tertiary          /* Muted text */
--color-primary          /* Accent color, links */
--color-primary-alpha    /* Primary with transparency */
--color-warning          /* Ride indicators, due soon */
--color-error            /* Overdue items */
--color-success          /* Completed items */
```

### Animations

```css
/* Page fade-in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Staggered card entrance */
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Cards use animation-delay for stagger */
.card:nth-child(1) { animation-delay: 0.05s; }
.card:nth-child(2) { animation-delay: 0.1s; }
.card:nth-child(3) { animation-delay: 0.15s; }
.card:nth-child(4) { animation-delay: 0.2s; }
```

## Routing Integration

### app.routes.ts

```typescript
{
  path: 'app',
  component: MainLayoutComponent,
  children: [
    {
      path: '',
      redirectTo: 'dashboard',  // Dashboard is default
      pathMatch: 'full',
    },
    {
      path: 'dashboard',
      loadChildren: () => import('./features/dashboard/dashboard.routes'),
    },
    // ... other routes
  ],
}
```

### Navigation

Dashboard is added to both desktop sidebar and mobile bottom navigation:

**main-layout.component.ts**:
```typescript
navItems = [
  { path: '/app/dashboard', icon: 'dashboard', label: 'בית', exactMatch: true },
  // ...
];
```

**bottom-nav.component.ts**:
```typescript
navItems = [
  { path: '/app/dashboard', icon: 'dashboard', label: 'בית', exactMatch: true },
  // ...
];
```

## Security Rules

Tasks are loaded via per-topic queries. The following Firestore rules apply:

```javascript
// Topics collection
match /families/{familyId}/topics/{topicId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);

  // Tasks subcollection
  match /tasks/{taskId} {
    allow read: if isFamilyMember(familyId);
    allow write: if canWrite(familyId);
  }
}

// Collection group query support for tasks
match /{path=**}/tasks/{taskId} {
  allow read: if isAuthenticated();
}
```

## Usage Examples

### Load Dashboard on Init

```typescript
@Component({...})
export class DashboardViewComponent implements OnInit {
  dashboardService = inject(DashboardService);

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
  }
}
```

### Access Computed Data

```typescript
// In template
{{ dashboardService.greeting() }}, {{ dashboardService.userName() }}

// Stats
@if (dashboardService.stats(); as stats) {
  <span>{{ stats.eventsNext7Days }} אירועים</span>
}

// Upcoming events by day
@for (day of dashboardService.upcomingEventsByDay(); track day.dateLabel) {
  <div>{{ day.dateLabel }}</div>
  @for (event of day.events; track event.event.id) {
    <span>{{ event.event.title }}</span>
  }
}
```

### Get Children for Event

```typescript
getEventChildren(event: CalendarEventInstance): FamilyChild[] {
  return this.familyService.getChildren(event.event.childrenIds || []);
}

// In template
@for (child of getEventChildren(event); track child.id) {
  <span class="child-badge" [style.background]="child.color">
    {{ child.name.charAt(0) }}
  </span>
}
```

## Performance Considerations

### Parallel Loading

Calendar events and shopping data are loaded in parallel:

```typescript
await Promise.all([
  this.calendarService.loadEvents(range.start, range.end),
  this.shoppingService.loadActiveList(),
]);
```

### Topics Subscription Timing

Topics use a subscription model. Dashboard waits for topics to load before querying tasks:

```typescript
private async waitForTopicsAndLoadTasks(): Promise<void> {
  const maxWait = 5000;
  const checkInterval = 100;
  let waited = 0;

  while (this.topicsService.topics().length === 0 && waited < maxWait) {
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    waited += checkInterval;
  }

  await this.loadMyTasks();
}
```

### Computed Signals

All dashboard data views use Angular computed signals for automatic updates when source data changes.

## Implementation Status

### Completed

- Welcome header with greeting and stats
- Kids strip with avatars and counts
- Upcoming events grouped by day
- Child avatars on events
- My tasks card with due dates
- Shopping progress display
- Important topics with progress rings
- Responsive layout
- Dark mode support
- RTL Hebrew layout
- Loading skeleton states
- Empty states
- Card navigation to feature pages

### Planned

- Pull-to-refresh on mobile
- Weather integration
- Family member online status
- Quick actions (add event, add task)
- Customizable card order
- Notifications summary

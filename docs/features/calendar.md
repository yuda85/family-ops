# Calendar Feature

Shared family calendar with events, activities, and ride coordination.

## Overview

The calendar provides a shared view of family events with:
- Hebrew week layout (Saturday to Friday)
- Multiple view modes (Month, Week, Day)
- Event categorization with colors
- Child assignment to events
- Ride coordination

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Calendar Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  /app/calendar                                          │
│  ├── Month View (default)                               │
│  │   └── Click date → Show day events                   │
│  │   └── Click event → Event details                    │
│  │   └── FAB → Create event                             │
│  │                                                      │
│  ├── Week View (coming soon)                            │
│  │                                                      │
│  ├── Day View (coming soon)                             │
│  │                                                      │
│  └── /calendar/rides                                    │
│      └── Ride coordination view                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/app/calendar` | CalendarViewComponent | Main calendar view |
| `/app/calendar/event/:id` | EventDetailComponent | Event details |
| `/app/calendar/rides` | RidesViewComponent | Ride coordination |

## Components

### Calendar View
**Path**: `src/app/features/calendar/calendar-view/calendar-view.component.ts`

Main calendar display with month grid.

**Features**:
- Month navigation (previous/next)
- Go to today button
- View toggle (Month/Week/Day)
- Date selection
- Event indicators (color dots)
- Selected day events panel

**Month Grid**:
- 7 columns (Saturday to Friday, RTL)
- Today highlighted with primary color circle
- Selected date with background highlight
- Adjacent month days grayed out
- Up to 3 event dots per day

**Signals**:
```typescript
currentView = signal<CalendarView>('month');
currentDate = signal(new Date());
selectedDate = signal<Date | null>(null);

// Computed
monthWeeks = computed(() => {
  // Generates 6 weeks of date cells
  // Each cell: { date, dateStr, dayNumber, isCurrentMonth, isToday, events }
});
```

### Event Form (Planned)
**Path**: `src/app/features/calendar/event-form/event-form.component.ts`

Create and edit events.

**Planned Fields**:
- Title (required)
- Description
- Category selection
- Start/End date and time
- All-day toggle
- Child assignment (multi-select)
- Location
- Needs ride toggle
- Driver assignment
- Recurrence settings

### Event Detail (Planned)
**Path**: `src/app/features/calendar/event-detail/event-detail.component.ts`

View event details with actions.

**Planned Features**:
- Full event information
- Child avatars with colors
- Edit/Delete actions
- Mark as needs ride
- Volunteer to drive

### Rides View (Planned)
**Path**: `src/app/features/calendar/rides-view/rides-view.component.ts`

Coordinate rides for events.

**Planned Features**:
- Events needing rides
- Driver assignments
- "Who's picking up?" view

## Data Models

### CalendarEvent (Planned)
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  category: EventCategory;
  isFamilyEvent: boolean;
  start: Timestamp;
  end: Timestamp;
  isAllDay: boolean;
  childrenIds: string[];
  needsRide: boolean;
  driverUserId?: string;
  returnHomeTime?: Timestamp;
  recurrence?: EventRecurrence;
  templateId?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### EventCategory
```typescript
type EventCategory =
  | 'school'     // בית ספר
  | 'activity'   // חוג
  | 'family'     // משפחה
  | 'general'    // כללי
  | 'vacation'   // חופשה
  | 'car'        // רכב
  | 'health'     // בריאות
  | 'other';     // אחר
```

### Category Metadata
```typescript
const EVENT_CATEGORIES = {
  school: {
    label: 'בית ספר',
    icon: 'school',
    color: '#5c8dd6'
  },
  activity: {
    label: 'חוג',
    icon: 'sports_soccer',
    color: '#87a878'
  },
  family: {
    label: 'משפחה',
    icon: 'family_restroom',
    color: '#c4704f'
  },
  general: {
    label: 'כללי',
    icon: 'event',
    color: '#808080'
  },
  vacation: {
    label: 'חופשה',
    icon: 'beach_access',
    color: '#e9c46a'
  },
  car: {
    label: 'רכב',
    icon: 'directions_car',
    color: '#6c757d'
  },
  health: {
    label: 'בריאות',
    icon: 'medical_services',
    color: '#e07a5f'
  },
  other: {
    label: 'אחר',
    icon: 'more_horiz',
    color: '#adb5bd'
  }
};
```

### EventRecurrence
```typescript
interface EventRecurrence {
  type: 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek?: number[];  // 0=Sunday, 6=Saturday
  endDate?: Timestamp;
}
```

### EventTemplate
```typescript
interface EventTemplate {
  id: string;
  title: string;
  category: EventCategory;
  dayOfWeek: number;
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  childrenIds: string[];
  createdBy: string;
}
```

## Firestore Structure

### Events Subcollection
```
families/{familyId}/events/{eventId}
├── title: string
├── description?: string
├── location?: string
├── category: EventCategory
├── isFamilyEvent: boolean
├── start: Timestamp
├── end: Timestamp
├── isAllDay: boolean
├── childrenIds: string[]
├── needsRide: boolean
├── driverUserId?: string
├── returnHomeTime?: Timestamp
├── recurrence?: EventRecurrence
├── templateId?: string
├── createdBy: string
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### Event Templates Subcollection
```
families/{familyId}/eventTemplates/{templateId}
├── title: string
├── category: EventCategory
├── dayOfWeek: number
├── startTime: string
├── endTime: string
├── childrenIds: string[]
└── createdBy: string
```

## Hebrew Week Layout

The calendar uses Israeli week format:
- Week starts on **Saturday** (שבת)
- Week ends on **Friday** (שישי)
- RTL display order

```
ש  |  ו  |  ה  |  ד  |  ג  |  ב  |  א
Sat| Fri | Thu | Wed | Tue | Mon | Sun
```

## UI Components

### Month View Header
```
[<] [  ינואר 2024  ] [>]  [היום]   [חודש|שבוע|יום]
```

### Day Cell
```
┌─────────────┐
│ 28          │  ← Day number (blue circle if today)
│ ● ● ●       │  ← Event dots (max 3, colored by category)
│             │
└─────────────┘
```

### Selected Day Panel
```
┌─────────────────────────────────┐
│ אירועים ב-יום שני, 28 בינואר  │
├─────────────────────────────────┤
│ 🏫 08:00 - לימודים             │
│ ⚽ 16:00 - חוג כדורגל (יעל)    │
│ 🚗 18:00 - הסעה מהחוג           │
└─────────────────────────────────┘
```

## Current Implementation Status

### Completed ✓
- Month view grid with RTL layout
- Date navigation (previous/next month)
- Go to today functionality
- View toggle (Month/Week/Day buttons)
- Date selection with highlight
- Today indication
- Adjacent month day styling
- Responsive design (mobile/desktop)
- Hebrew day names

### In Progress
- Event data binding
- Event creation form
- Event detail view

### Planned
- Week view
- Day view
- Event CRUD operations
- Ride coordination
- Recurring events
- Event templates
- Filters by child/category
- Event notifications

## Usage Examples

### Navigate Calendar
```typescript
const calendarComponent = ...;

// Go to next month
calendarComponent.nextPeriod();

// Go to previous month
calendarComponent.previousPeriod();

// Go to today
calendarComponent.goToToday();

// Select a date
calendarComponent.selectDate(new Date(2024, 0, 15));
```

### Create Event (Planned)
```typescript
const eventService = inject(CalendarService);

await eventService.createEvent({
  title: 'חוג כדורגל',
  category: 'activity',
  start: new Date(2024, 0, 15, 16, 0),
  end: new Date(2024, 0, 15, 17, 30),
  childrenIds: ['child1'],
  needsRide: true,
});
```

### Get Events for Date Range (Planned)
```typescript
const events = await eventService.getEvents(
  startOfMonth(date),
  endOfMonth(date)
);
```

## Security Rules

```javascript
match /families/{familyId}/events/{eventId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);  // owner, admin, or member
}

match /families/{familyId}/eventTemplates/{templateId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);
}
```

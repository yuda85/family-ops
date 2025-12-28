# Topics Feature

Collaborative "Important Topics" for family planning and coordination around significant family matters.

## Overview

Topics centralize discussions and planning around important family matters such as vacations, home projects, birthdays, major purchases, and more. Each topic serves as a hub with:

- Rich content sections (text, checklists, links)
- Assignable tasks with due dates and subtasks
- Threaded discussions with reactions
- Calendar event integration
- Progress tracking

## User Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Topics Flow                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  /app/topics                                                  │
│  ├── Topics grouped by status                                │
│  │   ├── 📋 Planning (בתכנון)                                │
│  │   ├── 🚀 Active (פעיל)                                    │
│  │   ├── ✅ Completed (הושלם)                                │
│  │   └── 📦 Archived (בארכיון)                               │
│  │                                                            │
│  ├── Click topic card → Topic detail view                    │
│  ├── FAB → Create new topic                                  │
│  │                                                            │
│  /app/topics/:topicId                                        │
│  ├── Topic header with status, priority, dates               │
│  ├── Content sections (collapsible)                          │
│  │   ├── Text sections                                       │
│  │   ├── Checklists                                          │
│  │   └── Link collections                                    │
│  ├── Tasks list with assignments                             │
│  └── Discussion thread                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/app/topics` | TopicListComponent | List view with topics grouped by status |
| `/app/topics/:topicId` | TopicDetailComponent | Full topic view with all features |

## Architecture

### File Structure

```
src/app/features/topics/
├── topics.models.ts              # All data models and types
├── topics.service.ts             # Main CRUD, filtering, real-time sync
├── tasks.service.ts              # Task management, assignments, subtasks
├── comments.service.ts           # Threaded comments, reactions
├── topics.routes.ts              # Route configuration
│
├── topic-list/                   # Main list view
│   └── topic-list.component.ts
│
├── topic-detail/                 # Full topic view
│   └── topic-detail.component.ts
│
├── topic-form/                   # Create/edit dialog
│   └── topic-form.component.ts
│
└── components/
    ├── topic-card/               # Card for list display
    │   └── topic-card.component.ts
    ├── status-badge/             # Status indicator chip
    │   └── status-badge.component.ts
    ├── content-section/          # Editable content block
    │   └── content-section.component.ts
    ├── task-list/                # Task checklist container
    │   └── task-list.component.ts
    ├── task-item/                # Single task with subtasks
    │   └── task-item.component.ts
    ├── task-form/                # Task create/edit dialog
    │   └── task-form.component.ts
    └── comment-thread/           # Comments display and input
        └── comment-thread.component.ts
```

### Services

| Service | Responsibility |
|---------|---------------|
| `TopicsService` | Main CRUD, filtering, real-time sync, calendar linking, activity logging |
| `TasksService` | Task management, assignments, subtasks, status updates |
| `CommentsService` | Threaded comments, mentions, reactions |

## Data Models

### Topic (Main Document)

```typescript
interface Topic {
  id: string;
  familyId: string;

  // Core info
  title: string;
  description: string;
  category: TopicCategory;
  priority: TopicPriority;
  status: TopicStatus;

  // Content sections (editable blocks)
  contentSections: ContentSection[];

  // Linking
  linkedEventIds: string[];          // Calendar events
  linkedChildrenIds: string[];       // Which children involved

  // Target dates
  targetDate?: Timestamp;
  deadline?: Timestamp;

  // Collaboration tracking
  activeEditors: string[];
  lastEditedBy?: string;
  lastEditedAt?: Timestamp;

  // Counters (denormalized for performance)
  taskCount: number;
  completedTaskCount: number;
  commentCount: number;
  attachmentCount: number;

  // Pinned to top
  isPinned: boolean;
  pinnedAt?: Timestamp;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
}
```

### TopicStatus

```typescript
type TopicStatus = 'planning' | 'active' | 'completed' | 'archived';

const TOPIC_STATUSES = [
  { id: 'planning', labelHe: 'בתכנון', icon: 'edit_note', color: '#868e96' },
  { id: 'active', labelHe: 'פעיל', icon: 'play_circle', color: '#228be6' },
  { id: 'completed', labelHe: 'הושלם', icon: 'check_circle', color: '#40c057' },
  { id: 'archived', labelHe: 'בארכיון', icon: 'inventory_2', color: '#adb5bd' },
];
```

### TopicPriority

```typescript
type TopicPriority = 'low' | 'medium' | 'high' | 'urgent';

const TOPIC_PRIORITIES = [
  { id: 'low', labelHe: 'נמוכה', icon: 'keyboard_arrow_down', color: '#868e96' },
  { id: 'medium', labelHe: 'בינונית', icon: 'remove', color: '#fab005' },
  { id: 'high', labelHe: 'גבוהה', icon: 'keyboard_arrow_up', color: '#fd7e14' },
  { id: 'urgent', labelHe: 'דחוף', icon: 'priority_high', color: '#fa5252' },
];
```

### TopicCategory

```typescript
type TopicCategory =
  | 'vacation'      // חופשה
  | 'home'          // בית
  | 'finance'       // כספים
  | 'education'     // חינוך
  | 'health'        // בריאות
  | 'celebration'   // אירוע
  | 'purchase'      // רכישה
  | 'general';      // כללי

const TOPIC_CATEGORIES = [
  { id: 'vacation', labelHe: 'חופשה', icon: 'flight_takeoff', color: '#20c997' },
  { id: 'home', labelHe: 'בית', icon: 'home', color: '#845ef7' },
  { id: 'finance', labelHe: 'כספים', icon: 'account_balance', color: '#fab005' },
  { id: 'education', labelHe: 'חינוך', icon: 'school', color: '#5c7cfa' },
  { id: 'health', labelHe: 'בריאות', icon: 'medical_services', color: '#e64980' },
  { id: 'celebration', labelHe: 'אירוע', icon: 'celebration', color: '#ff922b' },
  { id: 'purchase', labelHe: 'רכישה', icon: 'shopping_bag', color: '#74c0fc' },
  { id: 'general', labelHe: 'כללי', icon: 'topic', color: '#868e96' },
];
```

### ContentSection

```typescript
type ContentSectionType = 'text' | 'checklist' | 'links';

interface ContentSection {
  id: string;
  type: ContentSectionType;
  title: string;
  order: number;
  isCollapsed: boolean;
  content?: string;           // For 'text' type
  items?: ChecklistItem[];    // For 'checklist' type
  links?: LinkItem[];         // For 'links' type
}

interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Timestamp;
  order: number;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  order: number;
}
```

### TopicTask (Subcollection)

```typescript
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface TopicTask {
  id: string;
  topicId: string;

  title: string;
  description?: string;

  assignedTo: string[];        // User IDs
  dueDate?: Timestamp;

  status: TaskStatus;
  priority: TopicPriority;

  subtasks: Subtask[];

  order: number;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
}

interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: Timestamp;
  order: number;
}
```

### TopicComment (Subcollection)

```typescript
interface TopicComment {
  id: string;
  topicId: string;

  content: string;

  // Threading
  parentCommentId?: string;
  replyCount: number;

  // Reactions: emoji -> array of user IDs
  reactions: Record<string, string[]>;

  mentionedUserIds: string[];

  isEdited: boolean;
  editedAt?: Timestamp;

  createdBy: string;
  createdAt: Timestamp;
}
```

### TopicActivity (Subcollection)

```typescript
type ActivityType =
  | 'topic_created'
  | 'topic_updated'
  | 'status_changed'
  | 'task_added'
  | 'task_completed'
  | 'task_assigned'
  | 'comment_added'
  | 'attachment_added'
  | 'event_linked';

interface TopicActivity {
  id: string;
  topicId: string;
  type: ActivityType;
  description: string;
  targetId?: string;
  targetType?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  performedAt: Timestamp;
}
```

## Firestore Structure

```
families/{familyId}/
└── topics/{topicId}
    ├── title: string
    ├── description: string
    ├── category: TopicCategory
    ├── priority: TopicPriority
    ├── status: TopicStatus
    ├── contentSections: ContentSection[]
    ├── linkedEventIds: string[]
    ├── linkedChildrenIds: string[]
    ├── targetDate?: Timestamp
    ├── deadline?: Timestamp
    ├── activeEditors: string[]
    ├── taskCount: number
    ├── completedTaskCount: number
    ├── commentCount: number
    ├── attachmentCount: number
    ├── isPinned: boolean
    ├── createdBy: string
    ├── createdAt: Timestamp
    ├── updatedAt: Timestamp
    │
    ├── /tasks/{taskId}
    │   ├── title: string
    │   ├── description?: string
    │   ├── assignedTo: string[]
    │   ├── dueDate?: Timestamp
    │   ├── status: TaskStatus
    │   ├── priority: TopicPriority
    │   ├── subtasks: Subtask[]
    │   ├── order: number
    │   ├── createdBy: string
    │   ├── createdAt: Timestamp
    │   └── updatedAt: Timestamp
    │
    ├── /comments/{commentId}
    │   ├── content: string
    │   ├── parentCommentId?: string
    │   ├── replyCount: number
    │   ├── reactions: Record<string, string[]>
    │   ├── mentionedUserIds: string[]
    │   ├── isEdited: boolean
    │   ├── createdBy: string
    │   └── createdAt: Timestamp
    │
    └── /activities/{activityId}
        ├── type: ActivityType
        ├── description: string
        ├── performedBy: string
        └── performedAt: Timestamp
```

## Components

### TopicListComponent

**Path**: `src/app/features/topics/topic-list/topic-list.component.ts`

Main list view with topics organized by status.

**Features**:
- Topics grouped into collapsible status sections
- Pinned topics appear at top of their status group
- Empty state with call-to-action
- FAB button to create new topic
- Filter and search (future)

**Signals**:
```typescript
topicsService = inject(TopicsService);

// From service
groupedTopics = this.topicsService.groupedTopics;
isLoading = this.topicsService.isLoading;
```

### TopicDetailComponent

**Path**: `src/app/features/topics/topic-detail/topic-detail.component.ts`

Full topic view with all features.

**Features**:
- Editable title and description
- Status and priority quick-change
- Content sections (add/edit/delete/reorder)
- Tasks list with progress bar
- Comments thread
- Pin/unpin topic
- Delete topic

**Sections**:
1. **Header**: Category icon, title, status badge, priority, target date, task progress
2. **Description**: Click-to-edit description area
3. **Children chips**: Linked family members
4. **Progress bar**: Visual task completion indicator
5. **Content sections**: Collapsible text/checklist/links blocks
6. **Tasks**: Task list with subtasks and assignments
7. **Comments**: Threaded discussion area
8. **Stats footer**: Comment count, attachment count, linked events

### TopicCardComponent

**Path**: `src/app/features/topics/components/topic-card/topic-card.component.ts`

Card representation for list view.

**Displays**:
- Category icon with color
- Title with pin indicator
- Priority badge
- Status badge
- Target date (with overdue highlighting)
- Task progress (X/Y)
- Comment count
- Click to navigate to detail

### ContentSectionComponent

**Path**: `src/app/features/topics/components/content-section/content-section.component.ts`

Editable content block supporting three types.

**Section Types**:

1. **Text**: Rich text content with click-to-edit
2. **Checklist**: Todo items with completion tracking and count display (5/8)
3. **Links**: URL collection with auto-extracted domain titles

**Features**:
- Collapsible header
- Title editing via menu
- Delete via menu
- Type-specific content editing

### TaskListComponent

**Path**: `src/app/features/topics/components/task-list/task-list.component.ts`

Container for task items with add functionality.

**Features**:
- List of TaskItem components
- Quick task input at bottom
- Loading state
- Empty state

### TaskItemComponent

**Path**: `src/app/features/topics/components/task-item/task-item.component.ts`

Individual task with subtasks.

**Features**:
- Checkbox for completion
- Title with strikethrough when complete
- Subtask list with indentation
- Expand/collapse subtasks
- Quick add subtask
- Edit task via dialog
- Delete task
- Assignee avatars
- Due date display with overdue warning

### TaskFormComponent

**Path**: `src/app/features/topics/components/task-form/task-form.component.ts`

Dialog for creating/editing tasks.

**Fields**:
- Title (required)
- Description
- Assigned members (multi-select)
- Due date (date picker)
- Priority (select)

### CommentThreadComponent

**Path**: `src/app/features/topics/components/comment-thread/comment-thread.component.ts`

Full comments interface with threading.

**Features**:
- New comment input with current user avatar
- Comment list with author info
- Relative time display ("לפני 5 דקות")
- Reply threading (one level deep)
- Emoji reactions with user list tooltip
- Edit/delete own comments
- Reply expand/collapse

## Services

### TopicsService

**Path**: `src/app/features/topics/topics.service.ts`

Main service for topic management.

**Signals**:
```typescript
readonly topics: Signal<Topic[]>;
readonly currentTopic: Signal<Topic | null>;
readonly isLoading: Signal<boolean>;
readonly error: Signal<string | null>;
readonly groupedTopics: Signal<TopicStatusGroup[]>;
```

**Key Methods**:
```typescript
// Subscription
subscribeToTopics(): void
subscribeToTopic(topicId: string): void
clearCurrentTopic(): void

// CRUD
createTopic(data: CreateTopicData): Promise<string>
updateTopic(topicId: string, data: UpdateTopicData): Promise<void>
deleteTopic(topicId: string): Promise<void>

// Status management
changeStatus(topicId: string, newStatus: TopicStatus): Promise<void>
togglePin(topicId: string): Promise<void>
toggleGroupCollapse(status: TopicStatus): void

// Calendar integration
linkEvent(topicId: string, eventId: string): Promise<void>
unlinkEvent(topicId: string, eventId: string): Promise<void>

// Activity logging
logActivity(topicId: string, type: ActivityType, description: string): Promise<void>
```

**Calendar Integration**:
When a topic is created with a `targetDate`, the service automatically:
1. Creates a calendar event with the topic title
2. Maps topic category to event category
3. Links the event ID to the topic

### TasksService

**Path**: `src/app/features/topics/tasks.service.ts`

Task management within a topic.

**Signals**:
```typescript
readonly tasks: Signal<TopicTask[]>;
readonly isLoading: Signal<boolean>;
readonly error: Signal<string | null>;
readonly pendingTasks: Signal<TopicTask[]>;
readonly completedTasks: Signal<TopicTask[]>;
readonly sortedTasks: Signal<TopicTask[]>;
```

**Key Methods**:
```typescript
// Subscription
subscribeToTasks(topicId: string): void
clearTasks(): void

// CRUD
createTask(topicId: string, data: CreateTaskData): Promise<string>
updateTask(topicId: string, taskId: string, data: UpdateTaskData): Promise<void>
deleteTask(topicId: string, taskId: string): Promise<void>

// Status
toggleTaskStatus(topicId: string, taskId: string): Promise<void>
toggleSubtask(topicId: string, taskId: string, subtaskId: string): Promise<void>

// Subtasks
addSubtask(topicId: string, taskId: string, text: string): Promise<void>
removeSubtask(topicId: string, taskId: string, subtaskId: string): Promise<void>
```

### CommentsService

**Path**: `src/app/features/topics/comments.service.ts`

Comments and reactions management.

**Signals**:
```typescript
readonly comments: Signal<TopicComment[]>;
readonly isLoading: Signal<boolean>;
readonly error: Signal<string | null>;
readonly totalCount: Signal<number>;
readonly topLevelComments: Signal<TopicComment[]>;
```

**Key Methods**:
```typescript
// Subscription
subscribeToComments(topicId: string): void
clearComments(): void

// CRUD
createComment(topicId: string, data: CreateCommentData): Promise<string>
updateComment(topicId: string, commentId: string, content: string): Promise<void>
deleteComment(topicId: string, commentId: string): Promise<void>

// Threading
getReplies(parentCommentId: string): TopicComment[]

// Reactions
toggleReaction(topicId: string, commentId: string, emoji: string): Promise<void>
```

## UI Components

### Topic List View

```
┌─────────────────────────────────────────────────────────────┐
│  נושאים חשובים                                    [+ חדש]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼ 📋 בתכנון (3)                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📌 ✈️ חופשה לפסח                     גבוהה  15/04     │ │
│  │    📅 0/5 משימות   💬 3                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🏠 שיפוץ מטבח                       בינונית            │ │
│  │    📅 2/8 משימות   💬 12                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ▼ 🚀 פעיל (2)                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🎉 יום הולדת לנועה                  דחוף    01/02     │ │
│  │    📅 4/6 משימות   💬 8                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ▶ ✅ הושלם (5)                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Topic Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  [←]  ✈️ חופשה לפסח                                        │
│       [פעיל] גבוהה  📅 15/04/2025  ☑️ 2/5                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  תכנון טיול משפחתי לאילת לחופשת פסח                         │
│                                                              │
│  [נועה] [יעל]                                               │
│                                                              │
│  ████████░░░░░░░░░░░░░░░░░░░░░░  40% הושלם                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  תוכן                                         [+ הוסף קטע]  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ▼ מה לארוז                               [⋮]  2/8     │ │
│  │   ☑ בגדי ים                                            │ │
│  │   ☐ קרם הגנה                                           │ │
│  │   ☐ משקפי שמש                                          │ │
│  │   [+ הוסף פריט...]                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ▼ קישורים                                 [⋮]          │ │
│  │   🔗 booking.com - הזמנת מלון                          │ │
│  │   🔗 issta.co.il - טיסות                               │ │
│  │   [+ הדבק קישור...]                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  משימות                                          [+ הוסף]  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ☑ להזמין מלון                             [אבא]       │ │
│  │ ☐ להזמין טיסות                  📅 01/03  [אמא]       │ │
│  │   ☐ לבדוק מחירים                                       │ │
│  │   ☐ להשוות חברות                                       │ │
│  │ ☐ לתכנן פעילויות                          [כולם]       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  💬 דיון (3)                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [😊] הוסף תגובה...                           [שלח]     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [👩] אמא • לפני 2 שעות                                 │ │
│  │ מצאתי מלון מעולה! מה דעתכם?                            │ │
│  │ [👍 2] [❤️ 1]                    [↩ השב] [⋮]           │ │
│  │   ┌──────────────────────────────────────────────────┐ │ │
│  │   │ [👨] אבא • לפני שעה                              │ │ │
│  │   │ נראה מצוין!                                      │ │ │
│  │   └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  💬 3 תגובות  📎 0 קבצים  📅 1 אירועים                      │
└─────────────────────────────────────────────────────────────┘
```

## Security Rules

```javascript
match /families/{familyId}/topics/{topicId} {
  allow read: if isFamilyMember(familyId);
  allow create: if canEditFamily(familyId);
  allow update: if canEditFamily(familyId);
  allow delete: if isFamilyAdmin(familyId) ||
                   resource.data.createdBy == request.auth.uid;
}

match /families/{familyId}/topics/{topicId}/tasks/{taskId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canEditFamily(familyId);
}

match /families/{familyId}/topics/{topicId}/comments/{commentId} {
  allow read: if isFamilyMember(familyId);
  allow create: if canEditFamily(familyId);
  allow update: if canEditFamily(familyId) &&
                   resource.data.createdBy == request.auth.uid;
  allow delete: if isFamilyAdmin(familyId) ||
                   resource.data.createdBy == request.auth.uid;
}

match /families/{familyId}/topics/{topicId}/activities/{activityId} {
  allow read: if isFamilyMember(familyId);
  allow create: if canEditFamily(familyId);
  // Activities are immutable
  allow update, delete: if false;
}
```

## Usage Examples

### Create a Topic

```typescript
const topicsService = inject(TopicsService);

const topicId = await topicsService.createTopic({
  title: 'חופשה לפסח',
  description: 'תכנון טיול משפחתי',
  category: 'vacation',
  priority: 'high',
  targetDate: new Date(2025, 3, 15),
  linkedChildrenIds: ['child1', 'child2'],
});
```

### Add a Task

```typescript
const tasksService = inject(TasksService);

await tasksService.createTask(topicId, {
  title: 'להזמין מלון',
  description: 'לבדוק אפשרויות באילת',
  assignedTo: ['userId1'],
  dueDate: new Date(2025, 2, 1),
  priority: 'high',
});
```

### Add a Comment

```typescript
const commentsService = inject(CommentsService);

await commentsService.createComment(topicId, {
  content: 'מצאתי מלון מעולה!',
  mentionedUserIds: ['userId2'],
});

// Reply to comment
await commentsService.createComment(topicId, {
  content: 'נראה מצוין!',
  parentCommentId: 'commentId1',
});
```

### Toggle Reaction

```typescript
await commentsService.toggleReaction(topicId, commentId, '👍');
```

### Change Topic Status

```typescript
await topicsService.changeStatus(topicId, 'active');
```

## Implementation Status

### Completed ✓

- Topic list view with status grouping
- Topic detail view with full editing
- Content sections (text, checklist, links)
- Checklist completion count display
- Task management with subtasks
- Task assignments and due dates
- Threaded comments with replies
- Emoji reactions on comments
- Status transitions
- Priority management
- Pin/unpin topics
- Calendar event creation on topic creation
- Real-time updates via Firestore subscriptions
- Activity logging (basic)

### Planned (Phase 5-6)

- Attachments (image/file upload)
- Link preview with metadata
- Drag-and-drop for sections/tasks
- Full activity timeline view
- Topic templates
- Export to PDF
- Notifications for mentions
- Keyboard shortcuts
- Dashboard integration

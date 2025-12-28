import { Timestamp } from 'firebase/firestore';

// ============================================
// TOPIC STATUS & PRIORITY
// ============================================

export type TopicStatus = 'planning' | 'active' | 'completed' | 'archived';
export type TopicPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TopicStatusMeta {
  id: TopicStatus;
  labelHe: string;
  icon: string;
  color: string;
  order: number;
}

export const TOPIC_STATUSES: TopicStatusMeta[] = [
  { id: 'planning', labelHe: 'בתכנון', icon: 'edit_note', color: '#868e96', order: 0 },
  { id: 'active', labelHe: 'פעיל', icon: 'play_circle', color: '#228be6', order: 1 },
  { id: 'completed', labelHe: 'הושלם', icon: 'check_circle', color: '#40c057', order: 2 },
  { id: 'archived', labelHe: 'בארכיון', icon: 'inventory_2', color: '#adb5bd', order: 3 },
];

export function getStatusMeta(statusId: TopicStatus): TopicStatusMeta {
  return TOPIC_STATUSES.find((s) => s.id === statusId) ?? TOPIC_STATUSES[0];
}

export interface TopicPriorityMeta {
  id: TopicPriority;
  labelHe: string;
  icon: string;
  color: string;
}

export const TOPIC_PRIORITIES: TopicPriorityMeta[] = [
  { id: 'low', labelHe: 'נמוכה', icon: 'keyboard_arrow_down', color: '#868e96' },
  { id: 'medium', labelHe: 'בינונית', icon: 'remove', color: '#fab005' },
  { id: 'high', labelHe: 'גבוהה', icon: 'keyboard_arrow_up', color: '#fd7e14' },
  { id: 'urgent', labelHe: 'דחוף', icon: 'priority_high', color: '#fa5252' },
];

export function getPriorityMeta(priorityId: TopicPriority): TopicPriorityMeta {
  return TOPIC_PRIORITIES.find((p) => p.id === priorityId) ?? TOPIC_PRIORITIES[1];
}

// ============================================
// TOPIC CATEGORIES
// ============================================

export type TopicCategory =
  | 'vacation'
  | 'home'
  | 'finance'
  | 'education'
  | 'health'
  | 'celebration'
  | 'purchase'
  | 'general';

export interface TopicCategoryMeta {
  id: TopicCategory;
  labelHe: string;
  icon: string;
  color: string;
}

export const TOPIC_CATEGORIES: TopicCategoryMeta[] = [
  { id: 'vacation', labelHe: 'חופשה', icon: 'flight_takeoff', color: '#20c997' },
  { id: 'home', labelHe: 'בית', icon: 'home', color: '#845ef7' },
  { id: 'finance', labelHe: 'כספים', icon: 'account_balance', color: '#fab005' },
  { id: 'education', labelHe: 'חינוך', icon: 'school', color: '#5c7cfa' },
  { id: 'health', labelHe: 'בריאות', icon: 'medical_services', color: '#e64980' },
  { id: 'celebration', labelHe: 'אירוע', icon: 'celebration', color: '#ff922b' },
  { id: 'purchase', labelHe: 'רכישה', icon: 'shopping_bag', color: '#74c0fc' },
  { id: 'general', labelHe: 'כללי', icon: 'topic', color: '#868e96' },
];

export function getCategoryMeta(categoryId: TopicCategory): TopicCategoryMeta {
  return TOPIC_CATEGORIES.find((c) => c.id === categoryId) ?? TOPIC_CATEGORIES[TOPIC_CATEGORIES.length - 1];
}

// ============================================
// CONTENT SECTIONS (editable blocks within topic)
// ============================================

export type ContentSectionType = 'text' | 'checklist' | 'links';

export interface ContentSection {
  id: string;
  type: ContentSectionType;
  title: string;
  order: number;
  isCollapsed: boolean;
  content?: string; // For 'text' type - markdown/rich text
  items?: ChecklistItem[]; // For 'checklist' type
  links?: LinkItem[]; // For 'links' type
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Timestamp;
  order: number;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  order: number;
}

// ============================================
// MAIN TOPIC DOCUMENT
// ============================================

export interface Topic {
  id: string;
  familyId: string;

  // Core info
  title: string;
  description: string;
  category: TopicCategory;
  priority: TopicPriority;
  status: TopicStatus;

  // Content sections (editable by all with permission)
  contentSections: ContentSection[];

  // Linking
  linkedEventIds: string[];
  linkedChildrenIds: string[];

  // Target dates (optional)
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

/**
 * Data for creating a new topic
 */
export interface CreateTopicData {
  title: string;
  description?: string;
  category: TopicCategory;
  priority?: TopicPriority;
  targetDate?: Date;
  deadline?: Date;
  linkedChildrenIds?: string[];
}

/**
 * Data for updating an existing topic
 */
export interface UpdateTopicData {
  title?: string;
  description?: string;
  category?: TopicCategory;
  priority?: TopicPriority;
  status?: TopicStatus;
  targetDate?: Date;
  deadline?: Date;
  linkedChildrenIds?: string[];
  isPinned?: boolean;
  contentSections?: ContentSection[];
}

// ============================================
// TASKS (subcollection under topic)
// ============================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TopicTask {
  id: string;
  topicId: string;

  // Task info
  title: string;
  description?: string;

  // Assignment
  assignedTo: string[];

  // Dates
  dueDate?: Timestamp;

  // Status
  status: TaskStatus;
  priority: TopicPriority;

  // Subtasks
  subtasks: Subtask[];

  // Ordering
  order: number;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
}

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: Timestamp;
  order: number;
}

/**
 * Data for creating a new task
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  assignedTo?: string[];
  dueDate?: Date;
  priority?: TopicPriority;
}

/**
 * Data for updating a task
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  assignedTo?: string[];
  dueDate?: Date;
  status?: TaskStatus;
  priority?: TopicPriority;
  subtasks?: Subtask[];
  order?: number;
}

// ============================================
// COMMENTS (subcollection under topic)
// ============================================

export interface TopicComment {
  id: string;
  topicId: string;

  // Content
  content: string;

  // Threading
  parentCommentId?: string;
  replyCount: number;

  // Reactions
  reactions: Record<string, string[]>; // emoji -> userIds

  // Mentions
  mentionedUserIds: string[];

  // Edit tracking
  isEdited: boolean;
  editedAt?: Timestamp;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
}

/**
 * Data for creating a comment
 */
export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
  mentionedUserIds?: string[];
}

// ============================================
// ATTACHMENTS (subcollection under topic)
// ============================================

export type AttachmentType = 'image' | 'document' | 'link' | 'file';

export interface TopicAttachment {
  id: string;
  topicId: string;

  // File info
  type: AttachmentType;
  name: string;
  mimeType?: string;
  size?: number; // Bytes

  // URLs
  url: string; // Firebase Storage URL or external link
  thumbnailUrl?: string;

  // For links
  linkMetadata?: {
    title: string;
    description?: string;
    favicon?: string;
  };

  // Metadata
  uploadedBy: string;
  uploadedAt: Timestamp;
}

// ============================================
// ACTIVITY LOG (subcollection under topic)
// ============================================

export type ActivityType =
  | 'topic_created'
  | 'topic_updated'
  | 'status_changed'
  | 'task_added'
  | 'task_completed'
  | 'task_assigned'
  | 'comment_added'
  | 'attachment_added'
  | 'event_linked';

export interface TopicActivity {
  id: string;
  topicId: string;

  type: ActivityType;
  description: string;

  // Context
  targetId?: string;
  targetType?: string;
  oldValue?: string;
  newValue?: string;

  // Metadata
  performedBy: string;
  performedAt: Timestamp;
}

// ============================================
// GROUPED TOPICS FOR DISPLAY
// ============================================

export interface TopicStatusGroup {
  status: TopicStatus;
  statusMeta: TopicStatusMeta;
  topics: Topic[];
  isCollapsed: boolean;
}

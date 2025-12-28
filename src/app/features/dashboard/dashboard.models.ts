import {
  CalendarEventInstance,
  FamilyChild,
} from '../../core/family/family.models';
import { Topic, TopicTask } from '../topics/topics.models';
import { ShoppingCategory, ShoppingCategoryMeta, ShoppingListItem } from '../shopping/shopping.models';

/**
 * Child overview with their upcoming events and ride needs
 */
export interface ChildDashboardView {
  child: FamilyChild;
  upcomingEvents: CalendarEventInstance[];
  eventsNeedingRide: CalendarEventInstance[];
  hasRideNeeded: boolean;
}

/**
 * Day group for upcoming events display
 */
export interface EventDayGroup {
  date: Date;
  dateLabel: string; // e.g., "היום", "מחר", "יום ב' 15/01"
  isToday: boolean;
  isTomorrow: boolean;
  events: CalendarEventInstance[];
}

/**
 * Category summary for shopping dashboard
 */
export interface ShoppingCategorySummary {
  category: ShoppingCategory;
  meta: ShoppingCategoryMeta;
  totalItems: number;
  checkedItems: number;
  isComplete: boolean;
}

/**
 * Shopping status summary for dashboard
 */
export interface ShoppingStatusSummary {
  hasActiveList: boolean;
  listName: string | null;
  progress: number; // 0-100
  totalItems: number;
  checkedItems: number;
  isComplete: boolean;
  activeShoppers: string[]; // User IDs currently shopping
  status: 'active' | 'shopping' | 'completed' | null;
  estimatedTotal: number;
  categories: ShoppingCategorySummary[];
  recentItems: ShoppingListItem[];
}

/**
 * Task with its parent topic info for dashboard display
 */
export interface DashboardTask {
  task: TopicTask;
  topic: Topic;
  isOverdue: boolean;
  daysUntilDue: number | null;
}

/**
 * Important topic for dashboard display
 */
export interface DashboardTopic {
  topic: Topic;
  isUrgent: boolean;
  daysUntilDeadline: number | null;
  progress: number; // Task completion percentage
}

/**
 * Dashboard summary statistics
 */
export interface DashboardStats {
  eventsNext7Days: number;
  ridesNeeded: number;
  pendingTasks: number;
  activeTopics: number;
  shoppingProgress: number;
}

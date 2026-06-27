// Threadly - All shared TypeScript types

// ---------------------------------------------
// Core domain types
// ---------------------------------------------

export type Priority = 'high' | 'medium' | 'low';
export type Sentiment = 'productive' | 'tense' | 'unclear' | 'routine';
export type ExportFormat = 'notion' | 'slack' | 'email';
export type ExportDestination = 'clipboard' | 'email';
export type ExportStatus = 'pending' | 'sent' | 'failed';
export type InsightType = 'recurring_topic' | 'ownership_gap' | 'meeting_health' | 'risk';

// ---------------------------------------------
// Action Items
// ---------------------------------------------

export interface ActionItem {
  id: string;
  meeting_id: string;
  user_id: string;
  title: string;
  assignee: string | null;
  due_date: string | null; // ISO date string YYYY-MM-DD
  priority: Priority;
  completed: boolean;
  created_at: string;
}

export interface ActionItemWithMeeting extends ActionItem {
  meeting_title: string;
  meeting_id: string;
}

// ---------------------------------------------
// Meetings
// ---------------------------------------------

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  raw_transcript: string | null;
  summary: string | null;
  decisions: string[] | null;
  topics: string[] | null;
  participants: string[] | null;
  sentiment: Sentiment | null;
  follow_up_needed: boolean;
  duration_estimate: string | null;
  met_at: string;
  created_at: string;
}

export interface MeetingWithItems extends Meeting {
  action_items: ActionItem[];
}

// ---------------------------------------------
// Gemini AI Analysis
// ---------------------------------------------

export interface ActionItemInput {
  title: string;
  assignee: string | null;
  due_date: string | null;
  priority: Priority;
}

export interface MeetingAnalysis {
  title: string;
  summary: string;
  decisions: string[];
  action_items: ActionItemInput[];
  participants: string[];
  topics: string[];
  duration_estimate: string;
  sentiment: Sentiment;
  follow_up_meeting_needed: boolean;
}

// ---------------------------------------------
// Insights
// ---------------------------------------------

export interface PatternInsight {
  type: InsightType;
  title: string;
  description: string;
  meetings_affected: string[];
}

// ---------------------------------------------
// Tasks
// ---------------------------------------------

export type TaskSortKey = 'due_date' | 'priority' | 'meeting_date';
export type TaskStatus = 'open' | 'completed' | 'all';

export interface TaskFilters {
  priority: Priority | 'all';
  status: TaskStatus;
  assignee: string;
  sort: TaskSortKey;
}

// ---------------------------------------------
// API Response types
// ---------------------------------------------

export interface ProcessMeetingResponse {
  meeting_id: string;
  analysis: MeetingAnalysis;
}

export interface InsightsResponse {
  insights: PatternInsight[];
}

export interface TasksResponse {
  tasks: ActionItemWithMeeting[];
}

export interface ExportResponse {
  success?: boolean;
  content?: string;
  delivered_to?: string;
  provider?: 'resend';
}

export interface ApiError {
  error: string;
}

// ---------------------------------------------
// Chat / Ask
// ---------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meetings_used?: string[];
  timestamp: Date;
}

// ---------------------------------------------
// Dashboard stats
// ---------------------------------------------

export interface DashboardStats {
  meetingsThisMonth: number;
  openTasksCount: number;
  completedTasksPercent: number;
  meetingsThisWeek: number;
}

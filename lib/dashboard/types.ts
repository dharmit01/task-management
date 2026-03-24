export const DASHBOARD_STATUSES = [
  "ToDo",
  "In-Progress",
  "Blocked",
  "In-Review",
  "Completed",
] as const;

export const DASHBOARD_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

export type DashboardStatus = (typeof DASHBOARD_STATUSES)[number];
export type DashboardPriority = (typeof DASHBOARD_PRIORITIES)[number];

export interface DashboardSummaryStats {
  total: number;
  completed: number;
  today: number;
  overdue: number;
  highPriority: number;
  blocked: number;
  inReview: number;
  dueThisWeek: number;
  completionRate: number;
}

export interface DashboardStatusDatum {
  status: DashboardStatus;
  count: number;
}

export interface DashboardPriorityDatum {
  priority: DashboardPriority;
  count: number;
}

export interface DashboardTaskListDatum {
  taskListId: string;
  name: string;
  color: string;
  total: number;
  completed: number;
}

export interface DashboardCharts {
  byStatus: DashboardStatusDatum[];
  byPriority: DashboardPriorityDatum[];
  byTaskList: DashboardTaskListDatum[];
}

export interface DashboardApiResponse {
  success: boolean;
  stats: DashboardSummaryStats;
  charts: DashboardCharts;
}

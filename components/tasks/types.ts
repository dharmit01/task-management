export type ViewMode = "card" | "table" | "board";

export interface TaskList {
  _id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Assignee {
  _id: string;
  name: string;
}

export interface TaskFilterMember extends Assignee {
  email?: string;
  role?: "Admin" | "Manager" | "Member";
  isActive?: boolean;
}

export interface CreatedBy extends Assignee {
  email: string;
}

export interface AuditLog {
  actor: string;
  action: "Task Created";
  field: "task";
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
  _id: string;
}

export interface Task {
  _id: string;
  taskId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  taskList: TaskList;
  priority: string;
  assignedTo: Assignee[] | null;
  createdBy: CreatedBy;
  status: string;
  auditLogs: AuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskStats {
  total: number;
  today: number;
  overdue: number;
  highPriority: number;
  completed: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TasksApiResponse {
  success: boolean;
  data: Task[];
  pagination?: PaginationMeta;
}

export interface UseTasksFilters {
  filter?: string;
  status?: string;
  priority?: string;
  taskList?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type ViewMode = "card" | "table" | "board";

export interface TaskList {
  _id: string;
  name: string;
  color: string;
}

export interface Assignee {
  _id: string;
  name: string;
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

export interface UseTasksFilters {
  filter?: string;
  status?: string;
  priority?: string;
  taskList?: string;
  search?: string;
}

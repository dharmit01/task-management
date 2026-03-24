"use client";

import { type DashboardPriority, type DashboardStatus } from "@/lib/dashboard/types";
import { type LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCheck,
  CircleDashed,
  Clock3,
  ListChecks,
  ShieldAlert,
} from "lucide-react";

export const statusColors: Record<DashboardStatus, string> = {
  ToDo: "#64748b",
  "In-Progress": "#3b82f6",
  Blocked: "#ef4444",
  "In-Review": "#8b5cf6",
  Completed: "#22c55e",
};

export const priorityColors: Record<DashboardPriority, string> = {
  Low: "#22c55e",
  Medium: "#eab308",
  High: "#f97316",
  Critical: "#ef4444",
};

export const statusLabels: Record<DashboardStatus, string> = {
  ToDo: "To do",
  "In-Progress": "In progress",
  Blocked: "Blocked",
  "In-Review": "In review",
  Completed: "Completed",
};

export const priorityLabels: Record<DashboardPriority, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Critical: "Critical",
};

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export const dashboardIcons: Record<
  | "total"
  | "completed"
  | "today"
  | "overdue"
  | "highPriority"
  | "completionRate",
  LucideIcon
> = {
  total: ListChecks,
  completed: CheckCheck,
  today: Clock3,
  overdue: AlertTriangle,
  highPriority: ShieldAlert,
  completionRate: CircleDashed,
};

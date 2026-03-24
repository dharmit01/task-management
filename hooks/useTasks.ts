import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  PaginationMeta,
  Task,
  TaskStats,
  TasksApiResponse,
  UseTasksFilters,
} from "../components/tasks/types";

export const useTasks = (filters?: UseTasksFilters) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    today: 0,
    overdue: 0,
    highPriority: 0,
    completed: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams();
        if (filters?.filter && filters.filter !== "all")
          queryParams.append("filter", filters.filter);
        if (filters?.status && filters.status !== "all")
          queryParams.append("status", filters.status);
        if (filters?.priority && filters.priority !== "all")
          queryParams.append("priority", filters.priority);
        if (filters?.taskList && filters.taskList !== "all")
          queryParams.append("taskList", filters.taskList);
        if (filters?.assignedTo && filters.assignedTo !== "all")
          queryParams.append("assignedTo", filters.assignedTo);
        if (filters?.search?.trim())
          queryParams.append("search", filters.search.trim());
        // Only append page/limit when caller requests pagination (board mode omits it)
        if (filters?.page !== undefined) {
          queryParams.append("page", String(filters.page));
          queryParams.append("limit", "25");
        }

        const qs = queryParams.toString();
        const response = await apiClient.get<TasksApiResponse>(
          qs ? `/api/tasks?${qs}` : "/api/tasks",
        );
        const tasks = response.data ?? [];

        setPagination(response.pagination ?? null);

        // Only compute dashboard stats when called without filters
        if (!filters) {
          const now = new Date();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          setStats({
            total: tasks.length,
            today: tasks.filter((t) => {
              const startDate = new Date(t.startDate);
              return startDate >= today && startDate < tomorrow;
            }).length,
            overdue: tasks.filter((t) => {
              const endDate = new Date(t.endDate);
              return endDate < now && t.status !== "Completed";
            }).length,
            highPriority: tasks.filter(
              (t) => t.priority === "High" || t.priority === "Critical",
            ).length,
            completed: tasks.filter((t) => t.status === "Completed").length,
          });
          setRecentTasks(tasks.slice(0, 5));
        }

        setTasks(tasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filters?.filter,
    filters?.status,
    filters?.priority,
    filters?.taskList,
    filters?.assignedTo,
    filters?.search,
    filters?.page,
  ]);

  return {
    tasks,
    recentTasks,
    stats,
    pagination,
    loading,
  };
};

import { apiClient } from "@/lib/api-client";
import { APIResponse } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Task, TaskStats, UseTasksFilters } from "../components/tasks/types";

export const useTasks = (filters?: UseTasksFilters) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
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
        if (filters?.search?.trim())
          queryParams.append("search", filters.search.trim());

        const qs = queryParams.toString();
        const allTasksResponse = await apiClient.get<APIResponse<Task[]>>(
          qs ? `/api/tasks?${qs}` : "/api/tasks",
        );
        const tasks = allTasksResponse.data ?? [];

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
    filters?.search,
  ]);

  return {
    tasks,
    recentTasks,
    stats,
    loading,
  };
};

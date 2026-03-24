"use client";

import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskSearchBar } from "@/components/tasks/TaskSearchBar";
import { TasksPageHeader } from "@/components/tasks/TasksPageHeader";
import { TaskView } from "@/components/tasks/TaskView";
import { TaskList, ViewMode } from "@/components/tasks/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [taskListFilter, setTaskListFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = localStorage.getItem("tasks-view-mode") as ViewMode | null;
    return saved && (["card", "table", "board"] as ViewMode[]).includes(saved)
      ? saved
      : "card";
  });

  const { tasks, loading } = useTasks({
    filter,
    status: statusFilter,
    priority: priorityFilter,
    taskList: taskListFilter,
    search: debouncedSearch,
  });

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("tasks-view-mode", mode);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    apiClient
      .get<{ success: boolean; taskLists: TaskList[] }>("/api/task-lists")
      .then((res) => setTaskLists(res.taskLists || []))
      .catch((err) => console.error("Failed to fetch company lists:", err));
  }, []);

  return (
    <div className="space-y-6">
      <TasksPageHeader />
      <TaskSearchBar
        searchQuery={searchQuery}
        viewMode={viewMode}
        onSearchChange={setSearchQuery}
        onViewChange={handleViewChange}
      />
      <TaskFilters
        filter={filter}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        taskListFilter={taskListFilter}
        taskLists={taskLists}
        isAdmin={isAdmin}
        onFilterChange={setFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onTaskListChange={setTaskListFilter}
        onClearFilters={() => {
          setFilter("all");
          setStatusFilter("all");
          setPriorityFilter("all");
          setTaskListFilter("all");
        }}
      />
      <TaskView
        tasks={tasks}
        loading={loading}
        viewMode={viewMode}
        searchQuery={debouncedSearch}
        isAdmin={isAdmin}
      />
    </div>
  );
}

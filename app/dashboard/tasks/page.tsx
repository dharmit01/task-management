"use client";

import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskPagination } from "@/components/tasks/TaskPagination";
import { TaskSearchBar } from "@/components/tasks/TaskSearchBar";
import { TasksPageHeader } from "@/components/tasks/TasksPageHeader";
import { TaskView } from "@/components/tasks/TaskView";
import {
  TaskFilterMember,
  TaskList,
  ViewMode,
} from "@/components/tasks/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { apiClient } from "@/lib/api-client";
import { useEffect, useMemo, useState } from "react";

type MembersResponse = {
  success: boolean;
  users?: TaskFilterMember[];
};

export default function TasksPage() {
  const { isAdmin, isManager } = useAuth();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [members, setMembers] = useState<TaskFilterMember[]>([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [taskListFilter, setTaskListFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = localStorage.getItem("tasks-view-mode") as ViewMode | null;
    return saved && (["card", "table", "board"] as ViewMode[]).includes(saved)
      ? saved
      : "card";
  });
  const canFilterByMember = isAdmin || isManager;
  const effectiveMemberFilter = useMemo(
    () =>
      canFilterByMember &&
      memberFilter !== "all" &&
      members.some((member) => member._id === memberFilter)
        ? memberFilter
        : "all",
    [canFilterByMember, memberFilter, members],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        filter !== "all",
        statusFilter !== "all",
        priorityFilter !== "all",
        taskListFilter !== "all",
        canFilterByMember && effectiveMemberFilter !== "all",
        debouncedSearch.trim().length > 0,
      ].filter(Boolean).length,
    [
      canFilterByMember,
      debouncedSearch,
      effectiveMemberFilter,
      filter,
      priorityFilter,
      statusFilter,
      taskListFilter,
    ],
  );

  const { tasks, loading, pagination } = useTasks({
    filter,
    status: statusFilter,
    priority: priorityFilter,
    taskList: taskListFilter,
    assignedTo: canFilterByMember ? effectiveMemberFilter : undefined,
    search: debouncedSearch,
    // Board view loads all tasks — omit page to bypass pagination
    page: viewMode !== "board" ? searchPage : undefined,
  });

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchPage(1);
    localStorage.setItem("tasks-view-mode", mode);
  };

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

  useEffect(() => {
    if (!canFilterByMember) return;

    const endpoint = isManager ? "/api/users/assignable" : "/api/users";

    apiClient
      .get<MembersResponse>(endpoint)
      .then((res) =>
        setMembers(
          (res.users ?? []).filter(
            (member) => member.isActive !== false && member.name?.trim(),
          ),
        ),
      )
      .catch((err) => console.error("Failed to fetch member filters:", err));
  }, [canFilterByMember, isManager]);

  return (
    <div className="space-y-6">
      <TasksPageHeader />
      <TaskSearchBar
        searchQuery={searchQuery}
        viewMode={viewMode}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setSearchPage(1);
        }}
        onViewChange={handleViewChange}
      />
      <TaskFilters
        filter={filter}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        taskListFilter={taskListFilter}
        memberFilter={effectiveMemberFilter}
        taskLists={taskLists}
        members={members}
        isAdmin={isAdmin}
        canFilterByMember={canFilterByMember}
        activeFilterCount={activeFilterCount}
        onFilterChange={(v) => {
          setFilter(v);
          setSearchPage(1);
        }}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setSearchPage(1);
        }}
        onPriorityChange={(v) => {
          setPriorityFilter(v);
          setSearchPage(1);
        }}
        onTaskListChange={(v) => {
          setTaskListFilter(v);
          setSearchPage(1);
        }}
        onMemberChange={(v) => {
          setMemberFilter(v);
          setSearchPage(1);
        }}
        onClearFilters={() => {
          setFilter("all");
          setStatusFilter("all");
          setPriorityFilter("all");
          setTaskListFilter("all");
          setMemberFilter("all");
          setSearchQuery("");
          setDebouncedSearch("");
          setSearchPage(1);
        }}
      />
      <TaskView
        tasks={tasks}
        loading={loading}
        viewMode={viewMode}
        searchQuery={debouncedSearch}
        isAdmin={isAdmin}
      />
      {viewMode !== "board" && pagination && pagination.totalPages > 1 && (
        <TaskPagination pagination={pagination} onPageChange={setSearchPage} />
      )}
    </div>
  );
}

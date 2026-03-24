"use client";

import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskPagination } from "@/components/tasks/TaskPagination";
import { TaskSearchBar } from "@/components/tasks/TaskSearchBar";
import { TaskView } from "@/components/tasks/TaskView";
import { TaskFilterMember, TaskList, ViewMode } from "@/components/tasks/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type MembersResponse = {
  success: boolean;
  users?: TaskFilterMember[];
};

export default function CompanyDetailPage() {
  const { isAdmin, isManager } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<TaskList | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [members, setMembers] = useState<TaskFilterMember[]>([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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
    ],
  );

  const { tasks, loading, pagination } = useTasks({
    filter,
    status: statusFilter,
    priority: priorityFilter,
    taskList: companyId,
    assignedTo: canFilterByMember ? effectiveMemberFilter : undefined,
    search: debouncedSearch,
    page: viewMode !== "board" ? searchPage : undefined,
    limit: pageSize,
  });

  useEffect(() => {
    if (!isAdmin && !isManager) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isManager, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!companyId) return;

    setCompanyLoading(true);
    apiClient
      .get<{ success: boolean; taskList: TaskList }>(`/api/task-lists/${companyId}`)
      .then((res) => setCompany(res.taskList))
      .catch(() => toast.error("Failed to load company details"))
      .finally(() => setCompanyLoading(false));
  }, [companyId]);

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
      .catch((error) => console.error("Failed to fetch member filters:", error));
  }, [canFilterByMember, isManager]);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchPage(1);
    localStorage.setItem("tasks-view-mode", mode);
  };

  const totalTasks = pagination?.total ?? tasks.length;
  const isLoading = companyLoading || loading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/companies">
          <Button variant="ghost" size="sm" className="-ml-2 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>

        <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 bg-linear-to-br from-primary/8 via-background to-background px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {company && (
                <span
                  className="h-11 w-11 shrink-0 rounded-2xl border border-border/60 shadow-sm"
                  style={{ backgroundColor: company.color }}
                />
              )}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {companyLoading ? "Loading company..." : company?.name ?? "Company"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {company?.description?.trim() || "Review work currently tracked for this company."}
                </p>
                {!isLoading && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <Link href={`/dashboard/tasks/new${companyId ? `?taskList=${companyId}` : ""}`}>
              <Button className="h-11 rounded-2xl px-5 shadow-sm cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Link>
          </div>
        </section>
      </div>

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
        taskListFilter={companyId}
        memberFilter={effectiveMemberFilter}
        taskLists={company ? [company] : []}
        members={members}
        isAdmin={isAdmin}
        canFilterByMember={canFilterByMember}
        activeFilterCount={activeFilterCount}
        hideTaskListFilter
        onFilterChange={(value) => {
          setFilter(value);
          setSearchPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setSearchPage(1);
        }}
        onPriorityChange={(value) => {
          setPriorityFilter(value);
          setSearchPage(1);
        }}
        onTaskListChange={() => undefined}
        onMemberChange={(value) => {
          setMemberFilter(value);
          setSearchPage(1);
        }}
        onClearFilters={() => {
          setFilter("all");
          setStatusFilter("all");
          setPriorityFilter("all");
          setMemberFilter("all");
          setSearchQuery("");
          setDebouncedSearch("");
          setSearchPage(1);
        }}
      />

      <TaskView
        tasks={tasks}
        loading={isLoading}
        viewMode={viewMode}
        searchQuery={debouncedSearch}
        isAdmin={isAdmin}
      />

      {viewMode !== "board" && pagination && pagination.total > 0 && (
        <TaskPagination
          pagination={pagination}
          onPageChange={setSearchPage}
          onLimitChange={(size) => {
            setPageSize(size);
            setSearchPage(1);
          }}
        />
      )}
    </div>
  );
}

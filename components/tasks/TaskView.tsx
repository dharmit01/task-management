import { Button } from "@/components/ui/button";
import { Inbox, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { TaskBoardView } from "./TaskBoardView";
import { TaskCardView } from "./TaskCardView";
import { TaskTableView } from "./TaskTableView";
import { Task, ViewMode } from "./types";

/* ─── Skeleton shapes ──────────────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-4xl border border-border/40 bg-muted/20">
      <div className="border-b border-border/40 bg-muted/30 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 w-3/4 rounded-full bg-muted/60" />
          <div className="h-4 w-12 rounded-full bg-muted/40" />
        </div>
        <div className="mt-3 flex gap-1.5">
          <div className="h-5 w-20 rounded-full bg-muted/50" />
          <div className="h-5 w-16 rounded-full bg-muted/40" />
        </div>
      </div>
      <div className="px-5 py-3.5 space-y-2">
        <div className="h-4 w-full rounded-full bg-muted/40" />
        <div className="h-4 w-2/3 rounded-full bg-muted/30" />
      </div>
      <div className="flex items-center gap-5 px-5 pb-5">
        <div className="h-3 w-24 rounded-full bg-muted/40" />
        <div className="flex gap-1">
          <div className="h-5 w-5 rounded-full bg-muted/50" />
          <div className="h-5 w-5 rounded-full bg-muted/40" />
        </div>
        <div className="ml-auto h-3 w-28 rounded-full bg-muted/35" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  const cols = [9, 28, 12, 12, 15, 14, 10];
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="animate-pulse p-6 space-y-4">
        <div className="flex gap-4 pb-3 border-b border-border/50">
          {cols.map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-muted/60"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            {cols.map((w, j) => (
              <div
                key={j}
                className="h-4 rounded-full bg-muted/30"
                style={{ width: `${w}%`, opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="shrink-0 w-72 animate-pulse space-y-2.5">
          <div className="h-11 rounded-2xl bg-muted/40" />
          {[...Array(i % 2 === 0 ? 3 : 2)].map((_, j) => (
            <div
              key={j}
              className="h-28 rounded-2xl bg-muted/25"
              style={{ opacity: 1 - j * 0.2 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────── */

interface TaskViewProps {
  tasks: Task[];
  loading: boolean;
  viewMode: ViewMode;
  searchQuery: string;
  isAdmin: boolean;
}

export function TaskView({
  tasks,
  loading,
  viewMode,
  searchQuery,
  isAdmin,
}: TaskViewProps) {
  /* Loading skeletons */
  if (loading) {
    if (viewMode === "table") return <TableSkeleton />;
    if (viewMode === "board") return <BoardSkeleton />;
    return (
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  /* Empty state */
  if (tasks.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.15)]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-64 rounded-full bg-primary/4 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 bg-linear-to-br from-primary/4 via-background to-background px-8 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 shadow-sm">
            {searchQuery ? (
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
            ) : (
              <ListTodo className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-semibold tracking-tight">
              {searchQuery ? "No matching tasks" : "No tasks yet"}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {searchQuery
                ? `No tasks found matching "${searchQuery}". Try adjusting your search or clearing filters.`
                : isAdmin
                  ? "Get started by creating your first task and assigning it to your team."
                  : "No tasks have been assigned to you yet. Check back later."}
            </p>
          </div>
          {isAdmin && !searchQuery && (
            <Link href="/dashboard/tasks/new">
              <Button className="mt-1 h-10 rounded-2xl px-6 shadow-sm cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (viewMode === "card") return <TaskCardView tasks={tasks} />;
  if (viewMode === "table") return <TaskTableView tasks={tasks} />;
  return <TaskBoardView tasks={tasks} />;
}

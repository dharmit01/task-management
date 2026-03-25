import { Badge } from "@/components/ui/badge";
import { CalendarDays, Inbox } from "lucide-react";
import Link from "next/link";
import { getPriorityColor, isTaskOverdue, STATUSES } from "./task-utils";
import { Task } from "./types";

/* ── Status visual config ───────────────────────────────────────────── */
const STATUS_META: Record<
  string,
  { color: string; gradFrom: string; ringClass: string; textClass: string }
> = {
  ToDo: {
    color: "#64748b",
    gradFrom: "from-slate-500/8",
    ringClass: "ring-slate-400/40",
    textClass: "text-slate-600 dark:text-slate-400",
  },
  "In-Progress": {
    color: "#3b82f6",
    gradFrom: "from-blue-500/8",
    ringClass: "ring-blue-400/40",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  Blocked: {
    color: "#ef4444",
    gradFrom: "from-red-500/8",
    ringClass: "ring-red-400/40",
    textClass: "text-red-600 dark:text-red-400",
  },
  "In-Review": {
    color: "#8b5cf6",
    gradFrom: "from-violet-500/8",
    ringClass: "ring-violet-400/40",
    textClass: "text-violet-600 dark:text-violet-400",
  },
  Completed: {
    color: "#22c55e",
    gradFrom: "from-green-500/8",
    ringClass: "ring-green-400/40",
    textClass: "text-green-600 dark:text-green-400",
  },
};

function AssigneeAvatars({ assignedTo }: { assignedTo: Task["assignedTo"] }) {
  if (!assignedTo || assignedTo.length === 0) return null;
  const visible = assignedTo.slice(0, 3);
  const overflow = assignedTo.length - 3;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {visible.map((a) => (
          <div
            key={a._id}
            title={a.name}
            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-[9px] font-bold text-primary ring-1 ring-border/50"
          >
            {a.name[0]?.toUpperCase()}
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground ring-1 ring-border/50">
            +{overflow}
          </div>
        )}
      </div>
      <span className="truncate text-xs text-muted-foreground">
        {assignedTo.length === 1
          ? assignedTo[0].name
          : `${assignedTo.length} members`}
      </span>
    </div>
  );
}

export function TaskBoardView({ tasks }: { tasks: Task[] }) {
  const tasksByStatus = STATUSES.reduce<Record<string, Task[]>>(
    (acc, { key }) => {
      acc[key] = tasks.filter((t) => t.status === key);
      return acc;
    },
    {},
  );

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4 min-h-[28rem]">
      {STATUSES.map(({ key, label }) => {
        const meta = STATUS_META[key] ?? {
          color: "#6366f1",
          gradFrom: "from-primary/8",
          ringClass: "ring-primary/30",
          textClass: "text-primary",
        };
        const columnTasks = tasksByStatus[key];

        return (
          <div key={key} className="shrink-0 w-72 flex flex-col gap-2.5">
            {/* ── Column header ──────────────────────────────── */}
            <div
              className={`relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br ${meta.gradFrom} via-background to-background shadow-sm`}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${meta.color}55, transparent)`,
                }}
              />
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm font-semibold tracking-tight">
                    {label}
                  </span>
                </div>
                <span
                  className={`rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ${meta.ringClass} ${meta.textClass}`}
                >
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* ── Task cards ─────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => {
                const overdue = isTaskOverdue(task.endDate, task.status);
                const accentColor = task.taskList?.color || "#6366f1";

                return (
                  <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
                    <article
                      className="group relative overflow-hidden rounded-2xl border border-l-[3px] border-border/60 bg-background/95 shadow-[0_2px_14px_-6px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-px hover:border-border hover:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.32)] cursor-pointer"
                      style={{ borderLeftColor: accentColor }}
                    >
                      {/* Top shimmer */}
                      <div
                        className="absolute inset-x-0 top-0 h-px opacity-60"
                        style={{
                          background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)`,
                        }}
                      />
                      {/* Hover glow blob */}
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ backgroundColor: `${accentColor}18` }}
                      />

                      <div className="relative space-y-3 px-4 py-3.5">
                        {/* Title + Task ID */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                            {task.title}
                          </p>
                          {task.taskId && (
                            <span className="shrink-0 pt-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/40">
                              {task.taskId}
                            </span>
                          )}
                        </div>

                        {/* Priority + Overdue badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            className={getPriorityColor(task.priority)}
                            variant="outline"
                          >
                            {task.priority}
                          </Badge>
                          {overdue && (
                            <Badge
                              variant="destructive"
                              className="px-1.5 text-[10px] font-semibold uppercase tracking-wider"
                            >
                              Overdue
                            </Badge>
                          )}
                        </div>

                        {/* Assignee avatars */}
                        <AssigneeAvatars assignedTo={task.assignedTo} />

                        {/* Footer: list name + due date */}
                        <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <div
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span className="truncate text-xs font-medium text-muted-foreground/80">
                              {task.taskList?.name || "No List"}
                            </span>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-muted-foreground/50" />
                            <span
                              className={`text-xs ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}
                            >
                              {new Date(task.endDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}

              {/* Empty column placeholder */}
              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border/35 py-10 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border/50">
                    <Inbox className="h-4 w-4 text-muted-foreground/35" />
                  </div>
                  <span className="text-xs text-muted-foreground/45">
                    No tasks here
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { CalendarDays, User2 } from "lucide-react";
import Link from "next/link";
import { getPriorityColor, getStatusColor, isTaskOverdue } from "./task-utils";
import { Task } from "./types";

function AssigneeAvatars({ assignedTo }: { assignedTo: Task["assignedTo"] }) {
  if (!assignedTo || assignedTo.length === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <User2 className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="text-xs italic text-muted-foreground/40">
          Unassigned
        </span>
      </div>
    );
  }

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
      <span className="text-xs text-muted-foreground">
        {assignedTo.length === 1
          ? assignedTo[0].name
          : `${assignedTo.length} assignees`}
      </span>
    </div>
  );
}

export function TaskCardView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-3">
      {tasks.map((task) => {
        const overdue = isTaskOverdue(task.endDate, task.status);
        const accentColor = task.taskList?.color || "#6366f1";

        return (
          <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
            <article
              className="group relative overflow-hidden rounded-4xl border border-l-4 border-border/70 bg-background/95 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-px hover:border-border hover:shadow-[0_16px_48px_-12px_rgba(15,23,42,0.38)]"
              style={{ borderLeftColor: accentColor }}
            >
              {/* Top shimmer line using task list colour */}
              <div
                className="absolute inset-x-0 top-0 h-px opacity-70"
                style={{
                  background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)`,
                }}
              />

              {/* Ambient hover glow blob */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ backgroundColor: `${accentColor}18` }}
              />

              {/* ── Header ───────────────────────────────────────── */}
              <div
                className={`relative border-b border-border/50 px-5 pb-4 pt-5 ${
                  overdue
                    ? "bg-linear-to-br from-destructive/5 via-background to-background"
                    : "bg-linear-to-br from-primary/5 via-background to-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-snug tracking-tight text-foreground">
                    {task.title}
                  </h3>
                  {task.taskId && (
                    <span className="shrink-0 self-start rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground/55">
                      {task.taskId}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                  <Badge
                    className={getPriorityColor(task.priority)}
                    variant="outline"
                  >
                    {task.priority}
                  </Badge>
                  {overdue && (
                    <Badge
                      variant="destructive"
                      className="px-2 text-[11px] font-semibold uppercase tracking-widest"
                    >
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>

              {/* ── Description ──────────────────────────────────── */}
              <div className="px-5 py-3.5">
                {task.description ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/35">
                    No description provided.
                  </p>
                )}
              </div>

              {/* ── Footer meta row ───────────────────────────────── */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 pb-5">
                {/* Company pill */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                    style={{
                      backgroundColor: task.taskList?.color || "#94a3b8",
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {task.taskList?.name || "No List"}
                  </span>
                </div>

                {/* Assignee avatars */}
                <AssigneeAvatars assignedTo={task.assignedTo} />

                {/* Date range — pushed to the right */}
                <div className="ml-auto flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {" – "}
                    {new Date(task.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}

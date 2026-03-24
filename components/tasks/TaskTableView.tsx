import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { getPriorityColor, getStatusColor, isTaskOverdue } from "./task-utils";
import { Task } from "./types";

function AssigneeAvatars({ assignedTo }: { assignedTo: Task["assignedTo"] }) {
  if (!assignedTo || assignedTo.length === 0) {
    return (
      <span className="text-xs italic text-muted-foreground/40">
        Unassigned
      </span>
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
          : `${assignedTo.length} members`}
      </span>
    </div>
  );
}

export function TaskTableView({ tasks }: { tasks: Task[] }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      {/* Ambient glow */}
      <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      {/* Single table — header + body share the same column layout */}
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-linear-to-br from-primary/8 via-background to-background hover:bg-transparent">
              <TableHead className="w-[9%] pl-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Task ID
              </TableHead>
              <TableHead className="w-[28%] text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Title
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Priority
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Company
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Assignees
              </TableHead>
              <TableHead className="pr-5 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Due Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task.endDate, task.status);
              const accentColor = task.taskList?.color || "#6366f1";

              return (
                <TableRow
                  key={task._id}
                  className="group border-border/50 transition-colors duration-150 hover:bg-muted/40"
                >
                  {/* Task ID */}
                  <TableCell className="pl-5">
                    <Link
                      href={`/dashboard/tasks/${task._id}`}
                      className="block"
                    >
                      <span className="rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground/55 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary/70">
                        {task.taskId}
                      </span>
                    </Link>
                  </TableCell>

                  {/* Title */}
                  <TableCell>
                    <Link
                      href={`/dashboard/tasks/${task._id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className="mt-1 h-3.5 w-0.5 shrink-0 rounded-full opacity-70"
                          style={{ backgroundColor: accentColor }}
                        />
                        <div className="min-w-0">
                          <span className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            {task.title}
                          </span>
                          {overdue && (
                            <Badge
                              variant="destructive"
                              className="mt-1 px-1.5 text-[10px] font-semibold uppercase tracking-widest"
                            >
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge
                      className={getPriorityColor(task.priority)}
                      variant="outline"
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>

                  {/* Company */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {task.taskList?.name || "—"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Assignees */}
                  <TableCell>
                    <AssigneeAvatars assignedTo={task.assignedTo} />
                  </TableCell>

                  {/* Due Date */}
                  <TableCell className="pr-5 text-right">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                        overdue
                          ? "border-destructive/30 bg-destructive/8 text-destructive"
                          : "border-border/50 bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <CalendarDays className="h-3 w-3 opacity-70" />
                      {new Date(task.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

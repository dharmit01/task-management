import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ListTodo, User2 } from "lucide-react";
import Link from "next/link";
import { getPriorityColor, isTaskOverdue, STATUSES } from "./task-utils";
import { Task } from "./types";

export function TaskBoardView({ tasks }: { tasks: Task[] }) {
  const tasksByStatus = STATUSES.reduce<Record<string, Task[]>>(
    (acc, { key }) => {
      acc[key] = tasks.filter((t) => t.status === key);
      return acc;
    },
    {},
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-100">
      {STATUSES.map(({ key, label }) => (
        <div key={key} className="shrink-0 w-72">
          <div className="flex items-center justify-between mb-3 px-3 py-2 bg-card rounded-lg border">
            <span className="font-semibold text-sm">{label}</span>
            <Badge variant="secondary">{tasksByStatus[key].length}</Badge>
          </div>
          <div className="space-y-2">
            {tasksByStatus[key].map((task) => (
              <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
                <Card
                  className="hover:shadow-md transition-all border-l-4 cursor-pointer mb-4"
                  style={{ borderLeftColor: task.taskList?.color || "#3b82f6" }}
                >
                  <CardContent className="px-3 space-y-2">
                    <p className="font-medium text-sm mb-2 line-clamp-2">
                      {task.title}
                    </p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      <Badge
                        className={`${getPriorityColor(task.priority)} text-[10px] px-1.5 py-0`}
                        variant="outline"
                      >
                        {task.priority}
                      </Badge>
                      {isTaskOverdue(task.endDate, task.status) && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Overdue
                        </Badge>
                      )}
                    </div>
                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <User2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {task.assignedTo.map((a) => a.name).join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {new Date(task.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <ListTodo
                        className="h-4 w-4"
                        style={{ color: task.taskList?.color }}
                      />
                      <span className="font-medium">
                        {task.taskList?.name || "No List"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {tasksByStatus[key].length === 0 && (
              <div className="text-center p-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ListTodo, User2 } from "lucide-react";
import Link from "next/link";
import { getPriorityColor, getStatusColor, isTaskOverdue } from "./task-utils";
import { Task } from "./types";

export function TaskCardView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
          <Card
            className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary"
            style={{ borderLeftColor: task.taskList?.color || "#3b82f6" }}
          >
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge
                          className={getPriorityColor(task.priority)}
                          variant="outline"
                        >
                          {task.priority}
                        </Badge>
                        {isTaskOverdue(task.endDate, task.status) && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <ListTodo
                        className="h-4 w-4"
                        style={{ color: task.taskList?.color }}
                      />
                      <span className="font-medium">
                        {task.taskList?.name || "No List"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User2 className="h-4 w-4" />
                      <span>
                        {task.assignedTo && task.assignedTo.length > 0
                          ? task.assignedTo.map((a) => a.name).join(", ")
                          : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      <span>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

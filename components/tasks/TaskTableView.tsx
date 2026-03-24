import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { getPriorityColor, getStatusColor, isTaskOverdue } from "./task-utils";
import { Task } from "./types";

export function TaskTableView({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10%] pl-4">Task Id</TableHead>
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Company Name</TableHead>
            <TableHead>Assignees</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task._id}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="pl-4">
                <Link href={`/dashboard/tasks/${task._id}`} className="block">
                  <span className="font-medium hover:underline line-clamp-1">
                    {task.taskId}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/tasks/${task._id}`} className="block">
                  <span className="font-medium hover:underline line-clamp-1">
                    {task.title}
                  </span>
                  {isTaskOverdue(task.endDate, task.status) && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Overdue
                    </Badge>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={getPriorityColor(task.priority)}
                  variant="outline"
                >
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: task.taskList?.color || "#3b82f6",
                    }}
                  />
                  {task.taskList?.name || "-"}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {task.assignedTo && task.assignedTo.length > 0
                  ? task.assignedTo.map((a) => a.name).join(", ")
                  : "Unassigned"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(task.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

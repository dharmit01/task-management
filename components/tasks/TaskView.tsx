import { Card, CardContent } from "@/components/ui/card";
import { TaskBoardView } from "./TaskBoardView";
import { TaskCardView } from "./TaskCardView";
import { TaskTableView } from "./TaskTableView";
import { Task, ViewMode } from "./types";

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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500 dark:text-gray-400">
            {searchQuery
              ? `No tasks found matching "${searchQuery}".`
              : `No tasks found. ${isAdmin ? "Create your first task to get started!" : ""}`}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === "card") return <TaskCardView tasks={tasks} />;
  if (viewMode === "table") return <TaskTableView tasks={tasks} />;
  return <TaskBoardView tasks={tasks} />;
}

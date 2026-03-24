import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function TasksPageHeader() {
  return (
    <div className="flex items-center justify-between p-6 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-blue-500/20">
      <div>
        <h1 className="text-4xl font-bold bg-linear-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Tasks
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage and track your tasks ✨
        </p>
      </div>
      <Link href="/dashboard/tasks/new">
        <Button
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Task
        </Button>
      </Link>
    </div>
  );
}

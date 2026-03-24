import { Button } from "@/components/ui/button";
import { ListTodo, Plus } from "lucide-react";
import Link from "next/link";

export function TasksPageHeader() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 bg-linear-to-br from-primary/8 via-background to-background px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your tasks
            </p>
          </div>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button className="h-11 rounded-2xl px-5 shadow-sm cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>
    </section>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { apiClient } from "@/lib/api-client";
import { APIResponse } from "@/lib/utils";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStatusColor } from "./tasks/task-utils";
import { Task } from "./tasks/types";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Task[]>([]);
  const [members, setMembers] = useState<
    {
      _id: string;
      name: string;
      username?: string;
      role?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Register Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search against /api/tasks
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setMembers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [tasksRes, usersRes] = await Promise.all([
          apiClient.get<APIResponse<Task[]>>(
            `/api/tasks?search=${encodeURIComponent(query.trim())}`,
          ),
          apiClient.get<any>(
            `/api/users/search?search=${encodeURIComponent(query.trim())}`,
          ),
        ]);

        setResults(tasksRes.data ?? []);
        setMembers(usersRes.users ?? []);
      } catch {
        setResults([]);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (taskId: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/dashboard/tasks/${taskId}`);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setQuery("");
      setResults([]);
    }
  };

  return (
    <>
      <Button
        className="rounded-xl border border-border/70 bg-card/75 p-2.5 w-full text-gray-600 h-12 cursor-pointer hover:bg-blue-50 hover:border-blue-300"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left text-sm">
          Search tasks or members…
        </span>
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        className="h-150 min-w-[40%]"
        open={open}
        onOpenChange={handleOpenChange}
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search tasks by title/description or members by name…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="min-h-full pb-14">
          {/* No query yet */}
          {!query.trim() && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type to search tasks or members.
            </div>
          )}
          {/* Loading */}
          {query.trim() && loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}
          {/* No results (both) */}
          {query.trim() &&
            !loading &&
            results.length === 0 &&
            members.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;.
              </div>
            )}
          {/* Results */}
          {query.trim() && !loading && results.length > 0 && (
            <CommandGroup heading={`Tasks (${results.length})`}>
              {results.map((task) => (
                <CommandItem
                  key={task._id}
                  value={task._id}
                  onSelect={() => handleSelect(task._id)}
                  className="flex flex-col items-start gap-1 cursor-pointer"
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="flex-1 font-medium text-sm truncate">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`${getStatusColor(task.status)} text-xs`}
                      >
                        {task.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 w-full">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 border-gray-200 bg-gray-50 border px-2 py-1 rounded-2xl mt-1">
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
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query.trim() && !loading && members.length > 0 && (
            <CommandGroup heading={`Members (${members.length})`}>
              {members.map((m) => (
                <CommandItem
                  key={m._id}
                  value={m._id}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    setResults([]);
                    setMembers([]);
                    router.push(`/dashboard/members/${m._id}`);
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{m.name}</span>
                      {m.username && (
                        <span className="text-xs text-muted-foreground">
                          @{m.username}
                        </span>
                      )}
                    </div>
                    <Badge className="text-xs">{m.role}</Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

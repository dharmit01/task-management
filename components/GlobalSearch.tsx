'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { apiClient } from '@/lib/api-client';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TaskResult {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'In-Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Blocked':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'In-Review':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaskResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Register Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search against /api/tasks
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ success: boolean; tasks: TaskResult[] }>(
          `/api/tasks?search=${encodeURIComponent(query.trim())}`
        );
        setResults((res.tasks ?? []).slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (taskId: string) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/dashboard/tasks/${taskId}`);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setQuery('');
      setResults([]);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 mb-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left text-sm">Search tasks…</span>
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
        <CommandInput
          placeholder="Search tasks by title or description…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* No query yet */}
          {!query.trim() && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type to search tasks by title or description.
            </div>
          )}
          {/* Loading */}
          {query.trim() && loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
          )}
          {/* No results */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tasks found for &quot;{query}&quot;.
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
                    <span className="flex-1 font-medium text-sm truncate">{task.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${getStatusColor(task.status)} text-xs`}>{task.status}</Badge>
                      <span className="text-xs text-muted-foreground">{task.priority}</span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 w-full">
                      {task.description}
                    </p>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

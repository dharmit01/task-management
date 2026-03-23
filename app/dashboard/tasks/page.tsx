'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { CalendarDays, ChevronsUpDown, Columns2, Filter, LayoutGrid, List, ListTodo, Plus, Search, User2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface TaskList {
  _id: string;
  name: string;
  color: string;
}

interface Task {
  _id: string;
  taskId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: string;
  status: string;
  taskList: TaskList;
  assignedTo?: {
    _id: string;
    name: string;
  }[];
}

type ViewMode = 'card' | 'table' | 'board';

const STATUSES: { key: string; label: string }[] = [
  { key: 'ToDo', label: 'To Do' },
  { key: 'In-Progress', label: 'In Progress' },
  { key: 'Blocked', label: 'Blocked' },
  { key: 'In-Review', label: 'In Review' },
  { key: 'Completed', label: 'Completed' },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'Critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
    case 'High':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
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

function isTaskOverdue(endDate: string, status: string) {
  return new Date(endDate) < new Date() && status !== 'Completed';
}

// ── Card View ──────────────────────────────────────────────────────────────────
function TaskCardView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
          <Card
            className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary"
            style={{ borderLeftColor: task.taskList?.color || '#3b82f6' }}
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
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                          {task.priority}
                        </Badge>
                        {isTaskOverdue(task.endDate, task.status) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{task.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <ListTodo className="h-4 w-4" style={{ color: task.taskList?.color }} />
                      <span className="font-medium">{task.taskList?.name || 'No List'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User2 className="h-4 w-4" />
                      <span>
                        {task.assignedTo && task.assignedTo.length > 0
                          ? task.assignedTo.map((a) => a.name).join(', ')
                          : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

// ── Table View ─────────────────────────────────────────────────────────────────
function TaskTableView({ tasks }: { tasks: Task[] }) {
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
            <TableRow key={task._id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className='pl-4'>
                <Link href={`/dashboard/tasks/${task._id}`} className="block">
                  <span className="font-medium hover:underline line-clamp-1">{task.taskId}</span>
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/tasks/${task._id}`} className="block">
                  <span className="font-medium hover:underline line-clamp-1">{task.title}</span>
                  {isTaskOverdue(task.endDate, task.status) && (
                    <Badge variant="destructive" className="text-xs mt-1">Overdue</Badge>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(task.priority)} variant="outline">
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.taskList?.color || '#3b82f6' }}
                  />
                  {task.taskList?.name || 'No List'}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {task.assignedTo && task.assignedTo.length > 0
                  ? task.assignedTo.map((a) => a.name).join(', ')
                  : 'Unassigned'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(task.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ── Board View ─────────────────────────────────────────────────────────────────
function TaskBoardView({ tasks }: { tasks: Task[] }) {
  const tasksByStatus = STATUSES.reduce<Record<string, Task[]>>((acc, { key }) => {
    acc[key] = tasks.filter((t) => t.status === key);
    return acc;
  }, {});

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
                  style={{ borderLeftColor: task.taskList?.color || '#3b82f6' }}
                >
                  <CardContent className="px-3 space-y-2">
                    <p className="font-medium text-sm mb-2 line-clamp-2">{task.title}</p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      <Badge
                        className={`${getPriorityColor(task.priority)} text-[10px] px-1.5 py-0`}
                        variant="outline"
                      >
                        {task.priority}
                      </Badge>
                      {isTaskOverdue(task.endDate, task.status) && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <User2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {task.assignedTo.map((a) => a.name).join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {new Date(task.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <ListTodo className="h-4 w-4" style={{ color: task.taskList?.color }} />
                        <span className="font-medium">{task.taskList?.name || 'No List'}</span>
                      </div>
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

// ── Page ───────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskListFilter, setTaskListFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [companyComboOpen, setCompanyComboOpen] = useState(false);

  // Restore persisted view preference
  useEffect(() => {
    const saved = localStorage.getItem('tasks-view-mode') as ViewMode | null;
    if (saved && ['card', 'table', 'board'].includes(saved)) setViewMode(saved);
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('tasks-view-mode', mode);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTaskLists();
  }, []);

  const fetchTaskLists = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; taskLists: TaskList[] }>('/api/task-lists');
      setTaskLists(response.taskLists || []);
    } catch (error) {
      console.error('Failed to fetch company lists:', error);
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filter !== 'all') queryParams.append('filter', filter);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (priorityFilter !== 'all') queryParams.append('priority', priorityFilter);
      if (taskListFilter !== 'all') queryParams.append('taskList', taskListFilter);
      if (debouncedSearch.trim()) queryParams.append('search', debouncedSearch.trim());

      const response = await apiClient.get<{ success: boolean; tasks: Task[] }>(
        `/api/tasks?${queryParams.toString()}`
      );
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, priorityFilter, taskListFilter, debouncedSearch]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <Plus className="mr-2 h-5 w-5" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tasks by title or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 hover:bg-indigo-200 hover:text-black cursor-pointer"
            onClick={() => handleViewChange('card')}
            title="Card View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 hover:bg-indigo-200 hover:text-black cursor-pointer"
            onClick={() => handleViewChange('table')}
            title="Table View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 hover:bg-indigo-200 hover:text-black cursor-pointer"
            onClick={() => handleViewChange('board')}
            title="Board View"
          >
            <Columns2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-2 hover-lift rounded-lg">
        <div className="bg-linear-to-r from-primary/5 to-accent/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            Filters
          </div>
          <div>Filter tasks by various criteria</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
          <div>
            <label className="text-sm font-medium mb-2 block">View</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="today">Today&apos;s Tasks</SelectItem>
                <SelectItem value="overdue">Overdue Tasks</SelectItem>
                <SelectItem value="high-priority">High Priority</SelectItem>
                {isAdmin && <SelectItem value="unassigned">Unassigned Tasks</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Company Name</label>
            <Popover open={companyComboOpen} onOpenChange={setCompanyComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companyComboOpen}
                  className="w-full justify-between font-normal hover:bg-transparent hover:text-black"
                >
                  <span className="truncate">
                    {taskListFilter !== 'all'
                      ? taskLists.find((l) => l._id === taskListFilter)?.name
                      : 'All Companies'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <Command>
                  <CommandInput placeholder="Search company..." />
                  <CommandList>
                    <CommandEmpty>No company found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setTaskListFilter('all');
                          setCompanyComboOpen(false);
                        }}
                      >
                        All Companies
                      </CommandItem>
                      {taskLists.map((list) => (
                        <CommandItem
                          key={list._id}
                          value={list.name}
                          onSelect={() => {
                            setTaskListFilter(list._id);
                            setCompanyComboOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: list.color }}
                            />
                            {list.name}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ToDo">To Do</SelectItem>
                <SelectItem value="In-Progress">In Progress</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="In-Review">In Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
                setTaskListFilter('all');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500 dark:text-gray-400">
              {debouncedSearch
                ? `No tasks found matching "${debouncedSearch}".`
                : `No tasks found. ${isAdmin ? 'Create your first task to get started!' : ''}`}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <TaskCardView tasks={tasks} />
      ) : viewMode === 'table' ? (
        <TaskTableView tasks={tasks} />
      ) : (
        <TaskBoardView tasks={tasks} />
      )}
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
    ArrowLeft,
    CalendarDays,
    Columns2,
    LayoutGrid,
    List,
    ListTodo,
    Plus,
    Search,
    User2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Shared types & helpers
// ─────────────────────────────────────────────────────────────────────────────
interface TaskList {
    _id: string;
    name: string;
    color: string;
    description?: string;
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
    assignedTo?: { _id: string; name: string }[];
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
        case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
        case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'In-Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'Blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'In-Review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
}

function isTaskOverdue(endDate: string, status: string) {
    return new Date(endDate) < new Date() && status !== 'Completed';
}

// ─────────────────────────────────────────────────────────────────────────────
// Card View
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Table View
// ─────────────────────────────────────────────────────────────────────────────
function TaskTableView({ tasks }: { tasks: Task[] }) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[10%] pl-4">Task ID</TableHead>
                        <TableHead className="w-[35%]">Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assignees</TableHead>
                        <TableHead>Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task._id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="pl-4">
                                <Link href={`/dashboard/tasks/${task._id}`} className="block">
                                    <span className="font-medium hover:underline">{task.taskId}</span>
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
                            <TableCell className="text-sm text-muted-foreground">
                                {task.assignedTo && task.assignedTo.length > 0
                                    ? task.assignedTo.map((a) => a.name).join(', ')
                                    : 'Unassigned'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(task.endDate).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Board View
// ─────────────────────────────────────────────────────────────────────────────
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
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <CalendarDays className="h-3 w-3 shrink-0" />
                                            {new Date(task.endDate).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                            })}
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

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
    const { isAdmin, isManager } = useAuth();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const companyId = params.id;

    // Guard: only Admin/Manager
    useEffect(() => {
        if (!isAdmin && !isManager) {
            router.replace('/dashboard');
        }
    }, [isAdmin, isManager, router]);

    const [company, setCompany] = useState<TaskList | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyLoading, setCompanyLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('card');

    // Restore persisted view preference (separate key from main tasks page)
    useEffect(() => {
        const saved = localStorage.getItem('company-detail-view-mode') as ViewMode | null;
        if (saved && ['card', 'table', 'board'].includes(saved)) setViewMode(saved);
    }, []);

    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('company-detail-view-mode', mode);
    };

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Fetch company details
    useEffect(() => {
        if (!companyId) return;
        setCompanyLoading(true);
        apiClient
            .get<{ success: boolean; taskList: TaskList }>(`/api/task-lists/${companyId}`)
            .then((res) => setCompany(res.taskList))
            .catch(() => toast.error('Failed to load company details'))
            .finally(() => setCompanyLoading(false));
    }, [companyId]);

    // Fetch tasks filtered to this company
    const fetchTasks = useCallback(async () => {
        if (!companyId) return;
        try {
            setLoading(true);
            const qs = new URLSearchParams({ taskList: companyId });
            if (statusFilter !== 'all') qs.set('status', statusFilter);
            if (priorityFilter !== 'all') qs.set('priority', priorityFilter);
            if (debouncedSearch.trim()) qs.set('search', debouncedSearch.trim());

            const res = await apiClient.get<{ success: boolean; tasks: Task[] }>(
                `/api/tasks?${qs.toString()}`
            );
            setTasks(res.tasks ?? []);
        } catch {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [companyId, statusFilter, priorityFilter, debouncedSearch]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const isLoading = loading || companyLoading;

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex flex-col gap-4">
                <Link href="/dashboard/companies">
                    <Button variant="ghost" size="sm" className="self-start -ml-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Companies
                    </Button>
                </Link>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-2xl border border-orange-500/20">
                    <div className="flex items-center gap-4">
                        {company && (
                            <span
                                className="w-5 h-5 rounded-full ring-2 ring-white/50 flex-shrink-0"
                                style={{ backgroundColor: company.color }}
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {companyLoading ? '⋯' : (company?.name ?? 'Company')}
                            </h1>
                            {company?.description && (
                                <p className="text-muted-foreground mt-1">{company.description}</p>
                            )}
                            {!loading && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <Link href={`/dashboard/tasks/new${companyId ? `?taskList=${companyId}` : ''}`}>
                        <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                            <Plus className="mr-2 h-5 w-5" />
                            New Task
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search + View toggle */}
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
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
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
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
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
                {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setStatusFilter('all');
                            setPriorityFilter('all');
                            setSearchQuery('');
                        }}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Tasks display */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading tasks…</p>
                    </div>
                </div>
            ) : tasks.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-muted-foreground">
                            {debouncedSearch
                                ? `No tasks found matching "${debouncedSearch}".`
                                : 'No tasks in this company yet. Create the first one!'}
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

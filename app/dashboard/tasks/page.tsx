'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { CalendarDays, Filter, ListTodo, Plus, User2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TaskList {
  _id: string;
  name: string;
  color: string;
}

interface Task {
  _id: string;
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

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskListFilter, setTaskListFilter] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
    fetchTaskLists();
  }, [filter, statusFilter, priorityFilter, taskListFilter]);

  const fetchTaskLists = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; taskLists: TaskList[] }>('/api/task-lists');
      setTaskLists(response.taskLists || []);
    } catch (error) {
      console.error('Failed to fetch task lists:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filter !== 'all') {
        queryParams.append('filter', filter);
      }
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        queryParams.append('priority', priorityFilter);
      }
      if (taskListFilter !== 'all') {
        queryParams.append('taskList', taskListFilter);
      }

      const response = await apiClient.get<{ success: boolean; tasks: Task[] }>(
        `/api/tasks?${queryParams.toString()}`
      );
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
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
  };

  const getStatusColor = (status: string) => {
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
  };

  const isOverdue = (endDate: string, status: string) => {
    return new Date(endDate) < new Date() && status !== 'Completed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and track your tasks
          </p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter tasks by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="text-sm font-medium mb-2 block">Task List</label>
              <Select value={taskListFilter} onValueChange={setTaskListFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All lists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lists</SelectItem>
                  {taskLists.map((list) => (
                    <SelectItem key={list._id} value={list._id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        {list.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No tasks found. {isAdmin && 'Create your first task to get started!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
                <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary" style={{ borderLeftColor: task.taskList?.color || '#3b82f6' }}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Title and Badges */}
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {task.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)} variant="outline">
                                {task.priority}
                              </Badge>
                              {isOverdue(task.endDate, task.status) && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                          {task.description}
                        </p>

                        {/* Meta Information */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <ListTodo className="h-4 w-4" style={{ color: task.taskList?.color }} />
                            <span className="font-medium">{task.taskList?.name || 'No List'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User2 className="h-4 w-4" />
                            <span>
                              {task.assignedTo && task.assignedTo.length > 0
                                ? task.assignedTo.map((a: any) => a.name).join(', ')
                                : 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        )}
      </div>
    </div>
  );
}

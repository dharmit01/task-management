'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle, Clock, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TaskStats {
  total: number;
  today: number;
  overdue: number;
  highPriority: number;
  completed: number;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    today: 0,
    overdue: 0,
    highPriority: 0,
    completed: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all tasks
      const allTasksResponse = await apiClient.get<any>('/api/tasks');
      const tasks = allTasksResponse.tasks || [];

      // Calculate stats
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const statsData: TaskStats = {
        total: tasks.length,
        today: tasks.filter((t: any) => {
          const startDate = new Date(t.startDate);
          return startDate >= today && startDate < tomorrow;
        }).length,
        overdue: tasks.filter((t: any) => {
          const endDate = new Date(t.endDate);
          return endDate < now && t.status !== 'Completed';
        }).length,
        highPriority: tasks.filter(
          (t: any) => t.priority === 'High' || t.priority === 'Critical'
        ).length,
        completed: tasks.filter((t: any) => t.status === 'Completed').length,
      };

      setStats(statsData);
      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {user?.name}!
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/tasks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Tasks starting today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.highPriority}
            </div>
            <p className="text-xs text-muted-foreground">
              High & Critical tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Your most recently created tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No tasks found. {isAdmin && 'Create your first task to get started!'}
            </p>
          ) : (
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <Link
                  key={task._id}
                  href={`/dashboard/tasks/${task._id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Assigned to: {Array.isArray(task.assignedTo) 
                          ? task.assignedTo.map((a: any) => a.name).join(', ')
                          : task.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {recentTasks.length > 0 && (
            <div className="mt-4 text-center">
              <Link href="/dashboard/tasks">
                <Button variant="outline">View All Tasks</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

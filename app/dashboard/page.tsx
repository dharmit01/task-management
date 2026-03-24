'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { AlertCircle, CheckCircle, Clock, ListTodo, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { loading, stats, recentTasks } = useTasks();

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
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/40 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg font-medium bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-linear-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border border-primary/20">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome back, <span className="font-medium text-foreground">{user?.name}</span>! 👋
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/tasks/new">
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <Plus className="mr-2 h-5 w-5" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Tasks</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks starting today
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.highPriority}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
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
                        Assigned to: {task.assignedTo && task.assignedTo.length > 0
                          ? task.assignedTo.map((a) => a.name).join(', ')
                          : 'Unassigned'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                        <ListTodo className="h-4 w-4" style={{ color: task.taskList?.color }} />
                        <span className="font-medium">{task.taskList?.name || 'No List'}</span>
                      </div>
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

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { formatAuditLogValue } from '@/lib/format-utils';
import { AlertCircle, ArrowLeft, Calendar, ChevronDown, ChevronUp, Clock, Pencil, Tag, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const taskId = params?.id as string;

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
      fetchComments();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(`/api/tasks/${taskId}`);
      setTask(response.task);
    } catch (error: any) {
      console.error('Failed to fetch task:', error);
      if (error.message.includes('Access denied')) {
        toast.error('You do not have permission to view this task');
        router.push('/dashboard/tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await apiClient.get<any>(`/api/tasks/${taskId}/comments`);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await apiClient.patch(`/api/tasks/${taskId}`, { status: newStatus });
      setTask({ ...task, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await apiClient.post<any>(`/api/tasks/${taskId}/comments`, {
        commentText: newComment,
      });
      setComments([...comments, response.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setDeleting(true);
      await apiClient.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
      setDeleting(false);
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (endDate: string, status: string) => {
    return new Date(endDate) < new Date() && status !== 'Completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Task not found</p>
        <Link href="/dashboard/tasks">
          <Button className="mt-4" variant="outline">
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <Link href="/dashboard/tasks">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      {/* Task Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {task.taskId && (
            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded inline-block mb-2">
              {task.taskId}
            </span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {task.title}
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
            {isOverdue(task.endDate, task.status) && (
              <Badge variant="destructive">Overdue</Badge>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <User className="h-3 w-3" />
              Created by <span className="font-medium">{task.createdBy?.name}</span>
            </span>
          </div>
        </div>
        {/* Allow edit for admins, assignees, or creator */}
        {(isAdmin ||
          task.assignedTo?.some((a: any) => a._id === user?._id) ||
          task.createdBy?._id === user?._id) && (
            <div className="flex gap-2">
              <Link href={`/dashboard/tasks/${taskId}/edit`}>
                <Button>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Task
                </Button>
              </Link>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task
                        and all associated comments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discussion and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.userId?.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {comment.userId?.role}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {comment.commentText}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mt-4 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submitting}
                  rows={3}
                />
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  {submitting ? 'Adding...' : 'Add Comment'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>Track all changes made to this task</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                >
                  {showAuditTrail ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {showAuditTrail && (
              <CardContent>
                {task.auditLog && task.auditLog.length > 0 ? (
                  <div className="space-y-4">
                    {task.auditLog
                      .slice()
                      .reverse()
                      .map((log: any, index: number) => (
                        <div
                          key={index}
                          className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {log.actor?.name || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {log.action}
                                  {log.field !== 'task' && (
                                    <>
                                      {log.action.includes('Added') || log.action.includes('Removed') ? (
                                        <>
                                          {': '}
                                          <span className="font-medium">
                                            {formatAuditLogValue(log.field, log.newValue || log.oldValue)}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          {' from '}
                                          <span className="font-medium">
                                            {formatAuditLogValue(log.field, log.oldValue)}
                                          </span>
                                          {' to '}
                                          <span className="font-medium">
                                            {formatAuditLogValue(log.field, log.newValue)}
                                          </span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No activity history yet
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={task.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ToDo">To Do</SelectItem>
                  <SelectItem value="In-Progress">In Progress</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="In-Review">In Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-gray-500 dark:text-gray-400">
                    Assigned To
                  </div>
                  <div className="space-y-2 mt-1">
                    {task.assignedTo && Array.isArray(task.assignedTo) ? (
                      task.assignedTo.map((assignee: any) => (
                        <div key={assignee._id} className="text-gray-900 dark:text-white">
                          <div>{assignee.name}</div>
                          <div className="text-xs text-gray-500">{assignee.email}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No assignees</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">
                    Task List
                  </div>
                  <div className="flex items-center gap-2">
                    {task.taskList?.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.taskList.color }}
                      />
                    )}
                    <span className="text-gray-900 dark:text-white">
                      {task.taskList?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">
                    Start Date
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(task.startDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">
                    End Date
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(task.endDate).toLocaleDateString()}
                  </div>
                  {isOverdue(task.endDate, task.status) && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      Overdue
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

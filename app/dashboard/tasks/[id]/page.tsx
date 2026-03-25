"use client";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { formatAuditLogValue } from "@/lib/format-utils";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  History,
  MessageSquare,
  Pencil,
  Send,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/* ── visual helpers ───────────────────────────────────────────────── */

const PRIORITY_META: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-700",
  },
  High: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-700",
  },
  Medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-700",
  },
  Low: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
  },
};

const STATUS_META: Record<string, { color: string; bg: string; text: string }> =
  {
    ToDo: {
      color: "#64748b",
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-700 dark:text-slate-300",
    },
    "In-Progress": {
      color: "#3b82f6",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
    },
    Blocked: {
      color: "#ef4444",
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
    },
    "In-Review": {
      color: "#8b5cf6",
      bg: "bg-violet-100 dark:bg-violet-900/30",
      text: "text-violet-700 dark:text-violet-300",
    },
    Completed: {
      color: "#22c55e",
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-300",
    },
  };

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/* ── loading skeleton ─────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-5xl">
      <div className="h-8 w-28 rounded-full bg-muted/40" />
      <div className="h-52 rounded-[28px] bg-muted/30" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="h-36 rounded-[28px] bg-muted/25" />
          <div className="h-64 rounded-[28px] bg-muted/20" />
        </div>
        <div className="space-y-4">
          <div className="h-20 rounded-[28px] bg-muted/25" />
          <div className="h-56 rounded-[28px] bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
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
      console.error("Failed to fetch task:", error);
      if (error.message.includes("Access denied")) {
        toast.error("You do not have permission to view this task");
        router.push("/dashboard/tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await apiClient.get<any>(
        `/api/tasks/${taskId}/comments`,
      );
      setComments(response.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await apiClient.patch(`/api/tasks/${taskId}`, { status: newStatus });
      setTask({ ...task, status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const response = await apiClient.post<any>(
        `/api/tasks/${taskId}/comments`,
        {
          commentText: newComment,
        },
      );
      setComments([...comments, response.comment]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setDeleting(true);
      await apiClient.delete(`/api/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      router.push("/dashboard/tasks");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
      setDeleting(false);
    }
  };

  /* ── render guards ─────────────────────────────────────────────── */
  if (loading) return <PageSkeleton />;

  if (!task) {
    return (
      <div className="max-w-5xl">
        <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.15)]">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
          <div className="relative flex flex-col items-center gap-4 bg-linear-to-br from-primary/4 via-background to-background px-8 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
              <FileText className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold tracking-tight">
                Task not found
              </h3>
              <p className="text-sm text-muted-foreground">
                This task may have been deleted or you don&apos;t have access.
              </p>
            </div>
            <Link href="/dashboard/tasks">
              <Button
                variant="outline"
                className="mt-1 rounded-2xl cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tasks
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const overdue =
    new Date(task.endDate) < new Date() && task.status !== "Completed";
  const accentColor = task.taskList?.color || "#6366f1";
  const statusMeta = STATUS_META[task.status] ?? STATUS_META["ToDo"];
  const priorityMeta = PRIORITY_META[task.priority] ?? {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  };
  const canEdit =
    isAdmin ||
    task.assignedTo?.some((a: any) => a._id === user?._id) ||
    task.createdBy?._id === user?._id;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Back navigation ───────────────────────────────────── */}
      <Link href="/dashboard/tasks">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      {/* ── Hero header ───────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
        {/* Shimmer using task list colour */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-80"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}70, transparent)`,
          }}
        />
        {/* Ambient glows */}
        <div
          className="absolute -top-16 right-0 h-48 w-48 rounded-full blur-3xl opacity-60"
          style={{ backgroundColor: `${accentColor}18` }}
        />
        <div
          className="absolute -bottom-12 left-1/4 h-32 w-64 rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: `${accentColor}10` }}
        />

        <div className="relative bg-linear-to-br from-primary/6 via-background to-background px-7 py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* Left — identity */}
            <div className="min-w-0 flex-1 space-y-3">
              {/* TaskId + list chip */}
              <div className="flex flex-wrap items-center gap-2">
                {task.taskId && (
                  <span className="rounded-full border border-border/60 bg-muted/50 px-3 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground/60">
                    {task.taskId}
                  </span>
                )}
                {task.taskList && (
                  <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    {task.taskList.name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold leading-snug tracking-tight text-foreground">
                {task.title}
              </h1>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: statusMeta.color }}
                  />
                  {task.status === "ToDo" ? "To Do" : task.status}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}
                >
                  {task.priority} Priority
                </span>
                {overdue && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </span>
                )}
              </div>

              {/* Created by */}
              <p className="text-xs text-muted-foreground">
                Created by{" "}
                <span className="font-medium text-foreground">
                  {task.createdBy?.name}
                </span>
                {task.createdAt && (
                  <>
                    {" · "}
                    {new Date(task.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>
            </div>

            {/* Right — actions */}
            {canEdit && (
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/dashboard/tasks/${taskId}/edit`}>
                  <Button className="h-10 rounded-2xl px-4 shadow-sm cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 rounded-2xl border-destructive/40 px-4 text-destructive hover:border-destructive/60 hover:bg-red-500 cursor-pointer"
                        disabled={deleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The task and all its
                          comments will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteTask}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Body grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative bg-linear-to-br from-primary/5 via-background to-background">
              <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight">
                  Description
                </h2>
              </div>
              <div className="px-6 py-5">
                {task.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/40">
                    No description provided.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Comments */}
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative bg-linear-to-br from-primary/5 via-background to-background">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      Comments
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Discussion and updates
                    </p>
                  </div>
                </div>
                {comments.length > 0 && (
                  <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {comments.length}
                  </span>
                )}
              </div>

              {/* Comment list + form */}
              <div className="space-y-5 px-6 py-5">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center gap-2.5 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border/50">
                      <MessageSquare className="h-4 w-4 text-muted-foreground/35" />
                    </div>
                    <p className="text-sm text-muted-foreground/60">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex gap-3.5">
                        {/* Avatar */}
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-[10px] font-bold text-primary ring-1 ring-border/50">
                          {initials(comment.userId?.name || "?")}
                        </div>
                        {/* Bubble */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
                            <span className="text-sm font-semibold">
                              {comment.userId?.name}
                            </span>
                            {comment.userId?.role && (
                              <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0 text-[10px] font-medium text-muted-foreground">
                                {comment.userId.role}
                              </span>
                            )}
                            <span className="ml-auto text-xs text-muted-foreground/60">
                              {new Date(comment.createdAt).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm border border-border/50 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                            {comment.commentText}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                <form
                  onSubmit={handleAddComment}
                  className="flex gap-3 border-t border-border/40 pt-4"
                >
                  <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[10px] font-bold text-primary ring-1 ring-border/50">
                    {user?.name ? initials(user.name) : "?"}
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <Textarea
                      placeholder="Write a comment…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submitting}
                      rows={3}
                      className="resize-none rounded-2xl border-border/60 bg-background/80 text-sm focus-visible:ring-1"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submitting || !newComment.trim()}
                        className="h-9 rounded-xl px-4 cursor-pointer"
                      >
                        <Send className="mr-2 h-3.5 w-3.5" />
                        {submitting ? "Sending…" : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Audit Trail */}
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative bg-linear-to-br from-primary/5 via-background to-background">
              {/* Collapsible header */}
              <button
                type="button"
                onClick={() => setShowAuditTrail(!showAuditTrail)}
                className="flex w-full items-center justify-between border-b border-border/60 px-6 py-4 text-left transition-colors hover:bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">
                      Activity History
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Track all changes to this task
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {task.auditLog?.length > 0 && (
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                      {task.auditLog.length}
                    </span>
                  )}
                  {showAuditTrail ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {showAuditTrail && (
                <div className="px-6 py-5">
                  {task.auditLog && task.auditLog.length > 0 ? (
                    <div className="space-y-3">
                      {task.auditLog
                        .slice()
                        .reverse()
                        .map((log: any, index: number, arr: any[]) => (
                          <div key={index} className="flex gap-4">
                            {/* Icon column with connecting line */}
                            <div className="relative flex shrink-0 flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/15 ring-1 ring-primary/25 z-10">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                              </div>
                              {index < arr.length - 1 && (
                                <div className="mt-1 w-px flex-1 bg-border/50" />
                              )}
                            </div>
                            {/* Content */}
                            <div className="mb-3 flex-1 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-sm">
                              <div className="flex items-start justify-between gap-3">
                                <p className="flex-1 text-foreground/85">
                                  <span className="font-semibold text-foreground">
                                    {log.actor?.name || "Unknown User"}
                                  </span>
                                  {" — "}
                                  {log.action}
                                  {log.field !== "task" && (
                                    <>
                                      {log.action.includes("Added") ||
                                      log.action.includes("Removed") ? (
                                        <>
                                          {": "}
                                          <span className="font-medium text-foreground">
                                            {formatAuditLogValue(
                                              log.field,
                                              log.newValue || log.oldValue,
                                            )}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          {" from "}
                                          <span className="font-medium text-foreground/60 line-through decoration-muted-foreground/40">
                                            {formatAuditLogValue(
                                              log.field,
                                              log.oldValue,
                                            )}
                                          </span>
                                          {" → "}
                                          <span className="font-medium text-foreground">
                                            {formatAuditLogValue(
                                              log.field,
                                              log.newValue,
                                            )}
                                          </span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </p>
                                <span className="shrink-0 text-xs text-muted-foreground/60">
                                  {new Date(log.timestamp).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <History className="h-7 w-7 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground/50">
                        No activity history yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status */}
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative space-y-3 bg-linear-to-br from-primary/5 via-background to-background px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                Status
              </p>
              <Select value={task.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="h-10 rounded-2xl border-border/60">
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
            </div>
          </section>

          {/* Task details */}
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
            <div className="relative bg-linear-to-br from-primary/5 via-background to-background">
              <div className="border-b border-border/60 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  Details
                </p>
              </div>

              <div className="divide-y divide-border/40 px-5">
                {/* Assigned To */}
                <div className="flex items-start gap-3.5 py-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                    <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-xs font-medium text-muted-foreground/70">
                      Assigned To
                    </p>
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                      <div className="space-y-2.5">
                        {task.assignedTo.map((a: any) => (
                          <div
                            key={a._id}
                            className="flex items-center gap-2.5"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary ring-1 ring-border/50">
                              {initials(a.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {a.name}
                              </p>
                              {a.email && (
                                <p className="truncate text-xs text-muted-foreground/60">
                                  {a.email}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm italic text-muted-foreground/40">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Company / List */}
                <div className="flex items-start gap-3.5 py-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground/70">
                      Company / List
                    </p>
                    <div className="flex items-center gap-2">
                      {task.taskList?.color && (
                        <div
                          className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                          style={{ backgroundColor: task.taskList.color }}
                        />
                      )}
                      <span className="truncate text-sm font-medium">
                        {task.taskList?.name || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-3.5 py-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground/70">
                      Dates
                    </p>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
                      <span className="text-xs text-muted-foreground/60">
                        Start
                      </span>
                      <span className="text-xs font-medium">
                        {new Date(task.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                        overdue
                          ? "border-destructive/30 bg-destructive/8"
                          : "border-border/40 bg-muted/20"
                      }`}
                    >
                      <span
                        className={`text-xs ${overdue ? "text-destructive/70" : "text-muted-foreground/60"}`}
                      >
                        Due
                      </span>
                      <div className="flex items-center gap-1.5">
                        {overdue && (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                        <span
                          className={`text-xs font-medium ${overdue ? "text-destructive" : ""}`}
                        >
                          {new Date(task.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

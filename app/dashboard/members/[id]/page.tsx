"use client";

import type { MemberTaskStats } from "@/app/api/users/[id]/task-stats/route";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskPagination } from "@/components/tasks/TaskPagination";
import { TaskSearchBar } from "@/components/tasks/TaskSearchBar";
import { TaskView } from "@/components/tasks/TaskView";
import { TaskList, ViewMode } from "@/components/tasks/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { apiClient } from "@/lib/api-client";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit,
  KeyRound,
  ListTodo,
  Mail,
  Save,
  Timer,
  TriangleAlert,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type UserRole = "Admin" | "Member" | "Manager";

interface ManagerOption {
  _id: string;
  name: string;
  role: UserRole;
}

interface TeamMember {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: "Member";
  isActive: boolean;
  annualLeaveBalance: number;
}

interface Member {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  annualLeaveBalance: number;
  managerId?:
    | {
        _id: string;
        name: string;
        username: string;
        email?: string;
      }
    | string;
  createdAt: string;
}

interface MemberDetailResponse {
  success: boolean;
  user: Member;
  teamMembers?: TeamMember[];
}

interface UsersResponse {
  success: boolean;
  users: Array<ManagerOption & { role: UserRole }>;
}

interface UpdateUserPayload {
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  managerId?: string;
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [memberId, setMemberId] = useState<string>("");
  const [member, setMember] = useState<Member | null>(null);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [taskStats, setTaskStats] = useState<MemberTaskStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [editingLeaveBalance, setEditingLeaveBalance] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<number>(15);
  const [updating, setUpdating] = useState(false);
  const [editingUserDetails, setEditingUserDetails] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    email: "",
    role: "Member" as "Admin" | "Member" | "Manager",
    isActive: true,
    managerId: "",
  });

  // Task filter state
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [taskListFilter, setTaskListFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = localStorage.getItem("tasks-view-mode") as ViewMode | null;
    return saved && (["card", "table", "board"] as ViewMode[]).includes(saved)
      ? saved
      : "card";
  });

  const activeFilterCount = useMemo(
    () =>
      [
        filter !== "all",
        statusFilter !== "all",
        priorityFilter !== "all",
        taskListFilter !== "all",
        debouncedSearch.trim().length > 0,
      ].filter(Boolean).length,
    [debouncedSearch, filter, priorityFilter, statusFilter, taskListFilter],
  );

  const { loading, tasks, pagination } = useTasks(
    memberId
      ? {
          filter,
          status: statusFilter,
          priority: priorityFilter,
          taskList: taskListFilter,
          assignedTo: memberId,
          search: debouncedSearch,
          page: viewMode !== "board" ? searchPage : undefined,
          limit: pageSize,
        }
      : undefined,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    params.then((resolvedParams) => {
      setMemberId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    apiClient
      .get<{ success: boolean; taskLists: TaskList[] }>("/api/task-lists")
      .then((res) => setTaskLists(res.taskLists || []))
      .catch((err) => console.error("Failed to fetch task lists:", err));
  }, []);

  useEffect(() => {
    if (!memberId) return;
    apiClient
      .get<{ success: boolean; stats: MemberTaskStats }>(
        `/api/users/${memberId}/task-stats`,
      )
      .then((res) => setTaskStats(res.stats))
      .catch((err) => console.error("Failed to fetch task stats:", err));
  }, [memberId]);

  const fetchMemberDetails = useCallback(async () => {
    try {
      const response = await apiClient.get<MemberDetailResponse>(
        `/api/users/${memberId}`,
      );
      setMember(response.user);
      setTeamMembers(response.teamMembers || []);
      setLeaveBalance(response.user.annualLeaveBalance || 15);
      const managerIdValue =
        (typeof response.user.managerId === "object"
          ? response.user.managerId?._id
          : response.user.managerId) || "";
      setUserForm({
        name: response.user.name,
        username: response.user.username,
        email: response.user.email || "",
        role: response.user.role,
        isActive: response.user.isActive,
        managerId: managerIdValue,
      });
    } catch (error) {
      console.error("Failed to fetch member details:", error);
    }
  }, [memberId]);

  const fetchManagers = useCallback(async () => {
    try {
      const response = await apiClient.get<UsersResponse>("/api/users");
      const managersList = (response.users || []).filter(
        (user) =>
          (user.role === "Manager" || user.role === "Admin") &&
          user._id !== memberId,
      );
      setManagers(managersList);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  }, [memberId]);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    if (memberId) {
      fetchMemberDetails();
      fetchManagers();
    }
  }, [isAdmin, memberId, router, fetchMemberDetails, fetchManagers]);

  const getRoleBadgeClass = (role: UserRole) => {
    if (role === "Admin")
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700";
    if (role === "Manager")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700";

    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchPage(1);
    localStorage.setItem("tasks-view-mode", mode);
  };

  const handleUpdateLeaveBalance = async () => {
    if (leaveBalance < 0) {
      toast.error("Leave balance cannot be negative");
      return;
    }

    try {
      setUpdating(true);
      await apiClient.patch(`/api/users/${memberId}`, {
        annualLeaveBalance: leaveBalance,
      });
      toast.success("Leave balance updated successfully");
      setEditingLeaveBalance(false);
      fetchMemberDetails();
    } catch (error) {
      console.error("Failed to update leave balance:", error);
      toast.error("Failed to update leave balance");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setUpdating(true);
      await apiClient.post(`/api/users/${memberId}/change-password`, {
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toast.success("Password changed successfully");
      setChangingPassword(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateUserDetails = async () => {
    if (!userForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!userForm.username.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      setUpdating(true);
      const payload: UpdateUserPayload = {
        name: userForm.name,
        username: userForm.username,
        ...(userForm.email && { email: userForm.email }),
        role: userForm.role,
        isActive: userForm.isActive,
      };
      // Only include managerId if role is Member
      if (userForm.role === "Member") {
        payload.managerId = userForm.managerId || "";
      }
      await apiClient.patch(`/api/users/${memberId}`, payload);
      toast.success("User details updated successfully");
      setEditingUserDetails(false);
      fetchMemberDetails();
    } catch (error) {
      console.error("Failed to update user details:", error);
      toast.error("Failed to update user details");
    } finally {
      setUpdating(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (!member && !loading) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/members">
          <Button variant="ghost" size="sm" className="cursor-pointer mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Member not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/members">
          <Button variant="ghost" size="sm" className="-ml-2 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </Link>

        {/* Hero header — mirrors company detail page */}
        <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 bg-linear-to-br from-primary/8 via-background to-background px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Left — avatar + identity */}
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 text-xl font-bold shadow-sm">
                {member?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {member?.name ?? "Loading…"}
                  </h1>
                  {member && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(member.role)}`}
                    >
                      {member.role}
                    </span>
                  )}
                  {member && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        member.isActive
                          ? "border-green-200 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "border-red-200 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {member.isActive ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  @{member?.username}
                  {member?.email && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                    </>
                  )}
                </p>
                {member?.createdAt && (
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    Joined {dayjs(member.createdAt).format("D MMMM YYYY")}
                  </p>
                )}
              </div>
            </div>

            {/* Right — quick stat pills */}
            {!loading && (
              <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end sm:gap-2">
                <StatPill
                  icon={<ClipboardList className="h-3.5 w-3.5" />}
                  label="Total"
                  value={taskStats.total}
                  color="text-foreground"
                />
                <StatPill
                  icon={<Timer className="h-3.5 w-3.5" />}
                  label="In Progress"
                  value={taskStats.inProgress}
                  color="text-blue-600 dark:text-blue-400"
                />
                <StatPill
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  label="Completed"
                  value={taskStats.completed}
                  color="text-green-600 dark:text-green-400"
                />
                <StatPill
                  icon={<TriangleAlert className="h-3.5 w-3.5" />}
                  label="Overdue"
                  value={taskStats.overdue}
                  color="text-red-600 dark:text-red-400"
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Member edit / admin actions */}
      {member && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Member Details</CardTitle>
                <CardDescription>
                  View and edit member information
                </CardDescription>
              </div>
              {!editingUserDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingUserDetails(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingUserDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={userForm.name}
                      onChange={(e) =>
                        setUserForm({ ...userForm, name: e.target.value })
                      }
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={userForm.username}
                      onChange={(e) =>
                        setUserForm({ ...userForm, username: e.target.value })
                      }
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm({ ...userForm, email: e.target.value })
                      }
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value: "Admin" | "Member" | "Manager") =>
                        setUserForm({ ...userForm, role: value, managerId: "" })
                      }
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={userForm.isActive ? "active" : "inactive"}
                      onValueChange={(value) =>
                        setUserForm({
                          ...userForm,
                          isActive: value === "active",
                        })
                      }
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userForm.role === "Member" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="manager-edit">Assign Manager</Label>
                      <Select
                        value={userForm.managerId || "none"}
                        onValueChange={(value) =>
                          setUserForm({
                            ...userForm,
                            managerId: value === "none" ? "" : value,
                          })
                        }
                        disabled={updating}
                      >
                        <SelectTrigger id="manager-edit">
                          <SelectValue placeholder="Select a manager (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager._id} value={manager._id}>
                              {manager.name} ({manager.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateUserDetails}
                    disabled={updating}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updating ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingUserDetails(false);
                      const managerIdValue =
                        member?.managerId &&
                        typeof member.managerId === "object"
                          ? member.managerId._id
                          : typeof member?.managerId === "string"
                            ? member.managerId
                            : "";
                      setUserForm({
                        name: member.name,
                        username: member.username,
                        email: member.email || "",
                        role: member.role,
                        isActive: member.isActive,
                        managerId: managerIdValue,
                      });
                    }}
                    disabled={updating}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Name
                    </p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Username
                    </p>
                    <p className="font-medium">@{member.username}</p>
                  </div>
                  {member.email && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Email
                      </p>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Role
                    </p>
                    <Badge
                      variant={
                        member.role === "Admin" ? "default" : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>
                  </div>
                  {member.role === "Member" && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Manager
                      </p>
                      <p className="font-medium">
                        {member.managerId &&
                        typeof member.managerId === "object"
                          ? member.managerId.name
                          : "No Manager Assigned"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </p>
                    <Badge
                      variant={member.isActive ? "default" : "destructive"}
                    >
                      {member.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Joined
                    </p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {dayjs(member.createdAt).format("D MMMM, YYYY")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Management */}
      {member && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Annual Leave Balance</CardTitle>
                <CardDescription>
                  Manage member&apos;s yearly leave allocation
                </CardDescription>
              </div>
              {!editingLeaveBalance && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingLeaveBalance(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingLeaveBalance ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveBalance">Annual Leave Days</Label>
                  <Input
                    id="leaveBalance"
                    type="number"
                    min="0"
                    value={leaveBalance}
                    onChange={(e) => setLeaveBalance(Number(e.target.value))}
                    disabled={updating}
                  />
                  <p className="text-xs text-gray-500">
                    Total number of leave days allocated per year
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateLeaveBalance}
                    disabled={updating}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updating ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingLeaveBalance(false);
                      setLeaveBalance(member.annualLeaveBalance || 15);
                    }}
                    disabled={updating}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{leaveBalance} days</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Annual leave allocation
                  </p>
                </div>
                <Link href={`/dashboard/leaves?userId=${memberId}`}>
                  <Button variant="outline" size="sm">
                    View Leave History
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      {member && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Set a new password for {member.name}
                </CardDescription>
              </div>
              {!changingPassword && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPasswordForm({ newPassword: "", confirmPassword: "" });
                    setChangingPassword(true);
                  }}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              )}
            </div>
          </CardHeader>
          {changingPassword && (
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      disabled={updating}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={updating}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={updating}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updating ? "Saving..." : "Save Password"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updating}
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordForm({ newPassword: "", confirmPassword: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Task Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: taskStats.total,
            icon: <ClipboardList className="h-5 w-5" />,
            color: "text-foreground",
            bg: "bg-muted/40",
          },
          {
            label: "In Progress",
            value: taskStats.inProgress,
            icon: <Timer className="h-5 w-5" />,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "Completed",
            value: taskStats.completed,
            icon: <CheckCircle2 className="h-5 w-5" />,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-950/30",
          },
          {
            label: "Overdue",
            value: taskStats.overdue,
            icon: <TriangleAlert className="h-5 w-5" />,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/30",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-border/70 ${stat.bg} px-5 py-4`}
          >
            <div className={`mb-1 ${stat.color}`}>{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Assigned Tasks ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Assigned Tasks
          </h2>
          {!loading && (
            <span className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {taskStats.total}
            </span>
          )}
        </div>

        <TaskSearchBar
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setSearchPage(1);
          }}
          onViewChange={handleViewChange}
        />

        <TaskFilters
          filter={filter}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          taskListFilter={taskListFilter}
          memberFilter={memberId}
          taskLists={taskLists}
          members={[]}
          isAdmin={isAdmin}
          canFilterByMember={false}
          activeFilterCount={activeFilterCount}
          onFilterChange={(v) => {
            setFilter(v);
            setSearchPage(1);
          }}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setSearchPage(1);
          }}
          onPriorityChange={(v) => {
            setPriorityFilter(v);
            setSearchPage(1);
          }}
          onTaskListChange={(v) => {
            setTaskListFilter(v);
            setSearchPage(1);
          }}
          onMemberChange={() => undefined}
          onClearFilters={() => {
            setFilter("all");
            setStatusFilter("all");
            setPriorityFilter("all");
            setTaskListFilter("all");
            setSearchQuery("");
            setDebouncedSearch("");
            setSearchPage(1);
          }}
        />

        <TaskView
          tasks={tasks}
          loading={loading}
          viewMode={viewMode}
          searchQuery={debouncedSearch}
          isAdmin={isAdmin}
        />

        {viewMode !== "board" && pagination && pagination.total > 0 && (
          <TaskPagination
            pagination={pagination}
            onPageChange={setSearchPage}
            onLimitChange={(size) => {
              setPageSize(size);
              setSearchPage(1);
            }}
          />
        )}
      </section>

      {member?.role && ["Manager", "Admin"].includes(member.role) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Assigned Members</CardTitle>
                <CardDescription>
                  Members currently assigned to {member.name}
                </CardDescription>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                <Users className="h-4 w-4" />
                {teamMembers.length}{" "}
                {teamMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No members are currently assigned to this manager.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                      <TableHead className="pl-4 py-2">Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Leave Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {teamMembers.map((teamMember) => (
                      <TableRow
                        key={teamMember._id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/members/${teamMember._id}`)
                        }
                      >
                        <TableCell className="pl-4 py-4">
                          <Link
                            href={`/dashboard/members/${teamMember._id}`}
                            className="group"
                          >
                            <p className="font-medium text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                              {teamMember.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              @{teamMember.username}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {teamMember.email || (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(teamMember.role)}`}
                          >
                            {teamMember.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                          {teamMember.annualLeaveBalance} days
                        </TableCell>
                        <TableCell>
                          {teamMember.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300">
                              <UserX className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Small helper component ────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
      <span className={color}>{icon}</span>
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

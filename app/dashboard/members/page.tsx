"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { apiClient } from "@/lib/api-client";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

function getRoleBadgeClass(role: string) {
  if (role === "Admin")
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700";
  if (role === "Manager")
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600";
}

export default function MembersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "Member",
    managerId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [nameSortDir, setNameSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchMembers();
    fetchManagers();
  }, [isAdmin]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>("/api/users");
      setMembers(response.users || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await apiClient.get<any>("/api/users");
      const managersList = (response.users || []).filter(
        (user: any) => user.role === "Manager" || user.role === "Admin",
      );
      setManagers(managersList);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      // Only include managerId if role is Member and managerId is selected
      const payload: any = {
        name: formData.name,
        username: formData.username,
        ...(formData.email && { email: formData.email }),
        password: formData.password,
        role: formData.role,
      };
      if (formData.role === "Member" && formData.managerId) {
        payload.managerId = formData.managerId;
      }
      await apiClient.post("/api/users", payload);
      alert("Member created successfully!");
      setDialogOpen(false);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "Member",
        managerId: "",
      });
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to create member:", error);
      alert(error.message || "Failed to create member");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMemberStatus = async (
    memberId: string,
    currentStatus: boolean,
  ) => {
    try {
      await apiClient.patch(`/api/users/${memberId}`, {
        isActive: !currentStatus,
      });
      fetchMembers();
    } catch (error) {
      console.error("Failed to update member status:", error);
      alert("Failed to update member status");
    }
  };

  // Derive team info lookups from the full members list
  const teamSizeByManager = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      if (m.managerId) {
        const id =
          typeof m.managerId === "object"
            ? (m.managerId._id ?? m.managerId.toString())
            : m.managerId;
        map[id] = (map[id] || 0) + 1;
      }
    });
    return map;
  }, [members]);

  const managerNameById = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      if (m.role === "Manager" || m.role === "Admin") {
        map[m._id] = m.name;
      }
    });
    return map;
  }, [members]);

  // Reset to page 1 whenever filters, search, page size, or sort change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize, nameSortDir]);

  const filteredMembers = useMemo(() => {
    const result = members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q));
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? m.isActive : !m.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...result].sort((a, b) => {
      const cmp = (a.name ?? "").localeCompare(b.name ?? "");
      return nameSortDir === "asc" ? cmp : -cmp;
    });
  }, [members, searchQuery, roleFilter, statusFilter, nameSortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(
    () => filteredMembers.slice((page - 1) * pageSize, page * pageSize),
    [filteredMembers, page, pageSize],
  );

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.isActive).length,
      managers: members.filter((m) => m.role === "Manager").length,
      membersCount: members.filter((m) => m.role === "Member").length,
    }),
    [members],
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 bg-linear-to-br from-primary/8 via-background to-background px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
              <p className="text-sm text-muted-foreground">
                Manage team members and their access
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl px-5 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Member</DialogTitle>
                <DialogDescription>
                  Add a new team member with their credentials
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={6}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value, managerId: "" })
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "Member" && (
                  <div className="space-y-2">
                    <Label htmlFor="manager">Assign Manager</Label>
                    <Select
                      value={formData.managerId || "none"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          managerId: value === "none" ? "" : value,
                        })
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger id="manager">
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
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Member"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Members",
            eyebrow: "Roster",
            value: stats.total,
            icon: <Users className="h-5 w-5" />,
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20",
          },
          {
            label: "Active",
            eyebrow: "Status",
            value: stats.active,
            icon: <UserCheck className="h-5 w-5" />,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
          },
          {
            label: "Managers",
            eyebrow: "Leadership",
            value: stats.managers,
            icon: <Shield className="h-5 w-5" />,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
          },
          {
            label: "Team Members",
            eyebrow: "Contributors",
            value: stats.membersCount,
            icon: <Users className="h-5 w-5" />,
            color: "text-violet-600",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
          },
        ].map(({ label, eyebrow, value, icon, color, bg, border }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.22)] p-5"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${color} opacity-70 mb-2`}
            >
              {eyebrow}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${border} ${bg} ${color}`}
              >
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & filter bar ───────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search by name, username or email…"
              className="h-11 rounded-2xl border-border/70 bg-background/80 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="data-[size=default]:h-11 w-full rounded-2xl border-border/70 bg-background/80 sm:w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="data-[size=default]:h-11 w-full rounded-2xl border-border/70 bg-background/80 sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMembers}
            disabled={loading}
            title="Refresh members"
            className="h-11 w-11 shrink-0 rounded-2xl border-border/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </section>

      {/* ── Table ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading members…
            </p>
          </div>
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 bg-linear-to-br from-primary/8 via-background to-background hover:bg-transparent">
                  <TableHead className="pl-6 w-[18%]">
                    <button
                      type="button"
                      onClick={() =>
                        setNameSortDir((d) => (d === "asc" ? "desc" : "asc"))
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground/70 transition-colors hover:text-foreground"
                    >
                      Member
                      {nameSortDir === "asc" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20V4" />
                          <path d="m5 11 7-7 7 7" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 4v16" />
                          <path d="m19 13-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Username
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Role
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Team Info
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Total
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    To Do
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    In Progress
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Blocked
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    In Review
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Completed
                  </TableHead>
                  <TableHead className="pr-6 text-center text-[11px] font-semibold uppercase text-muted-foreground/70">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      No members match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMembers.map((member) => {
                    const managerId =
                      typeof member.managerId === "object"
                        ? (member.managerId?._id ??
                          member.managerId?.toString())
                        : member.managerId;

                    let teamInfoCell: React.ReactNode = (
                      <span className="text-muted-foreground/40">—</span>
                    );
                    if (["Manager", "Admin"].includes(member.role)) {
                      const count = teamSizeByManager[member._id] ?? 0;
                      teamInfoCell = (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/60 bg-blue-50/60 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-400">
                          <Users className="h-3 w-3" />
                          {count} {count === 1 ? "member" : "members"}
                        </span>
                      );
                    } else if (member.role === "Member" && managerId) {
                      const mgrName = managerNameById[managerId];
                      teamInfoCell = mgrName ? (
                        <span className="text-xs text-muted-foreground">
                          {mgrName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      );
                    }

                    return (
                      <TableRow
                        key={member._id}
                        className="group cursor-pointer border-border/50 transition-colors duration-150 hover:bg-muted/40"
                        onClick={() =>
                          router.push(`/dashboard/members/${member._id}`)
                        }
                      >
                        {/* Member name + monogram avatar */}
                        <TableCell className="pl-6 py-3">
                          <Link
                            href={`/dashboard/members/${member._id}`}
                            className="flex items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-xs font-bold text-primary ring-1 ring-border/50">
                              {member.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                {member.name}
                              </p>
                              {member.email && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {member.email}
                                </p>
                              )}
                            </div>
                          </Link>
                        </TableCell>

                        {/* Username */}
                        <TableCell className="text-center">
                          <span className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground/70">
                            @{member.username}
                          </span>
                        </TableCell>

                        {/* Role badge */}
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(member.role)}`}
                          >
                            {member.role}
                          </span>
                        </TableCell>

                        {/* Team info */}
                        <TableCell className="text-center">
                          {teamInfoCell}
                        </TableCell>

                        {/* Total tasks */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                            {member.tasksCount ?? 0}
                          </span>
                        </TableCell>

                        {/* To Do */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                            {member.toDoTasks ?? 0}
                          </span>
                        </TableCell>

                        {/* In Progress */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full border border-blue-200/60 bg-blue-50/60 px-2.5 py-0.5 text-xs tabular-nums text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-400">
                            {member.inProgressTasks ?? 0}
                          </span>
                        </TableCell>

                        {/* Blocked */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full border border-red-200/60 bg-red-50/60 px-2.5 py-0.5 text-xs tabular-nums text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-400">
                            {member.blockedTasks ?? 0}
                          </span>
                        </TableCell>

                        {/* In Review */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full border border-violet-200/60 bg-violet-50/60 px-2.5 py-0.5 text-xs tabular-nums text-violet-700 dark:border-violet-800/60 dark:bg-violet-900/20 dark:text-violet-400">
                            {member.inReviewTasks ?? 0}
                          </span>
                        </TableCell>

                        {/* Completed */}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-50/60 px-2.5 py-0.5 text-xs tabular-nums text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {member.completedTasks ?? 0}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell
                          className="pr-6 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className={`h-7 rounded-xl border text-xs transition-colors ${
                                member.isActive
                                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-400"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400"
                              }`}
                              onClick={() =>
                                toggleMemberStatus(member._id, member.isActive)
                              }
                            >
                              {member.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {!loading && filteredMembers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredMembers.length)}
            </span>{" "}
            of <span className="font-medium">{filteredMembers.length}</span>{" "}
            members
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                Rows per page
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v) as PageSizeOption)}
              >
                <SelectTrigger className="data-[size=default]:h-8 w-17.5 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="whitespace-nowrap px-1 text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

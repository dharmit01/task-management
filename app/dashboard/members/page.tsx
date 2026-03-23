'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Shield, UserCheck, Users, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

function getRoleBadgeClass(role: string) {
  if (role === 'Admin') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';
  if (role === 'Manager') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
}

export default function MembersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Member',
    managerId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [nameSortDir, setNameSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchMembers();
    fetchManagers();
  }, [isAdmin]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/api/users');
      console.log(response);
      setMembers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await apiClient.get<any>('/api/users');
      const managersList = (response.users || []).filter(
        (user: any) => user.role === 'Manager' || user.role === 'Admin'
      );
      setManagers(managersList);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
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
      if (formData.role === 'Member' && formData.managerId) {
        payload.managerId = formData.managerId;
      }
      await apiClient.post('/api/users', payload);
      alert('Member created successfully!');
      setDialogOpen(false);
      setFormData({ name: '', username: '', email: '', password: '', role: 'Member', managerId: '' });
      fetchMembers();
    } catch (error: any) {
      console.error('Failed to create member:', error);
      alert(error.message || 'Failed to create member');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/users/${memberId}`, { isActive: !currentStatus });
      fetchMembers();
    } catch (error) {
      console.error('Failed to update member status:', error);
      alert('Failed to update member status');
    }
  };

  // Derive team info lookups from the full members list
  const teamSizeByManager = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      if (m.managerId) {
        const id = typeof m.managerId === 'object' ? m.managerId._id ?? m.managerId.toString() : m.managerId;
        map[id] = (map[id] || 0) + 1;
      }
    });
    return map;
  }, [members]);

  const managerNameById = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      if (m.role === 'Manager' || m.role === 'Admin') {
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
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? m.isActive : !m.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...result].sort((a, b) => {
      const cmp = (a.name ?? '').localeCompare(b.name ?? '');
      return nameSortDir === 'asc' ? cmp : -cmp;
    });
  }, [members, searchQuery, roleFilter, statusFilter, nameSortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(
    () => filteredMembers.slice((page - 1) * pageSize, page * pageSize),
    [filteredMembers, page, pageSize]
  );

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.isActive).length,
    managers: members.filter((m) => m.role === 'Manager').length,
    membersCount: members.filter((m) => m.role === 'Member').length,
  }), [members]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between p-6 bg-linear-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl border border-indigo-500/20">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">Members</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage team members and their access</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Member</DialogTitle>
              <DialogDescription>Add a new team member with their credentials</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value, managerId: '' })}
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

              {formData.role === 'Member' && (
                <div className="space-y-2">
                  <Label htmlFor="manager">Assign Manager</Label>
                  <Select
                    value={formData.managerId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, managerId: value === 'none' ? '' : value })}
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
                  {submitting ? 'Creating...' : 'Create Member'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Members</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Managers</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.managers}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.membersCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, username or email…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-36">
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
          <SelectTrigger className="w-full sm:w-36">
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
          className='cursor-pointer'
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading members…</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="pl-4 py-2">
                  <button
                    type="button"
                    onClick={() => setNameSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors group"
                    title={`Sort by name ${nameSortDir === 'asc' ? 'descending' : 'ascending'}`}
                  >
                    Member
                    <span className="text-muted-foreground group-hover:text-foreground">
                      {nameSortDir === 'asc' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V4" /><path d="m5 11 7-7 7 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16" /><path d="m19 13-7 7-7-7" /></svg>
                      )}
                    </span>
                  </button>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team Info</TableHead>
                <TableHead>Leave Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='bg-white'>
              {paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    No members match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member) => {
                  const managerId = typeof member.managerId === 'object'
                    ? member.managerId?._id ?? member.managerId?.toString()
                    : member.managerId;

                  let teamInfoCell: React.ReactNode = <span className="text-gray-400">—</span>;
                  if (['Manager', 'Admin'].includes(member.role)) {
                    const count = teamSizeByManager[member._id] ?? 0;
                    teamInfoCell = (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Users className="h-3.5 w-3.5" />
                        {count} {count === 1 ? 'member' : 'members'}
                      </span>
                    );
                  } else if (member.role === 'Member' && managerId) {
                    const mgrName = managerNameById[managerId];
                    teamInfoCell = mgrName ? (
                      <span className="text-gray-700 dark:text-gray-300">{mgrName}</span>
                    ) : <span className="text-gray-400">—</span>;
                  }

                  return (
                    <TableRow key={member._id} className='cursor-pointer' onClick={() => router.push(`/dashboard/members/${member._id}`)} >
                      <TableCell className="pl-4 py-2">
                        <Link href={`/dashboard/members/${member._id}`} className="group">
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">@{member.username}</p>
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                        {member.email || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(member.role)}`}>
                          {member.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{teamInfoCell}</TableCell>
                      <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                        {member.annualLeaveBalance} days
                      </TableCell>
                      <TableCell>
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700">
                            <UserCheck className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700">
                            <UserX className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/members/${member._id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer">
                              View Tasks
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className={`h-7 text-xs cursor-pointer ${member.isActive
                              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                              : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                              }`}
                            onClick={() => toggleMemberStatus(member._id, member.isActive)}
                          >
                            {member.isActive ? 'Deactivate' : 'Activate'}
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
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v) as PageSizeOption)}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredMembers.length > 0 && (
              <span className="ml-1">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredMembers.length)} of {filteredMembers.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="font-medium px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

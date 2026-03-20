'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import dayjs from "dayjs";
import { ArrowLeft, Calendar, Edit, Mail, Save, UserCheck, UserX, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type UserRole = 'Admin' | 'Member' | 'Manager';

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
  role: 'Member';
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
  managerId?: {
    _id: string;
    name: string;
    username: string;
    email?: string;
  } | string;
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

interface TasksResponse {
  tasks?: Task[];
}

interface UpdateUserPayload {
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  managerId?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  taskList: {
    _id: string;
    name: string;
    color: string;
  };
  priority: string;
  status: string;
  assignedTo: Array<{
    _id: string;
    name: string;
  }>;
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [memberId, setMemberId] = useState<string>('');
  const [member, setMember] = useState<Member | null>(null);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLeaveBalance, setEditingLeaveBalance] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<number>(15);
  const [updating, setUpdating] = useState(false);
  const [editingUserDetails, setEditingUserDetails] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    role: 'Member' as 'Admin' | 'Member' | 'Manager',
    isActive: true,
    managerId: '',
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setMemberId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (memberId) {
      fetchMemberDetails();
      fetchMemberTasks();
      fetchManagers();
    }
  }, [isAdmin, memberId, router]);

  const fetchMemberDetails = async () => {
    try {
      const response = await apiClient.get<MemberDetailResponse>(`/api/users/${memberId}`);
      setMember(response.user);
      setTeamMembers(response.teamMembers || []);
      setLeaveBalance(response.user.annualLeaveBalance || 15);
      const managerIdValue = response.user.managerId?._id || response.user.managerId || '';
      setUserForm({
        name: response.user.name,
        username: response.user.username,
        email: response.user.email || '',
        role: response.user.role,
        isActive: response.user.isActive,
        managerId: managerIdValue,
      });
    } catch (error) {
      console.error('Failed to fetch member details:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await apiClient.get<UsersResponse>('/api/users');
      const managersList = (response.users || []).filter(
        (user) => (user.role === 'Manager' || user.role === 'Admin') && user._id !== memberId
      );
      setManagers(managersList);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const fetchMemberTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<TasksResponse>(`/api/tasks?assignedTo=${memberId}`);
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to fetch member tasks:', error);
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

  const getRoleBadgeClass = (role: UserRole) => {
    if (role === 'Admin') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    if (role === 'Manager') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';

    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
  };

  const isOverdue = (endDate: string, status: string) => {
    return new Date(endDate) < new Date() && status !== 'Completed';
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In-Progress').length;
    const overdue = tasks.filter((t) => isOverdue(t.endDate, t.status)).length;
    return { total, completed, inProgress, overdue };
  };

  const handleUpdateLeaveBalance = async () => {
    if (leaveBalance < 0) {
      toast.error('Leave balance cannot be negative');
      return;
    }

    try {
      setUpdating(true);
      await apiClient.patch(`/api/users/${memberId}`, {
        annualLeaveBalance: leaveBalance,
      });
      toast.success('Leave balance updated successfully');
      setEditingLeaveBalance(false);
      fetchMemberDetails();
    } catch (error) {
      console.error('Failed to update leave balance:', error);
      toast.error('Failed to update leave balance');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateUserDetails = async () => {
    if (!userForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!userForm.username.trim()) {
      toast.error('Username is required');
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
      if (userForm.role === 'Member') {
        payload.managerId = userForm.managerId || '';
      }
      await apiClient.patch(`/api/users/${memberId}`, payload);
      toast.success('User details updated successfully');
      setEditingUserDetails(false);
      fetchMemberDetails();
    } catch (error) {
      console.error('Failed to update user details:', error);
      toast.error('Failed to update user details');
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
          <Button variant="ghost" size="sm" className='cursor-pointer mb-4'>
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

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/members">
        <Button variant="ghost" size="sm" className='cursor-pointer mb-4'>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Members
        </Button>
      </Link>

      {/* Member Information Card */}
      {member && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Member Details</CardTitle>
                <CardDescription>View and edit member information</CardDescription>
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
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value: 'Admin' | 'Member' | 'Manager') => setUserForm({ ...userForm, role: value, managerId: '' })}
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
                      value={userForm.isActive ? 'active' : 'inactive'}
                      onValueChange={(value) => setUserForm({ ...userForm, isActive: value === 'active' })}
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
                  {userForm.role === 'Member' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="manager-edit">Assign Manager</Label>
                      <Select
                        value={userForm.managerId || 'none'}
                        onValueChange={(value) => setUserForm({ ...userForm, managerId: value === 'none' ? '' : value })}
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
                    {updating ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingUserDetails(false);
                      const managerIdValue = member?.managerId && typeof member.managerId === 'object'
                        ? member.managerId._id
                        : (typeof member?.managerId === 'string' ? member.managerId : '');
                      setUserForm({
                        name: member.name,
                        username: member.username,
                        email: member.email || '',
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Username</p>
                    <p className="font-medium">@{member.username}</p>
                  </div>
                  {member.email && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                    <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                  {member.role === 'Member' && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Manager</p>
                      <p className="font-medium">
                        {member.managerId && typeof member.managerId === 'object'
                          ? member.managerId.name
                          : 'No Manager Assigned'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <Badge variant={member.isActive ? 'default' : 'destructive'}>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Joined</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {dayjs(member.createdAt).format('D MMMM, YYYY')}
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
                <CardDescription>Manage member&apos;s yearly leave allocation</CardDescription>
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
                    {updating ? 'Saving...' : 'Save'}
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

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
          <CardDescription>
            All tasks assigned to {member?.name || 'this member'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No tasks assigned yet
            </p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Link key={task._id} href={`/dashboard/tasks/${task._id}`}>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          {isOverdue(task.endDate, task.status) && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: task.taskList.color }}
                            />
                            <span>{task.taskList.name}</span>
                          </div>
                          <span>•</span>
                          <span>
                            📅 {new Date(task.startDate).toLocaleDateString()} -{' '}
                            {new Date(task.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {member?.role === 'Manager' && (
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
                {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
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
                        onClick={() => router.push(`/dashboard/members/${teamMember._id}`)}
                      >
                        <TableCell className="pl-4 py-4">
                          <Link href={`/dashboard/members/${teamMember._id}`} className="group">
                            <p className="font-medium text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                              {teamMember.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              @{teamMember.username}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {teamMember.email || <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(teamMember.role)}`}>
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

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Calendar, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Leave {
  _id: string;
  leaveType: 'full' | 'half';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  leaveDays: number;
  applicant: {
    _id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    name: string;
    email: string;
  };
  rejectionReason?: string;
  createdAt: string;
}

export default function LeavesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewingUserId = searchParams.get('userId');

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [viewingUser, setViewingUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetchLeaves();
    if (user?._id) {
      // Fetch balance for the user being viewed or current user
      const userIdToFetch = viewingUserId || user._id;
      fetchLeaveBalance(userIdToFetch);

      // Fetch viewing user details if viewing someone else
      if (viewingUserId && isAdmin) {
        fetchViewingUserDetails();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, viewingUserId]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // If viewing another user's leaves (admin only)
      if (viewingUserId && isAdmin) {
        params.append('applicant', viewingUserId);
      } else if (user?._id) {
        // Otherwise, always filter by current user's leaves
        params.append('applicant', user._id);
      }

      const response = await apiClient.get<{ success: boolean; leaves: Leave[] }>(
        `/api/leaves?${params.toString()}`
      );
      setLeaves(response.leaves || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async (userId: string) => {
    if (!userId) {
      console.error('No user ID provided for fetching leave balance');
      return;
    }

    try {
      const response = await apiClient.get<{ success: boolean; user: { annualLeaveBalance: number; name: string; email: string } }>(
        `/api/users/${userId}`
      );
      setLeaveBalance(response.user.annualLeaveBalance || 15);
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
      // Set default balance on error
      setLeaveBalance(15);
    }
  };

  const fetchViewingUserDetails = async () => {
    if (!viewingUserId) {
      return;
    }

    try {
      const response = await apiClient.get<{ success: boolean; user: { name: string; email: string } }>(
        `/api/users/${viewingUserId}`
      );
      setViewingUser(response.user);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUsedLeaves = () => {
    return leaves
      .filter(l => {
        // Only count leaves for the current viewing user
        if (viewingUserId) {
          return l.applicant._id === viewingUserId && (l.status === 'approved' || l.status === 'pending');
        }
        // When not viewing specific user, count only current user's leaves
        return l.applicant._id === user?._id && (l.status === 'approved' || l.status === 'pending');
      })
      .reduce((sum, l) => sum + l.leaveDays, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leaves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-linear-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-2xl border border-green-500/20">
        <div className="flex items-center gap-4">
          {viewingUserId && isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/leaves')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-green-500 via-emerald-500 to-green-500 bg-clip-text text-transparent">
              {viewingUserId && isAdmin ? 'Leave History' : 'My Leaves'}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {viewingUserId && isAdmin
                ? `Leave history for ${viewingUser?.name || 'member'} 🏝️`
                : 'Manage your leave applications 🌴'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(!viewingUserId || !isAdmin) && (
            <Link href="/dashboard/leaves/new">
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="mr-2 h-5 w-5" />
                Apply Leave
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Leave Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {viewingUserId && isAdmin ? 'Leave Balance' : 'Total Leave Balance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveBalance} days</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {viewingUserId && isAdmin ? `${viewingUser?.name || 'Member'}'s allocation` : 'Annual allocation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Used / Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUsedLeaves()} days</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Approved + Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leaveBalance - getUsedLeaves()} days
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Remaining this year</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Applications</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Leaves List */}
      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No leave applications found
            </p>
            <Link href="/dashboard/leaves/new">
              <Button className="mt-4" variant="outline">
                Apply for Leave
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <Link key={leave._id} href={`/dashboard/leaves/${leave._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {leave.leaveType === 'half' ? 'Half Day' : 'Full Day'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {leave.leaveDays} {leave.leaveDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(leave.startDate)}
                            {leave.startDate !== leave.endDate && ` - ${formatDate(leave.endDate)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Applied on {formatDate(leave.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        {leave.reason}
                      </p>

                      {leave.status === 'approved' && leave.approvedBy && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Approved by {leave.approvedBy.name}
                        </p>
                      )}

                      {leave.status === 'rejected' && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          Rejected{leave.rejectionReason && `: ${leave.rejectionReason}`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

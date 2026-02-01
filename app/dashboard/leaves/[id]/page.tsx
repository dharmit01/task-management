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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Calendar, Clock, FileText, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const leaveId = params?.id as string;

  useEffect(() => {
    if (leaveId) {
      fetchLeaveDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveId]);

  const fetchLeaveDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; leave: Leave }>(
        `/api/leaves/${leaveId}`
      );
      setLeave(response.leave);
    } catch (error: unknown) {
      console.error('Failed to fetch leave:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Access denied')) {
        toast.error('You do not have permission to view this leave');
        router.push('/dashboard/leaves');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async () => {
    try {
      setDeleting(true);
      await apiClient.delete(`/api/leaves/${leaveId}`);
      toast.success('Leave application cancelled successfully');
      router.push('/dashboard/leaves');
    } catch (error) {
      console.error('Failed to cancel leave:', error);
      toast.error('Failed to cancel leave application');
      setDeleting(false);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leave details...</p>
        </div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Leave not found</p>
        <Link href="/dashboard/leaves">
          <Button className="mt-4" variant="outline">
            Back to Leaves
          </Button>
        </Link>
      </div>
    );
  }

  const canCancel = leave.status === 'pending' && leave.applicant._id === user?._id;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}
      <Link href="/dashboard/leaves">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leaves
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leave Application Details
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={getStatusColor(leave.status)}>
              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
            </Badge>
            <Badge variant="outline">
              {leave.leaveType === 'half' ? 'Half Day' : 'Full Day'}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {leave.leaveDays} {leave.leaveDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Application
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel your leave application. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelLeave}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Cancelling...' : 'Yes, cancel application'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Leave Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {leave.reason}
              </p>
            </CardContent>
          </Card>

          {leave.status === 'rejected' && leave.rejectionReason && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">{leave.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leave Period */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">Start Date</div>
                  <div className="text-gray-900 dark:text-white">{formatDate(leave.startDate)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">End Date</div>
                  <div className="text-gray-900 dark:text-white">{formatDate(leave.endDate)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">Duration</div>
                  <div className="text-gray-900 dark:text-white">
                    {leave.leaveDays} {leave.leaveDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">Applicant</div>
                  <div className="text-gray-900 dark:text-white">{leave.applicant.name}</div>
                  <div className="text-xs text-gray-500">{leave.applicant.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-500 dark:text-gray-400">Applied On</div>
                  <div className="text-gray-900 dark:text-white">
                    {formatDateTime(leave.createdAt)}
                  </div>
                </div>
              </div>

              {leave.approvedBy && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-500 dark:text-gray-400">
                      {leave.status === 'approved' ? 'Approved By' : 'Reviewed By'}
                    </div>
                    <div className="text-gray-900 dark:text-white">{leave.approvedBy.name}</div>
                    <div className="text-xs text-gray-500">{leave.approvedBy.email}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

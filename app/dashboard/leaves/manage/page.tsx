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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Calendar, Check, Clock, Mail, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    role: string;
  };
  approvedBy?: {
    name: string;
    email: string;
  };
  rejectionReason?: string;
  createdAt: string;
}

export default function ManageLeavesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Approve dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  
  // Reject dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchLeaves();
  }, [isAdmin, router, statusFilter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
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

  const handleApproveClick = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (leave: Leave) => {
    setSelectedLeave(leave);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedLeave) return;

    try {
      setProcessing(selectedLeave._id);
      await apiClient.patch(`/api/leaves/${selectedLeave._id}`, {
        status: 'approved',
      });
      toast.success('Leave approved successfully');
      setShowApproveDialog(false);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (error) {
      console.error('Failed to approve leave:', error);
      toast.error('Failed to approve leave');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedLeave) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(selectedLeave._id);
      await apiClient.patch(`/api/leaves/${selectedLeave._id}`, {
        status: 'rejected',
        rejectionReason: rejectionReason,
      });
      toast.success('Leave rejected');
      setShowRejectDialog(false);
      setSelectedLeave(null);
      setRejectionReason('');
      fetchLeaves();
    } catch (error) {
      console.error('Failed to reject leave:', error);
      toast.error('Failed to reject leave');
    } finally {
      setProcessing(null);
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

  if (!isAdmin) {
    return null;
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Leaves</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Review and approve team leave requests
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Leaves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row items-center gap-4">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
            </Select>
        </div>
        </CardContent>
      </Card>

      {/* Leaves List */}
      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No leave applications found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <Card key={leave._id} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section - User Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {leave.applicant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {leave.applicant.name}
                          </h3>
                          <Badge className={getStatusColor(leave.status)}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">
                            {leave.leaveType === 'half' ? 'Half Day' : 'Full Day'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{leave.applicant.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{leave.applicant.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              {formatDate(leave.startDate)}
                              {leave.startDate !== leave.endDate && ` - ${formatDate(leave.endDate)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {leave.leaveDays} {leave.leaveDays === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Reason:</p>
                          <p className="text-gray-700 dark:text-gray-300">{leave.reason}</p>
                        </div>

                        {leave.status === 'approved' && leave.approvedBy && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Approved by {leave.approvedBy.name}
                          </p>
                        )}

                        {leave.status === 'rejected' && leave.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              <strong>Rejection Reason:</strong> {leave.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  {leave.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveClick(leave)}
                        disabled={processing === leave._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(leave)}
                        disabled={processing === leave._id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this leave request for{' '}
              <strong>{selectedLeave?.applicant.name}</strong>?
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm">
                  <strong>Duration:</strong> {selectedLeave?.leaveDays}{' '}
                  {selectedLeave?.leaveDays === 1 ? 'day' : 'days'}
                </p>
                <p className="text-sm">
                  <strong>Period:</strong> {selectedLeave && formatDate(selectedLeave.startDate)}
                  {selectedLeave?.startDate !== selectedLeave?.endDate &&
                    ` - ${selectedLeave && formatDate(selectedLeave.endDate)}`}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog with Reason */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting <strong>{selectedLeave?.applicant.name}</strong>'s leave request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm">
                <strong>Applicant:</strong> {selectedLeave?.applicant.name}
              </p>
              <p className="text-sm">
                <strong>Duration:</strong> {selectedLeave?.leaveDays}{' '}
                {selectedLeave?.leaveDays === 1 ? 'day' : 'days'}
              </p>
              <p className="text-sm">
                <strong>Period:</strong> {selectedLeave && formatDate(selectedLeave.startDate)}
                {selectedLeave?.startDate !== selectedLeave?.endDate &&
                  ` - ${selectedLeave && formatDate(selectedLeave.endDate)}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explain why this leave request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

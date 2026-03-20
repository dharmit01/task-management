'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Calendar, Check, Clock, X } from 'lucide-react';
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
  };
  createdAt: string;
}

export default function PendingLeavesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchPendingLeaves();
  }, [isAdmin, router]);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; leaves: Leave[] }>(
        '/api/leaves?status=pending'
      );
      setLeaves(response.leaves || []);
    } catch (error) {
      console.error('Failed to fetch pending leaves:', error);
      toast.error('Failed to fetch pending leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      setProcessing(leaveId);
      await apiClient.patch(`/api/leaves/${leaveId}`, {
        status: 'approved',
      });
      toast.success('Leave approved successfully');
      fetchPendingLeaves();
    } catch (error) {
      console.error('Failed to approve leave:', error);
      toast.error('Failed to approve leave');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClick = (leave: Leave) => {
    setSelectedLeave(leave);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedLeave) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(selectedLeave._id);
      await apiClient.patch(`/api/leaves/${selectedLeave._id}`, {
        status: 'rejected',
        rejectionReason,
      });
      toast.success('Leave rejected successfully');
      setShowRejectDialog(false);
      setSelectedLeave(null);
      setRejectionReason('');
      fetchPendingLeaves();
    } catch (error) {
      console.error('Failed to reject leave:', error);
      toast.error('Failed to reject leave');
    } finally {
      setProcessing(null);
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pending leaves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-linear-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 rounded-2xl border border-amber-500/20">
        <h1 className="text-4xl font-bold bg-linear-to-r from-amber-500 via-yellow-500 to-amber-500 bg-clip-text text-transparent">Pending Leave Approvals</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Review and approve leave applications ⏳
        </p>
      </div>

      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No pending leave applications
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <Card key={leave._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{leave.applicant.name}</CardTitle>
                    <CardDescription>{leave.applicant.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {leave.leaveType === 'half' ? 'Half Day' : 'Full Day'}
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Start Date</div>
                      <div className="font-medium">{formatDate(leave.startDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">End Date</div>
                      <div className="font-medium">{formatDate(leave.endDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Duration</div>
                      <div className="font-medium">
                        {leave.leaveDays} {leave.leaveDays === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{leave.reason}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleApprove(leave._id)}
                    disabled={processing !== null}
                    className="flex-1"
                  >
                    {processing === leave._id ? (
                      'Processing...'
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRejectClick(leave)}
                    disabled={processing !== null}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedLeave && (
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Applicant:</span> {selectedLeave.applicant.name}
                </p>
                <p>
                  <span className="font-medium">Duration:</span> {selectedLeave.leaveDays}{' '}
                  {selectedLeave.leaveDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Provide a clear reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{rejectionReason.length}/500 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing !== null || !rejectionReason.trim()}
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

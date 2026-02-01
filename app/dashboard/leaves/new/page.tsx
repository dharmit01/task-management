'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ApplyLeavePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<number>(15);
  const [usedLeaves, setUsedLeaves] = useState<number>(0);
  const [formData, setFormData] = useState({
    leaveType: 'full',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (user) {
      fetchLeaveData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLeaveData = async () => {
    try {
      // Fetch user's leave balance
      const userResponse = await apiClient.get<{ success: boolean; user: { annualLeaveBalance: number } }>(
        `/api/users/${user?._id}`
      );
      setLeaveBalance(userResponse.user.annualLeaveBalance || 15);

      // Fetch used leaves
      const leavesResponse = await apiClient.get<{ success: boolean; leaves: Array<{ leaveDays: number; status: string }> }>(
        '/api/leaves'
      );
      const used = leavesResponse.leaves
        .filter(l => l.status === 'approved' || l.status === 'pending')
        .reduce((sum, l) => sum + l.leaveDays, 0);
      setUsedLeaves(used);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
    }
  };

  const calculateLeaveDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    if (formData.leaveType === 'half') return 0.5;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (!formData.reason.trim() || formData.reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    const leaveDays = calculateLeaveDays();
    const available = leaveBalance - usedLeaves;

    if (leaveDays > available) {
      toast.error(`Insufficient leave balance. You have ${available} days available.`);
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/api/leaves', {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      toast.success('Leave application submitted successfully!');
      router.push('/dashboard/leaves');
    } catch (error: unknown) {
      console.error('Failed to apply leave:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Insufficient leave balance')) {
        toast.error('Insufficient leave balance');
      } else if (errorMessage.includes('Half day leave must be for a single day')) {
        toast.error('Half day leave must be for a single day');
      } else {
        toast.error('Failed to submit leave application');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTypeChange = (value: string) => {
    setFormData({ ...formData, leaveType: value, endDate: value === 'half' ? formData.startDate : formData.endDate });
  };

  const handleStartDateChange = (value: string) => {
    setFormData({
      ...formData,
      startDate: value,
      endDate: formData.leaveType === 'half' ? value : formData.endDate,
    });
  };

  const leaveDays = calculateLeaveDays();
  const availableBalance = leaveBalance - usedLeaves;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/leaves">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leaves
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Apply for Leave</CardTitle>
          <CardDescription>Submit a new leave application for approval</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Leave Balance Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Leave Balance Information
                </p>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Total:</span>
                    <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
                      {leaveBalance} days
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Used:</span>
                    <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
                      {usedLeaves} days
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Available:</span>
                    <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
                      {availableBalance} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={formData.leaveType}
                onValueChange={handleLeaveTypeChange}
                disabled={loading}
              >
                <SelectTrigger id="leaveType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Day</SelectItem>
                  <SelectItem value="half">Half Day (0.5 day)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.leaveType === 'half'
                  ? 'Half day leave is for a single day only'
                  : 'Full day leave can span multiple days (weekends excluded)'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.leaveType === 'half' ? formData.startDate : formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  disabled={loading || formData.leaveType === 'half'}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {leaveDays > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Requesting:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {leaveDays} {leaveDays === 1 ? 'day' : 'days'}
                  </span>
                  {leaveDays > availableBalance && (
                    <span className="ml-2 text-red-600 dark:text-red-400 text-xs">
                      (Exceeds available balance by {leaveDays - availableBalance} days)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your leave application (minimum 10 characters)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                disabled={loading}
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.reason.length}/500 characters
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || leaveDays > availableBalance}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Link href="/dashboard/leaves">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

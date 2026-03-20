'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Calendar, Mail, Save, User, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TeamMemberDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  annualLeaveBalance: number;
  createdAt: string;
}

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isManager } = useAuth();
  const [member, setMember] = useState<TeamMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editBalance, setEditBalance] = useState(0);
  const [saving, setSaving] = useState(false);

  const memberId = params?.id as string;

  const fetchMemberDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; user: TeamMemberDetail }>(
        `/api/users/${memberId}`
      );
      setMember(response.user);
      setEditBalance(response.user.annualLeaveBalance);
    } catch (error: unknown) {
      console.error('Failed to fetch member details:', error);
      toast.error('Failed to load member details');
      router.push('/dashboard/team');
    } finally {
      setLoading(false);
    }
  }, [memberId, router]);

  useEffect(() => {
    if (!isManager) {
      router.push('/dashboard');
      return;
    }

    if (memberId) {
      fetchMemberDetails();
    }
  }, [memberId, isManager, router, fetchMemberDetails]);

  const handleEditBalance = () => {
    setEditBalance(member?.annualLeaveBalance || 0);
    setIsEditingBalance(true);
  };

  const handleCancelEdit = () => {
    setEditBalance(member?.annualLeaveBalance || 0);
    setIsEditingBalance(false);
  };

  const handleSaveBalance = async () => {
    if (editBalance < 0) {
      toast.error('Leave balance cannot be negative');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.patch<{ success: boolean; user: TeamMemberDetail }>(
        `/api/users/${memberId}`,
        { annualLeaveBalance: editBalance }
      );
      setMember(response.user);
      setIsEditingBalance(false);
      toast.success('Leave balance updated successfully');
    } catch (error: unknown) {
      console.error('Failed to update leave balance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update leave balance';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Member not found</p>
        <Link href="/dashboard/team">
          <Button className="mt-4" variant="outline">
            Back to Team
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/team">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Member Details</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and manage team member information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Member account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {member.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{member.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.email && (
              <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {member.email}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                <Badge variant="secondary">{member.role}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant={member.isActive ? 'default' : 'destructive'}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>Manage annual leave allocation</CardDescription>
            </div>
            {!isEditingBalance && (
              <Button onClick={handleEditBalance} variant="outline" size="sm">
                Edit Balance
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingBalance ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveBalance">Annual Leave Balance (Days)</Label>
                <Input
                  id="leaveBalance"
                  type="number"
                  min="0"
                  value={editBalance}
                  onChange={(e) => setEditBalance(parseInt(e.target.value) || 0)}
                  disabled={saving}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveBalance} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Leave Days</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {member.annualLeaveBalance}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

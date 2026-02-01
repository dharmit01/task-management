'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Calendar, Mail, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Leave {
  _id: string;
  leaveType: 'full' | 'half';
  startDate: string;
  endDate: string;
  leaveDays: number;
  applicant: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function TodayLeavesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchTodayLeaves();
  }, [isAdmin, router]);

  const fetchTodayLeaves = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; leaves: Leave[] }>(
        '/api/leaves?filter=today'
      );
      setLeaves(response.leaves || []);
    } catch (error) {
      console.error('Failed to fetch today\'s leaves:', error);
      toast.error('Failed to fetch today\'s leaves');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading today&apos;s leaves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Members on Leave Today</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {getTodayDate()}
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Members on Leave Today</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{leaves.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaves List */}
      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No members on leave today
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              All team members are available
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <Link key={leave._id} href={`/dashboard/leaves/${leave._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{leave.applicant.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3" />
                        {leave.applicant.email}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {leave.leaveType === 'half' ? 'Half Day' : 'Full Day'}
                      </Badge>
                      <Badge variant="secondary">{leave.applicant.role}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Leave Period</div>
                        <div className="font-medium">
                          {formatDate(leave.startDate)}
                          {leave.startDate !== leave.endDate && (
                            <> - {formatDate(leave.endDate)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Duration</div>
                        <div className="font-medium">
                          {leave.leaveDays} {leave.leaveDays === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                        On Leave
                      </div>
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

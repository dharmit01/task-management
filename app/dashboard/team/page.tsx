'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Calendar, Mail, User, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  username: string;
  isActive: boolean;
  annualLeaveBalance: number;
  role: string;
}

export default function MyTeamPage() {
  const { isManager } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; teamMembers: TeamMember[] }>(
        '/api/users/team/members'
      );
      setTeamMembers(response.teamMembers || []);
    } catch (error: unknown) {
      console.error('Failed to fetch team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isManager) {
      router.push('/dashboard');
      return;
    }

    fetchTeamMembers();
  }, [isManager, router, fetchTeamMembers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-linear-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl border border-cyan-500/20">
        <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
          <Users className="h-10 w-10 text-cyan-500" />
          My Team
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your team members and their details 👨‍👩‍👧‍👦
        </p>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Team Members
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You don&apos;t have any team members assigned yet. Contact your admin to assign members to your team.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <Badge variant={member.isActive ? 'default' : 'destructive'} className="mt-1">
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    @{member.username}
                  </span>
                </div>

                {member.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300 truncate text-xs">
                      {member.email}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Leave Balance: <span className="font-semibold">{member.annualLeaveBalance} days</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Role: {member.role}</span>
                </div>

                <div className="pt-2">
                  <Link href={`/dashboard/team/${member._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

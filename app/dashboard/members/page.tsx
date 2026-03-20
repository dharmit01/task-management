'use client';

import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Plus, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MembersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Member',
    managerId: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Members
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage team members and their access
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Member</DialogTitle>
              <DialogDescription>
                Add a new team member with their credentials
              </DialogDescription>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading members...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member._id} className="hover:shadow-lg transition-shadow">
              <Link href={`/dashboard/members/${member._id}`}>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {member.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        @{member.username}
                      </p>
                      {member.email && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {member.email}
                        </p>
                      )}
                    </div>
                    {member.isActive ? (
                      <UserCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <UserX className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>
              </Link>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Role:</span>
                    <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                    <Badge variant={member.isActive ? 'default' : 'destructive'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="pt-2 space-y-2 flex flex-row gap-2">
                    <Link href={`/dashboard/members/${member._id}`}>
                      <Button size="sm" className="mb-2 bg-gray-200 text-gray-700 hover:text-white">
                        View Tasks
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className='hover:bg-red-600 hover:text-white bg-red-100 text-red-500'
                      onClick={() => toggleMemberStatus(member._id, member.isActive)}
                    >
                      {member.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

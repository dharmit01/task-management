'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, ChevronsUpDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  username: string;
}

interface TaskList {
  _id: string;
  name: string;
  description?: string;
  color: string;
}

function NewTaskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTaskList = searchParams.get('taskList');
  const { isAdmin, isManager } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(false);
  const [openMemberSelect, setOpenMemberSelect] = useState(false);
  const [openTaskListDialog, setOpenTaskListDialog] = useState(false);
  const [newTaskList, setNewTaskList] = useState({ name: '', description: '', color: '#3b82f6' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    taskList: '',
    priority: 'Medium',
    assignedTo: [] as string[],
  });

  useEffect(() => {
    fetchMembers();
    fetchTaskLists();
  }, []);

  const fetchMembers = async () => {
    try {
      // Managers fetch assignable users (team + managers + admins)
      // Admins and Members fetch all users
      const endpoint = isManager ? '/api/users/assignable' : '/api/users';
      const response = await apiClient.get<{ success: boolean; users: User[] }>(endpoint);
      setMembers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchTaskLists = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; taskLists: TaskList[] }>('/api/task-lists');
      setTaskLists(response.taskLists || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  // Pre-select company when navigating from /dashboard/companies/[id]
  useEffect(() => {
    if (preselectedTaskList && taskLists.length > 0) {
      const exists = taskLists.some((tl) => tl._id === preselectedTaskList);
      if (exists) {
        setFormData((prev) => ({ ...prev, taskList: preselectedTaskList }));
      }
    }
  }, [taskLists, preselectedTaskList]);

  const handleCreateTaskList = async () => {
    if (!newTaskList.name.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    try {
      const response = await apiClient.post<{ success: boolean; taskList: TaskList }>('/api/task-lists', newTaskList);
      setTaskLists([...taskLists, response.taskList]);
      setFormData({ ...formData, taskList: response.taskList._id });
      setNewTaskList({ name: '', description: '', color: '#3b82f6' });
      setOpenTaskListDialog(false);
    } catch (error: unknown) {
      console.error('Failed to create company:', error);
      toast.error('Failed to create company');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.taskList) {
      toast.error('Please select a company');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/api/tasks', {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      toast.success('Task created successfully!');
      router.push('/dashboard/tasks');
    } catch (error: unknown) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const selectedMembers = members.filter(m => formData.assignedTo.includes(m._id));
  const selectedTaskList = taskLists.find(tl => tl._id === formData.taskList);

  const colorOptions = [
    { value: '#ef4444', label: 'Red' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#22c55e', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/tasks">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
          <CardDescription>Fill in the details to create a new task</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                disabled={loading}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Company Name *</Label>
                <Dialog open={openTaskListDialog} onOpenChange={setOpenTaskListDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      New Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Company</DialogTitle>
                      <DialogDescription>
                        Create a new company to organize your tasks
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Name *</Label>
                        <Input
                          id="company-name"
                          placeholder="e.g., Development, Design"
                          value={newTaskList.name}
                          onChange={(e) => setNewTaskList({ ...newTaskList, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-description">Description</Label>
                        <Textarea
                          id="company-description"
                          placeholder="Optional description"
                          value={newTaskList.description}
                          onChange={(e) => setNewTaskList({ ...newTaskList, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setNewTaskList({ ...newTaskList, color: color.value })}
                              className={cn(
                                'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                                newTaskList.color === color.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                              )}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenTaskListDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleCreateTaskList}>
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Select
                value={formData.taskList}
                onValueChange={(value) => setFormData({ ...formData, taskList: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company">
                    {selectedTaskList && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedTaskList.color }}
                        />
                        <span>{selectedTaskList.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {taskLists.map((list) => (
                    <SelectItem key={list._id} value={list._id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        <span>{list.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To * (Select one or more members)</Label>
                <Popover open={openMemberSelect} onOpenChange={setOpenMemberSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openMemberSelect}
                      className="w-full justify-between"
                      disabled={loading}
                    >
                      {selectedMembers.length > 0 ? (
                        <span>{selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected</span>
                      ) : (
                        <span className="text-muted-foreground">Select members...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search members..." />
                      <CommandList>
                        <CommandEmpty>No member found.</CommandEmpty>
                        <CommandGroup>
                          {members.map((member) => {
                            const isSelected = formData.assignedTo.includes(member._id);
                            return (
                              <CommandItem
                                key={member._id}
                                value={`${member.name} ${member.username}`}
                                onSelect={() => {
                                  const newAssignees = isSelected
                                    ? formData.assignedTo.filter(id => id !== member._id)
                                    : [...formData.assignedTo, member._id];
                                  setFormData({ ...formData, assignedTo: newAssignees });
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    isSelected ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{member.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    @{member.username} • {member.role}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member._id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded text-sm"
                      >
                        <span>{member.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newAssignees = formData.assignedTo.filter(id => id !== member._id);
                            setFormData({ ...formData, assignedTo: newAssignees });
                          }}
                          className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
              <Link href="/dashboard/tasks">
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

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <NewTaskPageContent />
    </Suspense>
  );
}

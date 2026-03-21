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
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

interface Task {
  _id: string;
  taskId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  taskList: {
    _id: string;
    name: string;
    color: string;
  };
  priority: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
}

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin, isManager } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openMemberSelect, setOpenMemberSelect] = useState(false);
  const [openTaskListDialog, setOpenTaskListDialog] = useState(false);
  const [newTaskList, setNewTaskList] = useState({ name: '', description: '', color: '#3b82f6' });
  const [canEdit, setCanEdit] = useState(false);
  const [taskDisplayId, setTaskDisplayId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    taskList: '',
    priority: 'Medium',
    assignedTo: [] as string[],
    status: 'ToDo',
  });

  const taskId = params?.id as string;

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ task: Task }>(`/api/tasks/${taskId}`);
      const task = response.task;

      // Check if user can edit this task (admin, assignee, or creator)
      const isAssignee = Array.isArray(task.assignedTo) &&
        task.assignedTo.some((a: any) => (a._id || a) === user?._id);
      const isCreator = (task as any).createdBy?._id === user?._id || (task as any).createdBy === user?._id;
      const hasPermission = isAdmin || isAssignee || isCreator;

      if (!hasPermission) {
        toast.error('You do not have permission to edit this task');
        router.push('/dashboard/tasks');
        return;
      }

      setCanEdit(true);
      if (task.taskId) setTaskDisplayId(task.taskId);

      // Convert dates to YYYY-MM-DD format for date inputs
      const startDate = new Date(task.startDate).toISOString().split('T')[0];
      const endDate = new Date(task.endDate).toISOString().split('T')[0];

      // Extract assignee IDs from the array
      const assigneeIds = Array.isArray(task.assignedTo)
        ? task.assignedTo.map((a: any) => a._id || a)
        : [];

      setFormData({
        title: task.title,
        description: task.description,
        startDate,
        endDate,
        taskList: task.taskList?._id || '',
        priority: task.priority,
        assignedTo: assigneeIds,
        status: task.status,
      });
    } catch (error) {
      console.error('Failed to fetch task:', error);
      toast.error('Failed to load task');
      router.push('/dashboard/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchTaskLists();
    if (taskId) {
      fetchTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

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
      console.error('Failed to fetch task lists:', error);
    }
  };

  const handleCreateTaskList = async () => {
    if (!newTaskList.name.trim()) {
      toast.error('Please enter a task list name');
      return;
    }

    try {
      const response = await apiClient.post<{ success: boolean; taskList: TaskList }>('/api/task-lists', newTaskList);
      setTaskLists([...taskLists, response.taskList]);
      setFormData({ ...formData, taskList: response.taskList._id });
      setNewTaskList({ name: '', description: '', color: '#3b82f6' });
      setOpenTaskListDialog(false);
    } catch (error: unknown) {
      console.error('Failed to create task list:', error);
      toast.error('Failed to create task list');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assignedTo || formData.assignedTo.length === 0) {
      toast.error('Please assign the task to at least one member');
      return;
    }

    if (!formData.taskList) {
      toast.error('Please select a task list');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.patch(`/api/tasks/${taskId}`, {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      toast.success('Task updated successfully!');
      router.push(`/dashboard/tasks/${taskId}`);
    } catch (error: unknown) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMembers = members.filter(m => formData.assignedTo.includes(m._id));
  const selectedTaskList = taskLists.find(tl => tl._id === formData.taskList);

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading task...</p>
        </div>
      </div>
    );
  }

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
      <Link href={`/dashboard/tasks/${taskId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Task
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Task</CardTitle>
          <CardDescription>
            {taskDisplayId && (
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded mr-2">
                {taskDisplayId}
              </span>
            )}
            Update task details, assignees, and other information
          </CardDescription>
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
                disabled={submitting}
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
                disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Task List *</Label>
                <Dialog open={openTaskListDialog} onOpenChange={setOpenTaskListDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      New List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Task List</DialogTitle>
                      <DialogDescription>
                        Create a new task list to organize your tasks
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="list-name">Name *</Label>
                        <Input
                          id="list-name"
                          placeholder="e.g., Development, Design"
                          value={newTaskList.name}
                          onChange={(e) => setNewTaskList({ ...newTaskList, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="list-description">Description</Label>
                        <Textarea
                          id="list-description"
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
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task list">
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
                  disabled={submitting}
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
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={submitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ToDo">To Do</SelectItem>
                    <SelectItem value="In-Progress">In Progress</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="In-Review">In Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    disabled={submitting}
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

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Task'}
              </Button>
              <Link href={`/dashboard/tasks/${taskId}`}>
                <Button type="button" variant="outline" disabled={submitting}>
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

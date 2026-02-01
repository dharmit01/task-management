import { generateAuditLogs } from '@/lib/audit-utils';
import { isAdmin, isManager, requireAuth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { isInTeam, validateTaskAssignment } from '@/lib/team-utils';
import Task from '@/models/Task';
import TaskList from '@/models/TaskList';
import User from '@/models/User';
import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  taskList: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task list ID').optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  assignedTo: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).optional(),
  status: z.enum(['ToDo', 'In-Progress', 'Blocked', 'In-Review', 'Completed']).optional(),
});

// GET /api/tasks/[id] - Get specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    await connectDB();
    
    // Ensure models are registered
    TaskList;
    User;

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('taskList', 'name color')
      .populate('auditLog.actor', 'name email');

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Permission check: Admin sees all, Manager sees tasks created by them or assigned to team, Members see assigned tasks
    if (!isAdmin(authResult.user)) {
      // Ensure assignedTo is always treated as an array (for backward compatibility)
      const assignedToArray = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      const isAssignee = assignedToArray.some(
        (assignee: any) => assignee._id.toString() === authResult.user._id.toString()
      );
      const isCreator = task.createdBy._id.toString() === authResult.user._id.toString();
      
      // For managers, also check if any assignee is in their team
      let hasTeamMemberAssigned = false;
      if (isManager(authResult.user)) {
        for (const assignee of assignedToArray) {
          if (await isInTeam(authResult.user._id, assignee._id)) {
            hasTeamMemberAssigned = true;
            break;
          }
        }
      }
      
      if (!isAssignee && !isCreator && !hasTeamMemberAssigned) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, task }, { status: 200 });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Ensure models are registered
    TaskList;
    User;

    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check permissions: Admin, Manager (for their tasks), Assignee, or Creator can update
    const userIsAdmin = isAdmin(authResult.user);
    const userIsManager = isManager(authResult.user);
    // Ensure assignedTo is always treated as an array (for backward compatibility)
    const assignedToArray = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
    const userIsAssignee = assignedToArray.some(
      (assigneeId: any) => assigneeId.toString() === authResult.user._id.toString()
    );
    const userIsCreator = task.createdBy.toString() === authResult.user._id.toString();
    
    // For managers, check if they created this task or if it has their team members
    let managerHasAccess = false;
    if (userIsManager) {
      if (userIsCreator) {
        managerHasAccess = true;
      } else {
        for (const assignee of assignedToArray) {
          if (await isInTeam(authResult.user._id, assignee)) {
            managerHasAccess = true;
            break;
          }
        }
      }
    }

    if (!userIsAdmin && !userIsAssignee && !userIsCreator && !managerHasAccess) {
      return NextResponse.json(
        { error: 'Access denied. You can only edit tasks assigned to you, created by you, or assigned to your team.' },
        { status: 403 }
      );
    }
    
    // Validate assignment changes for managers
    if (userIsManager && validationResult.data.assignedTo && validationResult.data.assignedTo.length > 0) {
      const invalidIds = await validateTaskAssignment(authResult.user._id, validationResult.data.assignedTo);
      
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot assign task to users outside your team. You can only assign to your team members, other Managers, or Admins.',
            invalidUserIds: invalidIds,
          },
          { status: 403 }
        );
      }
    }

    // Prepare update data - convert assignedTo strings to ObjectIds if present
    const updateData: any = { ...validationResult.data };
    if (updateData.assignedTo && Array.isArray(updateData.assignedTo)) {
      updateData.assignedTo = updateData.assignedTo.map((id: string) => new Types.ObjectId(id));
    }

    // Generate audit logs for changes
    const auditLogs = generateAuditLogs(authResult.user._id, task, updateData);
    
    // Add audit logs to the update
    if (auditLogs.length > 0) {
      updateData.$push = { auditLog: { $each: auditLogs } };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('auditLog.actor', 'name email');

    return NextResponse.json(
      { success: true, task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  if (!isAdmin(authResult.user)) {
    return NextResponse.json(
      { error: 'Only admins can delete tasks' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    await connectDB();
    
    // Ensure models are registered
    TaskList;
    User;

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

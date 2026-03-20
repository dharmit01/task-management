import Task from '@/models/Task';
import User from '@/models/User';
import { Types } from 'mongoose';

/**
 * Get all team members for a manager
 */
export async function getTeamMembers(
  managerId: string | Types.ObjectId,
  options?: { includeInactive?: boolean }
) {
  const teamMembers = await User.find({
    managerId: managerId,
    role: 'Member',
    ...(options?.includeInactive ? {} : { isActive: true }),
  })
    .select('-password')
    .sort({ name: 1 });

  return teamMembers;
}

/**
 * Check if a user is in a manager's team
 */
export async function isInTeam(
  managerId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<boolean> {
  const user = await User.findOne({
    _id: userId,
    managerId: managerId,
    role: 'Member',
  });
  
  return !!user;
}

/**
 * Get all users that a manager can assign tasks to
 * (their team members + all managers + all admins)
 */
export async function getAssignableUsers(managerId: string | Types.ObjectId) {
  const users = await User.find({
    $or: [
      { managerId: managerId, role: 'Member', isActive: true },
      { role: 'Manager', isActive: true },
      { role: 'Admin', isActive: true },
    ],
  }).select('-password');
  
  return users;
}

/**
 * Deallocate member from all tasks created by their previous manager
 * Returns the number of tasks updated
 */
export async function deallocateMemberFromManagerTasks(
  memberId: string | Types.ObjectId,
  oldManagerId: string | Types.ObjectId
): Promise<number> {
  try {
    // Find all tasks created by old manager where this member is assigned
    const tasks = await Task.find({
      createdBy: oldManagerId,
      assignedTo: { $in: [memberId] },
    });

    let updatedCount = 0;

    for (const task of tasks) {
      // Remove member from assignedTo array
      task.assignedTo = task.assignedTo.filter(
        (id: Types.ObjectId) => id.toString() !== memberId.toString()
      );
      
      // Add audit log entry
      task.auditLog.push({
        actor: oldManagerId as Types.ObjectId,
        action: 'Assignee Removed (Team Reassignment)',
        field: 'assignedTo',
        oldValue: memberId.toString(),
        newValue: null,
        timestamp: new Date(),
      });
      
      await task.save();
      updatedCount++;
    }

    return updatedCount;
  } catch (error) {
    console.error('Error deallocating member from manager tasks:', error);
    throw error;
  }
}

/**
 * Validate that a manager can assign a task to the specified users
 * Returns array of invalid user IDs (users not in manager's scope)
 */
export async function validateTaskAssignment(
  managerId: string | Types.ObjectId,
  assigneeIds: (string | Types.ObjectId)[]
): Promise<string[]> {
  const assignableUsers = await getAssignableUsers(managerId);
  const assignableUserIds = assignableUsers.map(u => u._id.toString());
  
  const invalidIds = assigneeIds
    .map(id => id.toString())
    .filter(id => !assignableUserIds.includes(id));
  
  return invalidIds;
}

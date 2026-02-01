import { IAuditLogEntry } from '@/models/Task';
import { Types } from 'mongoose';

/**
 * Generate audit log entries for task changes
 */

export function createAuditEntry(
  actorId: string | Types.ObjectId,
  action: string,
  field: string,
  oldValue?: any,
  newValue?: any
): IAuditLogEntry {
  return {
    actor: new Types.ObjectId(actorId),
    action,
    field,
    oldValue,
    newValue,
    timestamp: new Date(),
  };
}

export function generateAuditLogs(
  actorId: string | Types.ObjectId,
  oldTask: any,
  newData: any
): IAuditLogEntry[] {
  const auditLogs: IAuditLogEntry[] = [];

  // Track status changes
  if (newData.status && newData.status !== oldTask.status) {
    auditLogs.push(
      createAuditEntry(
        actorId,
        'Status Changed',
        'status',
        oldTask.status,
        newData.status
      )
    );
  }

  // Track priority changes
  if (newData.priority && newData.priority !== oldTask.priority) {
    auditLogs.push(
      createAuditEntry(
        actorId,
        'Priority Changed',
        'priority',
        oldTask.priority,
        newData.priority
      )
    );
  }

  // Track start date changes
  if (newData.startDate && new Date(newData.startDate).getTime() !== new Date(oldTask.startDate).getTime()) {
    auditLogs.push(
      createAuditEntry(
        actorId,
        'Start Date Changed',
        'startDate',
        oldTask.startDate.toISOString(),
        new Date(newData.startDate).toISOString()
      )
    );
  }

  // Track end date changes
  if (newData.endDate && new Date(newData.endDate).getTime() !== new Date(oldTask.endDate).getTime()) {
    auditLogs.push(
      createAuditEntry(
        actorId,
        'End Date Changed',
        'endDate',
        oldTask.endDate.toISOString(),
        new Date(newData.endDate).toISOString()
      )
    );
  }

  // Track task list changes
  if (newData.taskList && newData.taskList !== oldTask.taskList.toString()) {
    auditLogs.push(
      createAuditEntry(
        actorId,
        'Task List Changed',
        'taskList',
        oldTask.taskList.toString(),
        newData.taskList
      )
    );
  }

  // Track assignee changes
  if (newData.assignedTo) {
    const oldAssignees = oldTask.assignedTo.map((id: Types.ObjectId) => id.toString()).sort();
    const newAssignees = Array.isArray(newData.assignedTo) 
      ? newData.assignedTo.map((id: string) => id.toString()).sort()
      : [];

    // Find added assignees
    const addedAssignees = newAssignees.filter((id: string) => !oldAssignees.includes(id));
    addedAssignees.forEach((userId: string) => {
      auditLogs.push(
        createAuditEntry(
          actorId,
          'Assignee Added',
          'assignedTo',
          null,
          userId
        )
      );
    });

    // Find removed assignees
    const removedAssignees = oldAssignees.filter((id: string) => !newAssignees.includes(id));
    removedAssignees.forEach((userId: string) => {
      auditLogs.push(
        createAuditEntry(
          actorId,
          'Assignee Removed',
          'assignedTo',
          userId,
          null
        )
      );
    });
  }

  return auditLogs;
}

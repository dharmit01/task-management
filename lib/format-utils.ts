/**
 * Client-safe utility functions for formatting data
 * No server-only dependencies (mongoose, etc.)
 */

export function formatAuditLogValue(field: string, value: any, users?: any, taskLists?: any): string {
  if (value === null || value === undefined) {
    return 'None';
  }

  switch (field) {
    case 'status':
    case 'priority':
      return value;
    
    case 'startDate':
    case 'endDate':
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    
    case 'assignedTo':
      // If users data is provided, look up the user name
      if (users && users[value]) {
        return users[value].name;
      }
      return value;
    
    case 'taskList':
      // If taskLists data is provided, look up the task list name
      if (taskLists && taskLists[value]) {
        return taskLists[value].name;
      }
      return value;
    
    default:
      return String(value);
  }
}

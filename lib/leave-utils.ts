/**
 * Calculate the number of working days between two dates (excluding weekends)
 * @param startDate - Start date of the leave
 * @param endDate - End date of the leave
 * @param leaveType - 'full' or 'half' day leave
 * @returns Number of leave days (0.5 for half day, calculated for full day)
 */
export function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  leaveType: 'full' | 'half'
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // For half day, return 0.5 (single day only)
  if (leaveType === 'half') {
    return 0.5;
  }

  // Calculate working days (excluding weekends)
  let workingDays = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Check if a date falls within a leave period
 * @param checkDate - Date to check
 * @param startDate - Leave start date
 * @param endDate - Leave end date
 * @returns true if the date is within the leave period
 */
export function isDateInLeave(
  checkDate: Date,
  startDate: Date,
  endDate: Date
): boolean {
  const check = new Date(checkDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  check.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return check >= start && check <= end;
}

/**
 * Format leave duration for display
 * @param leaveDays - Number of leave days
 * @returns Formatted string
 */
export function formatLeaveDuration(leaveDays: number): string {
  if (leaveDays === 0.5) {
    return '0.5 day (Half day)';
  } else if (leaveDays === 1) {
    return '1 day';
  } else {
    return `${leaveDays} days`;
  }
}

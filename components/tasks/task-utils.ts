export const STATUSES: { key: string; label: string }[] = [
  { key: "ToDo", label: "To Do" },
  { key: "In-Progress", label: "In Progress" },
  { key: "Blocked", label: "Blocked" },
  { key: "In-Review", label: "In Review" },
  { key: "Completed", label: "Completed" },
];

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "Critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800";
    case "High":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
    case "Low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "In-Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "Blocked":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "In-Review":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export function isTaskOverdue(endDate: Date, status: string): boolean {
  return new Date(endDate) < new Date() && status !== "Completed";
}

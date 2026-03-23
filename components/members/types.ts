export type MemberRole = "Admin" | "Manager" | "Member";

export interface Member {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: MemberRole;
  isActive: boolean;
  managerId?: string | { _id: string; name: string; username: string } | null;
  annualLeaveBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFilters {
  search: string;
  role: MemberRole | "all";
  status: "all" | "active" | "inactive";
  page: number;
  pageSize: PageSizeOption;
  sortDir: "asc" | "desc";
}

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export interface MemberStats {
  total: number;
  active: number;
  managers: number;
  members: number;
}

export interface MemberPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedMembersResponse {
  success: boolean;
  users: Member[];
  pagination: MemberPagination;
  stats: MemberStats;
}

export interface CreateMemberPayload {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: MemberRole;
  managerId?: string;
}

export const DEFAULT_FILTERS: MemberFilters = {
  search: "",
  role: "all",
  status: "all",
  page: 1,
  pageSize: 25,
  sortDir: "asc",
};

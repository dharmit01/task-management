import { apiClient } from "@/lib/api-client";
import type {
  CreateMemberPayload,
  Member,
  MemberFilters,
  PaginatedMembersResponse,
} from "./types";

export async function fetchMembers(
  filters: MemberFilters,
): Promise<PaginatedMembersResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.role !== "all") params.set("role", filters.role);
  if (filters.status !== "all") params.set("status", filters.status);
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));
  params.set("sortDir", filters.sortDir);

  return apiClient.get<PaginatedMembersResponse>(
    `/api/users?${params.toString()}`,
  );
}

export async function fetchManagersForDropdown(): Promise<Member[]> {
  // Fetch all users (skips pagination) then filter to eligible manager/admin roles on the client.
  // Admins+managers are always a small subset so this is efficient.
  const res = await apiClient.get<PaginatedMembersResponse>(
    "/api/users?all=true",
  );
  return res.users.filter((u) => u.role === "Manager" || u.role === "Admin");
}

export async function createMember(
  payload: CreateMemberPayload,
): Promise<Member> {
  const res = await apiClient.post<{ success: boolean; user: Member }>(
    "/api/users",
    payload,
  );
  return res.user;
}

export async function toggleMemberStatus(
  id: string,
  isActive: boolean,
): Promise<Member> {
  const res = await apiClient.patch<{ success: boolean; user: Member }>(
    `/api/users/${id}`,
    { isActive },
  );
  return res.user;
}

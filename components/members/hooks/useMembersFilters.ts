import { useReducer } from "react";
import type { MemberFilters, MemberRole, PageSizeOption } from "../types";
import { DEFAULT_FILTERS, PAGE_SIZE_OPTIONS } from "../types";

type FilterAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_ROLE"; payload: MemberRole | "all" }
  | { type: "SET_STATUS"; payload: MemberFilters["status"] }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: PageSizeOption }
  | { type: "SET_SORT_DIR"; payload: "asc" | "desc" }
  | { type: "RESET" };

function filtersReducer(
  state: MemberFilters,
  action: FilterAction,
): MemberFilters {
  switch (action.type) {
    case "SET_SEARCH":
      // Bail out early to preserve reference equality and prevent spurious re-renders
      if (state.search === action.payload) return state;
      return { ...state, search: action.payload, page: 1 };
    case "SET_ROLE":
      if (state.role === action.payload) return state;
      return { ...state, role: action.payload, page: 1 };
    case "SET_STATUS":
      if (state.status === action.payload) return state;
      return { ...state, status: action.payload, page: 1 };
    case "SET_PAGE":
      if (state.page === action.payload) return state;
      return { ...state, page: action.payload };
    case "SET_PAGE_SIZE":
      if (state.pageSize === action.payload) return state;
      return { ...state, pageSize: action.payload, page: 1 };
    case "SET_SORT_DIR":
      if (state.sortDir === action.payload) return state;
      return { ...state, sortDir: action.payload, page: 1 };
    case "RESET":
      return DEFAULT_FILTERS;
    default:
      return state;
  }
}

export function useMembersFilters() {
  return useReducer(filtersReducer, DEFAULT_FILTERS);
}

// Re-export for convenience when consumers need to reference page size options
export { PAGE_SIZE_OPTIONS };

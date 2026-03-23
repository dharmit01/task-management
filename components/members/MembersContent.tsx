'use client';

import { use } from 'react';
import { MembersFilterBar } from './MembersFilterBar';
import { MembersPagination } from './MembersPagination';
import { MembersTable } from './MembersTable';
import { MemberStatsCards } from './MemberStatsCards';
import type { MemberFilters, PageSizeOption, PaginatedMembersResponse } from './types';

type FilterDispatch = React.Dispatch<
    | { type: 'SET_SEARCH'; payload: string }
    | { type: 'SET_ROLE'; payload: MemberFilters['role'] }
    | { type: 'SET_STATUS'; payload: MemberFilters['status'] }
    | { type: 'SET_PAGE'; payload: number }
    | { type: 'SET_PAGE_SIZE'; payload: PageSizeOption }
    | { type: 'SET_SORT_DIR'; payload: 'asc' | 'desc' }
>;

interface Props {
    membersPromise: Promise<PaginatedMembersResponse>;
    filters: MemberFilters;
    dispatch: FilterDispatch;
    onRefresh: () => void;
}

export function MembersContent({ membersPromise, filters, dispatch, onRefresh }: Props) {
    // React 19 use() — suspends here until the promise resolves.
    // The parent wraps this in a <Suspense> boundary.
    const { users, pagination, stats } = use(membersPromise);

    return (
        <>
            <MemberStatsCards stats={stats} />

            <MembersFilterBar
                filters={filters}
                dispatch={dispatch}
                isLoading={false}
                onRefresh={onRefresh}
            />

            <MembersTable
                members={users}
                sortDir={filters.sortDir}
                onSortToggle={() =>
                    dispatch({
                        type: 'SET_SORT_DIR',
                        payload: filters.sortDir === 'asc' ? 'desc' : 'asc',
                    })
                }
                onRefresh={onRefresh}
            />

            <MembersPagination
                pagination={pagination}
                currentPage={filters.page}
                pageSize={filters.pageSize}
                dispatch={dispatch}
            />
        </>
    );
}

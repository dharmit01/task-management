'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Search } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import type { MemberFilters, MemberRole } from './types';

type FilterDispatch = React.Dispatch<
    | { type: 'SET_SEARCH'; payload: string }
    | { type: 'SET_ROLE'; payload: MemberRole | 'all' }
    | { type: 'SET_STATUS'; payload: MemberFilters['status'] }
>;

interface Props {
    filters: Pick<MemberFilters, 'search' | 'role' | 'status'>;
    dispatch: FilterDispatch;
    isLoading: boolean;
    onRefresh: () => void;
}

const DEBOUNCE_MS = 400;

export const MembersFilterBar = memo(function MembersFilterBar({
    filters,
    dispatch,
    isLoading,
    onRefresh,
}: Props) {
    // Local state for instant UI feedback; debounced value is dispatched to the filter reducer
    const [inputValue, setInputValue] = useState(filters.search);

    // Keep local input in sync if the search filter is reset externally (e.g. refresh)
    useEffect(() => {
        setInputValue(filters.search);
    }, [filters.search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_SEARCH', payload: inputValue });
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [inputValue, dispatch]);

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by name, username or email…"
                    className="pl-9"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </div>

            <Select
                value={filters.role}
                onValueChange={(v) => dispatch({ type: 'SET_ROLE', payload: v as MemberRole | 'all' })}
            >
                <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.status}
                onValueChange={(v) =>
                    dispatch({ type: 'SET_STATUS', payload: v as MemberFilters['status'] })
                }
            >
                <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh members"
                className="cursor-pointer"
            >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
    );
});

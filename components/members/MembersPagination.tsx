'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import type { MemberPagination, PageSizeOption } from './types';
import { PAGE_SIZE_OPTIONS } from './types';

type PaginationDispatch = React.Dispatch<
    | { type: 'SET_PAGE'; payload: number }
    | { type: 'SET_PAGE_SIZE'; payload: PageSizeOption }
>;

interface Props {
    pagination: MemberPagination;
    currentPage: number;
    pageSize: PageSizeOption;
    dispatch: PaginationDispatch;
}

export const MembersPagination = memo(function MembersPagination({
    pagination,
    currentPage,
    pageSize,
    dispatch,
}: Props) {
    const { total, totalPages } = pagination;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select
                    value={String(pageSize)}
                    onValueChange={(v) =>
                        dispatch({ type: 'SET_PAGE_SIZE', payload: Number(v) as PageSizeOption })
                    }
                >
                    <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {total > 0 && (
                    <span className="ml-1">
                        Showing {start}–{end} of {total}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_PAGE', payload: currentPage - 1 })}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </Button>
                <span className="font-medium px-2">
                    {currentPage} / {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_PAGE', payload: currentPage + 1 })}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
});

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { memo, useMemo } from 'react';
import { MemberTableRow } from './MemberTableRow';
import { useToggleMemberStatus } from './hooks/useToggleMemberStatus';
import type { Member } from './types';

interface Props {
    members: Member[];
    sortDir: 'asc' | 'desc';
    onSortToggle: () => void;
    onRefresh: () => void;
}

function buildTeamLookups(members: Member[]) {
    const teamSizeByManager: Record<string, number> = {};
    const managerNameById: Record<string, string> = {};

    for (const m of members) {
        if (m.role === 'Manager' || m.role === 'Admin') {
            managerNameById[m._id] = m.name;
        }
        if (m.managerId) {
            const id =
                typeof m.managerId === 'object'
                    ? (m.managerId as { _id: string })._id
                    : m.managerId;
            teamSizeByManager[id] = (teamSizeByManager[id] ?? 0) + 1;
        }
    }

    return { teamSizeByManager, managerNameById };
}

const SortIcon = memo(function SortIcon({ dir }: { dir: 'asc' | 'desc' }) {
    if (dir === 'asc') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 20V4" />
                <path d="m5 11 7-7 7 7" />
            </svg>
        );
    }
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 4v16" />
            <path d="m19 13-7 7-7-7" />
        </svg>
    );
});

export const MembersTable = memo(function MembersTable({
    members,
    sortDir,
    onSortToggle,
    onRefresh,
}: Props) {
    const { optimisticMembers, toggle } = useToggleMemberStatus(members, {
        onSettled: onRefresh,
    });

    const { teamSizeByManager, managerNameById } = useMemo(
        () => buildTeamLookups(members),
        [members]
    );

    return (
        <div className="overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="pl-4 py-2">
                            <button
                                type="button"
                                onClick={onSortToggle}
                                className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors group"
                                title={`Sort by name ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
                            >
                                Member
                                <span className="text-muted-foreground group-hover:text-foreground">
                                    <SortIcon dir={sortDir} />
                                </span>
                            </button>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team Info</TableHead>
                        <TableHead>Leave Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                    {optimisticMembers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                No members match your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        optimisticMembers.map((member) => (
                            <MemberTableRow
                                key={member._id}
                                member={member}
                                teamSizeByManager={teamSizeByManager}
                                managerNameById={managerNameById}
                                onToggleStatus={toggle}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
});

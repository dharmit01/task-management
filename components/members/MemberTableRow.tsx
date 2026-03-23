'use client';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { MemberRoleBadge } from './MemberRoleBadge';
import { MemberStatusBadge } from './MemberStatusBadge';
import { MemberTeamInfo } from './MemberTeamInfo';
import type { Member } from './types';

interface Props {
    member: Member;
    teamSizeByManager: Record<string, number>;
    managerNameById: Record<string, string>;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export const MemberTableRow = memo(function MemberTableRow({
    member,
    teamSizeByManager,
    managerNameById,
    onToggleStatus,
}: Props) {
    const router = useRouter();

    return (
        <TableRow
            key={member._id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/members/${member._id}`)}
        >
            <TableCell className="pl-4 py-2">
                <Link
                    href={`/dashboard/members/${member._id}`}
                    className="group"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {member.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">@{member.username}</p>
                </Link>
            </TableCell>

            <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                {member.email ?? <span className="text-gray-400">—</span>}
            </TableCell>

            <TableCell>
                <MemberRoleBadge role={member.role} />
            </TableCell>

            <TableCell className="text-sm">
                <MemberTeamInfo
                    member={member}
                    teamSizeByManager={teamSizeByManager}
                    managerNameById={managerNameById}
                />
            </TableCell>

            <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                {member.annualLeaveBalance} days
            </TableCell>

            <TableCell>
                <MemberStatusBadge isActive={member.isActive} />
            </TableCell>

            <TableCell className="pr-4">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/dashboard/members/${member._id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer">
                            View Tasks
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        className={`h-7 text-xs cursor-pointer ${member.isActive
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                            : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            }`}
                        onClick={() => onToggleStatus(member._id, member.isActive)}
                    >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
});

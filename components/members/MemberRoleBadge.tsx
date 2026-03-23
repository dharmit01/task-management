import { memo } from 'react';
import type { MemberRole } from './types';

interface Props {
    role: MemberRole;
}

function getRoleBadgeClass(role: MemberRole): string {
    if (role === 'Admin')
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    if (role === 'Manager')
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
}

export const MemberRoleBadge = memo(function MemberRoleBadge({ role }: Props) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(role)}`}
        >
            {role}
        </span>
    );
});

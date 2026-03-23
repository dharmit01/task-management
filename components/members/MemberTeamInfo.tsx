import { Users } from 'lucide-react';
import { memo } from 'react';
import type { Member } from './types';

interface Props {
    member: Member;
    teamSizeByManager: Record<string, number>;
    managerNameById: Record<string, string>;
}

function resolveManagerId(managerId: Member['managerId']): string | null {
    if (!managerId) return null;
    if (typeof managerId === 'string') return managerId;
    return managerId._id ?? null;
}

export const MemberTeamInfo = memo(function MemberTeamInfo({
    member,
    teamSizeByManager,
    managerNameById,
}: Props) {
    if (member.role === 'Manager' || member.role === 'Admin') {
        const count = teamSizeByManager[member._id] ?? 0;
        return (
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <Users className="h-3.5 w-3.5" />
                {count} {count === 1 ? 'member' : 'members'}
            </span>
        );
    }

    if (member.role === 'Member') {
        const managerId = resolveManagerId(member.managerId);
        const managerName = managerId ? managerNameById[managerId] : null;
        if (managerName) {
            return <span className="text-gray-700 dark:text-gray-300">{managerName}</span>;
        }
    }

    return <span className="text-gray-400">—</span>;
});

import { UserCheck, UserX } from 'lucide-react';
import { memo } from 'react';

interface Props {
    isActive: boolean;
}

export const MemberStatusBadge = memo(function MemberStatusBadge({ isActive }: Props) {
    if (isActive) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700">
                <UserCheck className="h-3 w-3" />
                Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700">
            <UserX className="h-3 w-3" />
            Inactive
        </span>
    );
});

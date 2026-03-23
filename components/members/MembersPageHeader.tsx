import { memo } from 'react';
import { AddMemberDialog } from './AddMemberDialog';
import type { Member } from './types';

interface Props {
    managersPromise: Promise<Member[]>;
    onMemberAdded: () => void;
}

export const MembersPageHeader = memo(function MembersPageHeader({
    managersPromise,
    onMemberAdded,
}: Props) {
    return (
        <div className="flex items-center justify-between p-6 bg-linear-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                    Members
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Manage team members and their access</p>
            </div>
            <AddMemberDialog managersPromise={managersPromise} onSuccess={onMemberAdded} />
        </div>
    );
});

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserCheck, Users } from 'lucide-react';
import { memo } from 'react';
import type { MemberStats } from './types';

interface Props {
    stats: MemberStats;
}

export const MemberStatsCards = memo(function MemberStatsCards({ stats }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="px-4">
                    <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Total Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="px-4">
                    <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Active
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="px-4">
                    <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Managers
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.managers}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="px-4">
                    <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Team Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.members}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});

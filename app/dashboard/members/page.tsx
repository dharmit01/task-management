'use client';

import { MembersContent } from '@/components/members/MembersContent';
import { MembersPageHeader } from '@/components/members/MembersPageHeader';
import { useMembersFilters } from '@/components/members/hooks/useMembersFilters';
import { fetchManagersForDropdown, fetchMembers } from '@/components/members/membersApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

function MembersLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading members…</p>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [filters, dispatch] = useMembersFilters();

  // Incrementing triggers a re-render, causing useMemo to create new promises
  const [refreshCount, setRefreshCount] = useState(0);

  const membersPromise = useMemo(
    () => fetchMembers(filters),
    [filters, refreshCount]
  );

  const managersPromise = useMemo(
    () => fetchManagersForDropdown(),
    [refreshCount]
  );

  function handleRefresh() {
    setRefreshCount((c) => c + 1);
  }

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="space-y-6">
      <MembersPageHeader managersPromise={managersPromise} onMemberAdded={handleRefresh} />

      <Suspense fallback={<MembersLoadingSkeleton />}>
        <MembersContent
          membersPromise={membersPromise}
          filters={filters}
          dispatch={dispatch}
          onRefresh={handleRefresh}
        />
      </Suspense>
    </div>
  );
}

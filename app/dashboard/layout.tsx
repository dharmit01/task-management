'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CheckSquare, ChevronDown, ChevronRight, ClipboardList, Clock, FileText, LayoutDashboard, LogOut, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, user, logout, isAdmin, isManager } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [leavesExpanded, setLeavesExpanded] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Auto-expand leaves menu if on a leaves sub-page
    if (pathname?.startsWith('/dashboard/leaves')) {
      setLeavesExpanded(true);
    }
    // Auto-expand team menu if on a team sub-page
    if (pathname?.startsWith('/dashboard/team')) {
      setTeamExpanded(true);
    }
  }, [pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {user?.role}
          </p>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <Link href="/dashboard/tasks">
            <Button
              variant={
                pathname?.startsWith('/dashboard/tasks') ? 'secondary' : 'ghost'
              }
              className="w-full justify-start"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Tasks
            </Button>
          </Link>

          <Link href="/dashboard/notes">
            <Button
              variant={
                pathname?.startsWith('/dashboard/notes') ? 'secondary' : 'ghost'
              }
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              Notes
            </Button>
          </Link>

          {/* Leaves with sub-items for admin and manager */}
          <div>
            {isAdmin || isManager ? (
              <>
                <Button
                  variant={
                    pathname?.startsWith('/dashboard/leaves') ? 'secondary' : 'ghost'
                  }
                  className="w-full justify-start"
                  onClick={() => setLeavesExpanded(!leavesExpanded)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Leaves
                  {leavesExpanded ? (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Button>
                {leavesExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                    <Link href="/dashboard/leaves">
                      <Button
                        variant={pathname === '/dashboard/leaves' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Calendar className="mr-2 h-3 w-3" />
                        My Leaves
                      </Button>
                    </Link>
                    {isManager && !isAdmin && (
                      <Link href="/dashboard/leaves/team">
                        <Button
                          variant={pathname === '/dashboard/leaves/team' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                        >
                          <Users className="mr-2 h-3 w-3" />
                          Team Leaves
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <>
                        <Link href="/dashboard/leaves/manage">
                          <Button
                            variant={pathname === '/dashboard/leaves/manage' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                          >
                            <ClipboardList className="mr-2 h-3 w-3" />
                            Manage Leaves
                          </Button>
                        </Link>
                        <Link href="/dashboard/leaves/pending">
                          <Button
                            variant={pathname === '/dashboard/leaves/pending' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Clock className="mr-2 h-3 w-3" />
                            Pending Approvals
                          </Button>
                        </Link>
                        <Link href="/dashboard/leaves/today">
                          <Button
                            variant={pathname === '/dashboard/leaves/today' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Calendar className="mr-2 h-3 w-3" />
                            Today's Leaves
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Link href="/dashboard/leaves">
                <Button
                  variant={
                    pathname?.startsWith('/dashboard/leaves') ? 'secondary' : 'ghost'
                  }
                  className="w-full justify-start"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Leaves
                </Button>
              </Link>
            )}
          </div>

          {/* My Team section for Managers */}
          {isManager && (
            <div>
              <Button
                variant={
                  pathname?.startsWith('/dashboard/team') ? 'secondary' : 'ghost'
                }
                className="w-full justify-start"
                onClick={() => setTeamExpanded(!teamExpanded)}
              >
                <Users className="mr-2 h-4 w-4" />
                My Team
                {teamExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Button>
              {teamExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                  <Link href="/dashboard/team">
                    <Button
                      variant={pathname === '/dashboard/team' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Users className="mr-2 h-3 w-3" />
                      Team Members
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <Link href="/dashboard/members">
              <Button
                variant={
                  pathname?.startsWith('/dashboard/members')
                    ? 'secondary'
                    : 'ghost'
                }
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
            </Link>
          )}

          <Link href="/dashboard/profile">
            <Button
              variant={isActive('/dashboard/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}

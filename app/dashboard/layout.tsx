'use client';

import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/20 via-background to-accent/20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/40 mx-auto"></div>
          </div>
          <p className="mt-6 text-lg font-medium bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card/80 backdrop-blur-xl border-r border-border shadow-xl p-6">
        <div className="mb-8 p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            Task Manager
          </h1>
          <p className="text-sm opacity-90 mt-4 font-medium">
            {user?.name}
          </p>
          <p className="text-xs opacity-75 bg-white/20 rounded-full inline-block mt-1">
            {user?.role}
          </p>
        </div>

        <GlobalSearch />

        <nav className="space-y-4">
          <Link href="/dashboard" className="cursor-pointer">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start group transition-all cursor-pointer",
                isActive('/dashboard')
                  ? "bg-primary/15 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/25"
                  : "hover:bg-primary/10 hover:text-primary"
              )}
            >
              <LayoutDashboard className="mr-3 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </Button>
          </Link>

          <Link href="/dashboard/tasks" className="cursor-pointer">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start group transition-all cursor-pointer",
                pathname?.startsWith('/dashboard/tasks')
                  ? "bg-blue-500/15 text-blue-600 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/25"
                  : "hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              <CheckSquare className="mr-3 h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Tasks</span>
            </Button>
          </Link>

          <Link href="/dashboard/notes" className="cursor-pointer">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start group transition-all cursor-pointer",
                pathname?.startsWith('/dashboard/notes')
                  ? "bg-purple-500/15 text-purple-600 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:hover:bg-purple-500/25"
                  : "hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
              )}
            >
              <FileText className="mr-3 h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Notes</span>
            </Button>
          </Link>

          {/* Leaves with sub-items for admin and manager */}
          {isAdmin || isManager ? (
            <>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start group transition-all cursor-pointer",
                  pathname?.startsWith('/dashboard/leaves')
                    ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                    : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                )}
                onClick={() => setLeavesExpanded(!leavesExpanded)}
              >
                <Calendar className="mr-3 h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Leaves</span>
                {leavesExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4 text-green-500" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4 text-green-500" />
                )}
              </Button>
              {leavesExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-green-500/30 pl-2">
                  <Link href="/dashboard/leaves" className="cursor-pointer">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start group transition-all cursor-pointer",
                        pathname === '/dashboard/leaves'
                          ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                          : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">My Leaves</span>
                    </Button>
                  </Link>
                  {isManager && !isAdmin && (
                    <Link href="/dashboard/leaves/team" className="cursor-pointer">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start group transition-all cursor-pointer",
                          pathname === '/dashboard/leaves/team'
                            ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                            : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                        )}
                      >
                        <Users className="mr-2 h-4 w-4 text-green-500" />
                        <span className="text-sm">Team Leaves</span>
                      </Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <>
                      <Link href="/dashboard/leaves/manage" className="cursor-pointer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start group transition-all cursor-pointer",
                            pathname === '/dashboard/leaves/manage'
                              ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                              : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                          )}
                        >
                          <ClipboardList className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-sm">Manage Leaves</span>
                        </Button>
                      </Link>
                      <Link href="/dashboard/leaves/pending" className="cursor-pointer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start group transition-all cursor-pointer",
                            pathname === '/dashboard/leaves/pending'
                              ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                              : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-sm">Pending Approvals</span>
                        </Button>
                      </Link>
                      <Link href="/dashboard/leaves/today" className="cursor-pointer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start group transition-all cursor-pointer",
                            pathname === '/dashboard/leaves/today'
                              ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                              : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-sm">Today's Leaves</span>
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <Link href="/dashboard/leaves" className="cursor-pointer">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start group transition-all cursor-pointer",
                  pathname?.startsWith('/dashboard/leaves')
                    ? "bg-green-500/15 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/25"
                    : "hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                )}
              >
                <Calendar className="mr-3 h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Leaves</span>
              </Button>
            </Link>
          )}

          {/* My Team section for Managers */}
          {isManager && (
            <div>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start group transition-all cursor-pointer",
                  pathname?.startsWith('/dashboard/team')
                    ? "bg-cyan-500/15 text-cyan-600 hover:bg-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:hover:bg-cyan-500/25"
                    : "hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
                )}
                onClick={() => setTeamExpanded(!teamExpanded)}
              >
                <Users className="mr-3 h-5 w-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">My Team</span>
                {teamExpanded ? (
                  <ChevronDown className="ml-auto h-4 w-4 text-cyan-500" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4 text-cyan-500" />
                )}
              </Button>
              {teamExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-cyan-500/30 pl-2">
                  <Link href="/dashboard/team" className="cursor-pointer">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start group transition-all cursor-pointer",
                        pathname === '/dashboard/team'
                          ? "bg-cyan-500/15 text-cyan-600 hover:bg-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:hover:bg-cyan-500/25"
                          : "hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
                      )}
                    >
                      <Users className="mr-2 h-4 w-4 text-cyan-500" />
                      <span className="text-sm">Team Members</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <Link href="/dashboard/members" className="cursor-pointer">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start group transition-all cursor-pointer",
                  pathname?.startsWith('/dashboard/members')
                    ? "bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/25"
                    : "hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                <Users className="mr-3 h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Members</span>
              </Button>
            </Link>
          )}

          <Link href="/dashboard/profile" className="cursor-pointer">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start group transition-all cursor-pointer",
                isActive('/dashboard/profile')
                  ? "bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/25"
                  : "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
              )}
            >
              <UserCircle className="mr-3 h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Profile</span>
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            className="w-full justify-start hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400 group transition-all cursor-pointer"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}

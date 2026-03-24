"use client";

import { GlobalSearch } from "@/components/GlobalSearch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type NavIcon = typeof LayoutDashboard;

interface DashboardNavigationProps {
  userName?: string;
  userRole?: "Admin" | "Manager" | "Member";
  isAdmin: boolean;
  isManager: boolean;
  onLogout: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: NavIcon;
  accentClassName: string;
  match: (pathname: string) => boolean;
  children?: Array<{
    title: string;
    href: string;
    icon: NavIcon;
    match: (pathname: string) => boolean;
  }>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const buildSections = (isAdmin: boolean, isManager: boolean): NavSection[] => {
  const leavesChildren: NavItem["children"] = [
    {
      title: "My Leaves",
      href: "/dashboard/leaves",
      icon: Calendar,
      match: (pathname) => pathname === "/dashboard/leaves",
    },
    ...(isManager && !isAdmin
      ? [
          {
            title: "Team Leaves",
            href: "/dashboard/leaves/team",
            icon: Users,
            match: (pathname: string) => pathname === "/dashboard/leaves/team",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Manage Leaves",
            href: "/dashboard/leaves/manage",
            icon: ClipboardList,
            match: (pathname: string) =>
              pathname === "/dashboard/leaves/manage",
          },
          {
            title: "Pending Approvals",
            href: "/dashboard/leaves/pending",
            icon: Clock,
            match: (pathname: string) =>
              pathname === "/dashboard/leaves/pending",
          },
          {
            title: "Today's Leaves",
            href: "/dashboard/leaves/today",
            icon: Calendar,
            match: (pathname: string) => pathname === "/dashboard/leaves/today",
          },
        ]
      : []),
  ];

  return [
    {
      label: "Workspace",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          accentClassName:
            "text-sky-600 bg-sky-500/12 border-sky-500/20 dark:text-sky-300 dark:bg-sky-500/18 dark:border-sky-500/30",
          match: (pathname) => pathname === "/dashboard",
        },
        {
          title: "Tasks",
          href: "/dashboard/tasks",
          icon: CheckSquare,
          accentClassName:
            "text-blue-600 bg-blue-500/12 border-blue-500/20 dark:text-blue-300 dark:bg-blue-500/18 dark:border-blue-500/30",
          match: (pathname) => pathname.startsWith("/dashboard/tasks"),
        },
        ...(isAdmin || isManager
          ? [
              {
                title: "Companies",
                href: "/dashboard/companies",
                icon: Building2,
                accentClassName:
                  "text-amber-700 bg-amber-500/12 border-amber-500/20 dark:text-amber-300 dark:bg-amber-500/18 dark:border-amber-500/30",
                match: (pathname: string) =>
                  pathname.startsWith("/dashboard/companies"),
              },
            ]
          : []),
        {
          title: "Notes",
          href: "/dashboard/notes",
          icon: FileText,
          accentClassName:
            "text-fuchsia-700 bg-fuchsia-500/12 border-fuchsia-500/20 dark:text-fuchsia-300 dark:bg-fuchsia-500/18 dark:border-fuchsia-500/30",
          match: (pathname) => pathname.startsWith("/dashboard/notes"),
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Leaves",
          icon: Calendar,
          accentClassName:
            "text-emerald-700 bg-emerald-500/12 border-emerald-500/20 dark:text-emerald-300 dark:bg-emerald-500/18 dark:border-emerald-500/30",
          match: (pathname) => pathname.startsWith("/dashboard/leaves"),
          ...(isAdmin || isManager
            ? { children: leavesChildren }
            : { href: "/dashboard/leaves" }),
        },
        ...(isManager
          ? [
              {
                title: "My Team",
                icon: Users,
                accentClassName:
                  "text-cyan-700 bg-cyan-500/12 border-cyan-500/20 dark:text-cyan-300 dark:bg-cyan-500/18 dark:border-cyan-500/30",
                match: (pathname: string) =>
                  pathname.startsWith("/dashboard/team"),
                children: [
                  {
                    title: "Team Members",
                    href: "/dashboard/team",
                    icon: Users,
                    match: (pathname: string) => pathname === "/dashboard/team",
                  },
                ],
              },
            ]
          : []),
        ...(isAdmin
          ? [
              {
                title: "Members",
                href: "/dashboard/members",
                icon: Users,
                accentClassName:
                  "text-indigo-700 bg-indigo-500/12 border-indigo-500/20 dark:text-indigo-300 dark:bg-indigo-500/18 dark:border-indigo-500/30",
                match: (pathname: string) =>
                  pathname.startsWith("/dashboard/members"),
              },
            ]
          : []),
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile",
          href: "/dashboard/profile",
          icon: UserCircle,
          accentClassName:
            "text-rose-700 bg-rose-500/12 border-rose-500/20 dark:text-rose-300 dark:bg-rose-500/18 dark:border-rose-500/30",
          match: (pathname) => pathname === "/dashboard/profile",
        },
      ],
    },
  ];
};

const NavLink = ({
  href,
  icon: Icon,
  title,
  active,
  accentClassName,
  compact = false,
  onNavigate,
}: {
  href: string;
  icon: NavIcon;
  title: string;
  active: boolean;
  accentClassName: string;
  compact?: boolean;
  onNavigate?: () => void;
}) => (
  <Link href={href} onClick={onNavigate}>
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200",
        active
          ? cn("shadow-sm", accentClassName)
          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground",
        compact && "py-1.5",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105",
          active
            ? "border-current/15 bg-white/60 dark:bg-white/5"
            : "border-border/60 bg-background/70 text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-none">
          {title}
        </p>
      </div>
    </div>
  </Link>
);

const NavGroup = ({
  item,
  pathname,
  compact = false,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
  onNavigate?: () => void;
}) => {
  const isRouteActive = item.match(pathname);
  const [isOpen, setIsOpen] = useState(isRouteActive);

  const open = isOpen || isRouteActive;

  if (!item.children?.length) {
    return item.href ? (
      <NavLink
        href={item.href}
        icon={item.icon}
        title={item.title}
        active={isRouteActive}
        accentClassName={item.accentClassName}
        compact={compact}
        onNavigate={onNavigate}
      />
    ) : null;
  }

  const Icon = item.icon;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={cn(
          "group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all duration-200",
          isRouteActive
            ? cn("shadow-sm", item.accentClassName)
            : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground",
          compact && "py-1.5",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105",
            isRouteActive
              ? "border-current/15 bg-white/60 dark:bg-white/5"
              : "border-border/60 bg-background/70 text-muted-foreground group-hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-none">
            {item.title}
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="space-y-1 rounded-xl border border-border/60 bg-background/60 p-1.5">
          {item.children.map((child) => {
            const ChildIcon = child.icon;

            return (
              <Link key={child.href} href={child.href} onClick={onNavigate}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                    child.match(pathname)
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <ChildIcon className="h-3.5 w-3.5" />
                  <span className="font-medium leading-none">
                    {child.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NavigationContent = ({
  userName,
  userRole,
  isAdmin,
  isManager,
  onLogout,
  compact = false,
  onNavigate,
}: DashboardNavigationProps & {
  compact?: boolean;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const sections = useMemo(
    () => buildSections(isAdmin, isManager),
    [isAdmin, isManager],
  );

  return (
    <div className="flex h-full flex-col">
      <div className={cn("space-y-3", compact ? "px-1" : "px-1.5")}>
        <div className="rounded-[24px] border border-white/40 bg-linear-to-br from-sidebar via-sidebar to-primary/8 p-4 shadow-[0_20px_60px_-36px_rgba(44,98,239,0.55)] dark:border-white/8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Task Manager
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Focused operations for delivery, people, and time.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-background/70 p-2.5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Signed in as
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-none">
                  {userName ?? "Workspace User"}
                </p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground leading-none">
                  {userRole ?? "Member"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-border/70 bg-card/75 p-2.5 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <GlobalSearch />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 flex-1 pr-1",
          compact ? "overflow-y-auto px-1" : "overflow-hidden px-1.5",
        )}
      >
        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.label} className="space-y-2.5">
              <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-border/70" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {section.label}
                </p>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <NavGroup
                    key={item.title}
                    item={item}
                    pathname={pathname ?? ""}
                    compact={compact}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className={cn("pt-3", compact ? "px-1" : "px-1.5")}>
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/8 px-3 py-2 text-left text-red-700 transition-all hover:border-red-500/30 hover:bg-red-500/12 dark:text-red-300"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/15 bg-white/60 dark:bg-white/5">
            <LogOut className="h-4 w-4 transition-transform group-hover:scale-105" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-none">Log out</p>
            <p className="mt-1 text-[11px] leading-none text-red-600/70 dark:text-red-300/70">
              End the current session securely
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export const DashboardNavigation = ({
  userName,
  userRole,
  isAdmin,
  isManager,
  onLogout,
}: DashboardNavigationProps) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = useMemo(() => {
    if (!pathname) return "Workspace";
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/dashboard/tasks")) return "Tasks";
    if (pathname.startsWith("/dashboard/companies")) return "Companies";
    if (pathname.startsWith("/dashboard/notes")) return "Notes";
    if (pathname.startsWith("/dashboard/leaves")) return "Leaves";
    if (pathname.startsWith("/dashboard/team")) return "My Team";
    if (pathname.startsWith("/dashboard/members")) return "Members";
    if (pathname.startsWith("/dashboard/profile")) return "Profile";
    return "Workspace";
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Task Manager
            </p>
            <h2 className="text-base font-semibold">{pageTitle}</h2>
          </div>

          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-2xl">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="left-auto right-0 top-0 h-dvh max-w-sm translate-x-0 translate-y-0 rounded-none border-l border-border p-4 sm:max-w-sm"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Navigation</DialogTitle>
                <DialogDescription>
                  Navigate through dashboard areas.
                </DialogDescription>
              </DialogHeader>
              <NavigationContent
                userName={userName}
                userRole={userRole}
                isAdmin={isAdmin}
                isManager={isManager}
                onLogout={onLogout}
                compact
                onNavigate={() => setMobileOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <aside className="hidden h-screen w-[320px] shrink-0 border-r border-border/70 bg-linear-to-b from-sidebar via-sidebar to-sidebar/92 px-3 py-4 lg:sticky lg:top-0 lg:flex lg:flex-col">
        <NavigationContent
          userName={userName}
          userRole={userRole}
          isAdmin={isAdmin}
          isManager={isManager}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
};

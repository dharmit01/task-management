"use client";

import { DashboardPriorityChart } from "@/components/dashboard/DashboardPriorityChart";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardStatusChart } from "@/components/dashboard/DashboardStatusChart";
import { DashboardTaskListChart } from "@/components/dashboard/DashboardTaskListChart";
import {
  dashboardIcons,
  formatCompactNumber,
  formatPercent,
} from "@/components/dashboard/chart-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Plus,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { data, error, loading, refetch } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-2 border-primary/35" />
          </div>
          <p className="mt-6 text-lg font-medium text-foreground">
            Loading the redesigned dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="space-y-6">
        <div className="rounded-[32px] border border-destructive/20 bg-destructive/5 p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="border-destructive/20 bg-background/70 text-destructive"
              >
                Dashboard unavailable
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight">
                We couldn&apos;t load your dashboard data
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {error ?? "Something went wrong while preparing the dashboard."}
              </p>
            </div>
            <Button onClick={() => void refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, charts } = data;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-primary/[0.10] via-background to-accent/[0.10] p-6 shadow-sm lg:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-primary/40 via-accent/30 to-transparent" />
        <div className="absolute -right-16 top-8 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="border-border/70 bg-background/75 px-3 py-1 text-xs uppercase tracking-[0.2em]"
            >
              Dashboard overview
            </Badge>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Welcome back, {user?.name}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground lg:text-base">
                This workspace focuses on delivery health, completion momentum,
                and where task volume is building up across your companies.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="border-border/70 bg-background/75 px-3 py-2 text-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {formatCompactNumber(stats.total)} tracked tasks
            </Badge>
            {isAdmin ? (
              <Link href="/dashboard/tasks/new">
                <Button size="lg" className="rounded-xl shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="lg" className="rounded-xl">
                  Review tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          title="Total tasks"
          value={formatCompactNumber(stats.total)}
          description="The current delivery scope visible in your dashboard."
          icon={dashboardIcons.total}
          iconClassName="text-primary"
          accentClassName="bg-linear-to-r from-primary to-primary/20"
        />
        <DashboardStatCard
          title="Completed tasks"
          value={formatCompactNumber(stats.completed)}
          description="Closed work items finished within your visible scope."
          icon={dashboardIcons.completed}
          iconClassName="text-emerald-600 dark:text-emerald-400"
          accentClassName="bg-linear-to-r from-emerald-500 to-emerald-200/60"
          badgeText={formatPercent(stats.completionRate)}
        />
        <DashboardStatCard
          title="Today&apos;s tasks"
          value={formatCompactNumber(stats.today)}
          description="Tasks beginning today that may need immediate attention."
          icon={dashboardIcons.today}
          iconClassName="text-blue-600 dark:text-blue-400"
          accentClassName="bg-linear-to-r from-blue-500 to-blue-200/60"
        />
        <DashboardStatCard
          title="Overdue"
          value={formatCompactNumber(stats.overdue)}
          description="Open tasks whose due date has already passed."
          icon={dashboardIcons.overdue}
          iconClassName="text-red-600 dark:text-red-400"
          accentClassName="bg-linear-to-r from-red-500 to-red-200/60"
        />
        <DashboardStatCard
          title="High priority"
          value={formatCompactNumber(stats.highPriority)}
          description="High and critical items requiring sharper execution focus."
          icon={dashboardIcons.highPriority}
          iconClassName="text-orange-600 dark:text-orange-400"
          accentClassName="bg-linear-to-r from-orange-500 to-orange-200/60"
        />
        <DashboardStatCard
          title="Due this week"
          value={formatCompactNumber(stats.dueThisWeek)}
          description="Upcoming open work expected to close in the next 7 days."
          icon={dashboardIcons.completionRate}
          iconClassName="text-violet-600 dark:text-violet-400"
          accentClassName="bg-linear-to-r from-violet-500 to-violet-200/60"
          badgeText={`${stats.blocked} blocked · ${stats.inReview} in review`}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <DashboardStatusChart data={charts.byStatus} />
        <DashboardPriorityChart data={charts.byPriority} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {charts.byTaskList.length > 0 ? (
          <DashboardTaskListChart data={charts.byTaskList} />
        ) : (
          <div className="xl:col-span-3">
            <div className="rounded-[28px] border border-border/70 bg-card/95 p-8 shadow-sm">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-background/80">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">No company workload yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once task lists and tasks are available, the dashboard will show
                  company-level workload distribution here.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

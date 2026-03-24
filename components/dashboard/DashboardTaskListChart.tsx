"use client";

import { DashboardChartCard } from "@/components/dashboard/DashboardChartCard";
import {
  formatCompactNumber,
  formatPercent,
} from "@/components/dashboard/chart-utils";
import { type DashboardTaskListDatum } from "@/lib/dashboard/types";
import { useRouter } from "next/navigation";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DashboardTaskListChartProps = {
  data: DashboardTaskListDatum[];
};

type WorkloadTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: DashboardTaskListDatum;
  }>;
};

function WorkloadTooltip({ active, payload }: WorkloadTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;
  if (!item) {
    return null;
  }

  const completionRate =
    item.total > 0 ? (item.completed / item.total) * 100 : 0;

  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-700/80 bg-slate-950/95 px-4 py-3 text-slate-50 shadow-2xl backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-none text-slate-50">
            {item.name}
          </p>
          <p className="text-xs text-slate-400">Company workload snapshot</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Total tasks</span>
          <span className="font-medium text-slate-50">
            {formatCompactNumber(item.total)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Completed</span>
          <span className="font-medium text-emerald-300">
            {formatCompactNumber(item.completed)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Completion rate</span>
          <span className="font-medium text-sky-300">
            {formatPercent(completionRate)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardTaskListChart({
  data,
}: DashboardTaskListChartProps) {
  const router = useRouter();
  const chartHeight = Math.max(260, data.length * 48);
  const navigateToCompany = (taskListId: string) => {
    router.push(`/dashboard/companies/${taskListId}`);
  };

  return (
    <DashboardChartCard
      title="Company workload"
      description="Compare task volume by company or task list and spot where execution is concentrated."
      className="lg:col-span-3"
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Click a company bar to open its task details.
      </p>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 24, right: 16 }}
            barCategoryGap={14}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              content={<WorkloadTooltip />}
            />
            <Bar dataKey="total" radius={[0, 10, 10, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.taskListId}
                  fill={entry.color}
                  className="cursor-pointer"
                  onClick={() => navigateToCompany(entry.taskListId)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}

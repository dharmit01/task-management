"use client";

import { DashboardChartCard } from "@/components/dashboard/DashboardChartCard";
import {
  formatCompactNumber,
  priorityColors,
  priorityLabels,
} from "@/components/dashboard/chart-utils";
import { type DashboardPriorityDatum } from "@/lib/dashboard/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type DashboardPriorityChartProps = {
  data: DashboardPriorityDatum[];
};

export function DashboardPriorityChart({
  data,
}: DashboardPriorityChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: priorityLabels[item.priority],
    fill: priorityColors[item.priority],
  }));

  return (
    <DashboardChartCard
      title="Priority mix"
      description="See where the workload sits across low, medium, high, and critical effort."
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_168px] 2xl:items-center">
        <div className="h-[260px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={4}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.priority} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatCompactNumber(Number(value ?? 0)),
                  "Tasks",
                ]}
                contentStyle={{
                  borderRadius: "16px",
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  color: "#f8fafc",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {chartData.map((item) => (
            <div
              key={item.priority}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardChartCard>
  );
}

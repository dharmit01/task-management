"use client";

import { DashboardChartCard } from "@/components/dashboard/DashboardChartCard";
import {
  formatCompactNumber,
  statusColors,
  statusLabels,
} from "@/components/dashboard/chart-utils";
import { type DashboardStatusDatum } from "@/lib/dashboard/types";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DashboardStatusChartProps = {
  data: DashboardStatusDatum[];
};

export function DashboardStatusChart({ data }: DashboardStatusChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: statusLabels[item.status],
    fill: statusColors[item.status],
  }));

  return (
    <DashboardChartCard
      title="Tasks by status"
      description="A quick view of current task flow and operational bottlenecks."
      className="lg:col-span-2"
    >
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={24}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: "currentColor", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              formatter={(value) => [
                formatCompactNumber(Number(value ?? 0)),
                "Tasks",
              ]}
              labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
              itemStyle={{ color: "#f8fafc" }}
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                color: "#f8fafc",
              }}
            />
            <Bar dataKey="count" radius={[12, 12, 4, 4]}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}

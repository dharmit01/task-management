"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type DashboardChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function DashboardChartCard({
  title,
  description,
  children,
  className,
}: DashboardChartCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[28px] border-border/70 bg-card/95 shadow-sm",
        className,
      )}
    >
      <div className="h-px w-full bg-linear-to-r from-primary/40 via-accent/30 to-transparent" />
      <CardHeader className="gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

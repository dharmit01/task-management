"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type DashboardStatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
  badgeText?: string;
};

export function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  accentClassName,
  badgeText,
}: DashboardStatCardProps) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-border/70 bg-card/95 shadow-sm">
      <div className={cn("h-1 w-full", accentClassName)} />
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {badgeText ? (
            <Badge
              variant="outline"
              className="border-border/70 bg-background/70 text-[11px]"
            >
              {badgeText}
            </Badge>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

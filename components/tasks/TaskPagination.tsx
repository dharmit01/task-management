import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "./types";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface TaskPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function TaskPagination({
  pagination,
  onPageChange,
  onLimitChange,
}: TaskPaginationProps) {
  const { page, totalPages, total, limit, hasPrevPage, hasNextPage } =
    pagination;
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.15)]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {from}–{to}
          </span>{" "}
          of <span className="font-semibold text-foreground">{total}</span>{" "}
          tasks
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              Rows per page
            </span>
            <Select
              value={String(limit)}
              onValueChange={(v) => onLimitChange(Number(v))}
            >
              <SelectTrigger className="data-[size=default]:h-8 w-17.5 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={!hasPrevPage}
                className="h-8 gap-1 rounded-xl px-3"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="whitespace-nowrap rounded-xl border border-border/60 bg-muted/40 px-3 py-1 text-sm font-medium tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={!hasNextPage}
                className="h-8 gap-1 rounded-xl px-3"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

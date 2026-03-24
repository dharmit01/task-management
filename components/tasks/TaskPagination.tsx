import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "./types";

interface TaskPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function TaskPagination({
  pagination,
  onPageChange,
}: TaskPaginationProps) {
  const { page, totalPages, total, limit, hasPrevPage, hasNextPage } =
    pagination;
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium">{total}</span> tasks
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="text-sm font-medium px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

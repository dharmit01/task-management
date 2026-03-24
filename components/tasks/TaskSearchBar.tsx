"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Columns2, LayoutGrid, List, Search } from "lucide-react";
import { ViewMode } from "./types";

interface TaskSearchBarProps {
  searchQuery: string;
  viewMode: ViewMode;
  onSearchChange: (value: string) => void;
  onViewChange: (mode: ViewMode) => void;
}

export function TaskSearchBar({
  searchQuery,
  viewMode,
  onSearchChange,
  onViewChange,
}: TaskSearchBarProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.22)]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <Input
            placeholder="Search tasks by title or description…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 rounded-2xl border-border/70 bg-background/80 pl-9"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-xl border border-border/70 bg-muted/40 p-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg cursor-pointer"
            onClick={() => onViewChange("card")}
            title="Card View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg cursor-pointer"
            onClick={() => onViewChange("table")}
            title="Table View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "board" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg cursor-pointer"
            onClick={() => onViewChange("board")}
            title="Board View"
          >
            <Columns2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

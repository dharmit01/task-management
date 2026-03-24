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
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search tasks by title or description…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        <Button
          variant={viewMode === "card" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8 hover:bg-indigo-200 hover:text-black cursor-pointer"
          onClick={() => onViewChange("card")}
          title="Card View"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8 hover:bg-indigo-200 hover:text-black cursor-pointer"
          onClick={() => onViewChange("table")}
          title="Table View"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "board" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8 hover:bg-indigo-200 hover:text-black cursor-pointer"
          onClick={() => onViewChange("board")}
          title="Board View"
        >
          <Columns2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

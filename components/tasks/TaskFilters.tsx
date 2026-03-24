"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronsUpDown, Filter } from "lucide-react";
import { useState } from "react";
import { TaskList } from "./types";

interface TaskFiltersProps {
  filter: string;
  statusFilter: string;
  priorityFilter: string;
  taskListFilter: string;
  taskLists: TaskList[];
  isAdmin: boolean;
  onFilterChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onTaskListChange: (value: string) => void;
  onClearFilters: () => void;
}

export function TaskFilters({
  filter,
  statusFilter,
  priorityFilter,
  taskListFilter,
  taskLists,
  isAdmin,
  onFilterChange,
  onStatusChange,
  onPriorityChange,
  onTaskListChange,
  onClearFilters,
}: TaskFiltersProps) {
  const [companyComboOpen, setCompanyComboOpen] = useState(false);

  return (
    <div className="border-2 hover-lift rounded-lg">
      <div className="bg-linear-to-r from-primary/5 to-accent/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xl font-bold">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          Filters
        </div>
        <div>Filter tasks by various criteria</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
        <div>
          <label className="text-sm font-medium mb-2 block">View</label>
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="today">Today&apos;s Tasks</SelectItem>
              <SelectItem value="overdue">Overdue Tasks</SelectItem>
              <SelectItem value="high-priority">High Priority</SelectItem>
              {isAdmin && (
                <SelectItem value="unassigned">Unassigned Tasks</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Company Name</label>
          <Popover open={companyComboOpen} onOpenChange={setCompanyComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={companyComboOpen}
                className="w-full justify-between font-normal hover:bg-transparent hover:text-black"
              >
                <span className="truncate">
                  {taskListFilter !== "all"
                    ? taskLists.find((l) => l._id === taskListFilter)?.name
                    : "All Companies"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0"
              style={{ width: "var(--radix-popover-trigger-width)" }}
            >
              <Command>
                <CommandInput placeholder="Search company..." />
                <CommandList>
                  <CommandEmpty>No company found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onTaskListChange("all");
                        setCompanyComboOpen(false);
                      }}
                    >
                      All Companies
                    </CommandItem>
                    {taskLists.map((list) => (
                      <CommandItem
                        key={list._id}
                        value={list.name}
                        onSelect={() => {
                          onTaskListChange(list._id);
                          setCompanyComboOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          {list.name}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ToDo">To Do</SelectItem>
              <SelectItem value="In-Progress">In Progress</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
              <SelectItem value="In-Review">In Review</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={onClearFilters} className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Filter, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { TaskFilterMember, TaskList } from "./types";

interface TaskFiltersProps {
  filter: string;
  statusFilter: string;
  priorityFilter: string;
  taskListFilter: string;
  memberFilter: string;
  taskLists: TaskList[];
  members: TaskFilterMember[];
  isAdmin: boolean;
  canFilterByMember: boolean;
  activeFilterCount: number;
  onFilterChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onTaskListChange: (value: string) => void;
  onMemberChange: (value: string) => void;
  onClearFilters: () => void;
}

function FilterField({
  label,
  eyebrow,
  children,
}: {
  label: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          {eyebrow}
        </p>
        <label className="block text-sm font-semibold text-foreground">
          {label}
        </label>
      </div>
      {children}
    </div>
  );
}

export function TaskFilters({
  filter,
  statusFilter,
  priorityFilter,
  taskListFilter,
  memberFilter,
  taskLists,
  members,
  isAdmin,
  canFilterByMember,
  activeFilterCount,
  onFilterChange,
  onStatusChange,
  onPriorityChange,
  onTaskListChange,
  onMemberChange,
  onClearFilters,
}: TaskFiltersProps) {
  const [companyComboOpen, setCompanyComboOpen] = useState(false);
  const [memberComboOpen, setMemberComboOpen] = useState(false);

  const selectedTaskListName =
    taskLists.find((list) => list._id === taskListFilter)?.name ??
    "All Companies";
  const selectedMember = members.find((member) => member._id === memberFilter);
  const selectedMemberName = selectedMember?.name ?? "All Members";

  const activeHighlights = useMemo(
    () =>
      [
        filter !== "all" ? `View: ${filter.replace("-", " ")}` : null,
        statusFilter !== "all" ? `Status: ${statusFilter}` : null,
        priorityFilter !== "all" ? `Priority: ${priorityFilter}` : null,
        taskListFilter !== "all" ? `Company: ${selectedTaskListName}` : null,
        canFilterByMember && memberFilter !== "all"
          ? `Member: ${selectedMemberName}`
          : null,
      ].filter(Boolean) as string[],
    [
      canFilterByMember,
      filter,
      memberFilter,
      priorityFilter,
      selectedMemberName,
      selectedTaskListName,
      statusFilter,
      taskListFilter,
    ],
  );

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-background to-background px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Filter className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Refine task results
                  </h2>
                  <Badge
                    variant={activeFilterCount > 0 ? "default" : "secondary"}
                    className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]"
                  >
                    {activeFilterCount > 0
                      ? `${activeFilterCount} active`
                      : "Ready"}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Slice the board by urgency, company, status, and assignee with
                  a faster search-first workflow.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeHighlights.length > 0 ? (
                activeHighlights.map((highlight) => (
                  <Badge
                    key={highlight}
                    variant="secondary"
                    className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {highlight}
                  </Badge>
                ))
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  No extra filters applied yet.
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onClearFilters}
            className="h-11 rounded-2xl border-border/70 bg-background/85 px-4 text-sm font-medium shadow-sm"
          >
            Clear all filters
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
        <FilterField label="View preset" eyebrow="Focus">
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/80">
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
        </FilterField>

        <FilterField label="Company" eyebrow="Grouping">
          <Popover open={companyComboOpen} onOpenChange={setCompanyComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={companyComboOpen}
                className="h-11 w-full justify-between rounded-2xl border-border/70 bg-background/80 px-3 font-normal text-foreground shadow-none"
              >
                <span className="truncate">{selectedTaskListName}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[--radix-popover-trigger-width] rounded-2xl border-border/70 p-0"
            >
              <Command>
                <CommandInput placeholder="Search company..." />
                <CommandList>
                  <CommandEmpty>No company found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all companies"
                      onSelect={() => {
                        onTaskListChange("all");
                        setCompanyComboOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          taskListFilter === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
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
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            taskListFilter === list._id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: list.color }}
                          />
                          <span className="truncate">{list.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FilterField>

        {canFilterByMember && (
          <FilterField label="Member" eyebrow="Ownership">
            <Popover open={memberComboOpen} onOpenChange={setMemberComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={memberComboOpen}
                  className="h-11 w-full justify-between rounded-2xl border-border/70 bg-background/80 px-3 font-normal text-foreground shadow-none"
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{selectedMemberName}</span>
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] rounded-2xl border-border/70 p-0"
              >
                <Command>
                  <CommandInput placeholder="Search member by name..." />
                  <CommandList>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all members"
                        onSelect={() => {
                          onMemberChange("all");
                          setMemberComboOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            memberFilter === "all" ? "opacity-100" : "opacity-0",
                          )}
                        />
                        All Members
                      </CommandItem>
                      {members.map((member) => (
                        <CommandItem
                          key={member._id}
                          value={`${member.name} ${member.email ?? ""}`}
                          onSelect={() => {
                            onMemberChange(member._id);
                            setMemberComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              memberFilter === member._id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {member.name}
                            </div>
                            {member.email && (
                              <div className="truncate text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FilterField>
        )}

        <FilterField label="Status" eyebrow="Delivery">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/80">
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
        </FilterField>

        <FilterField label="Priority" eyebrow="Urgency">
          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/80">
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
        </FilterField>
      </div>
    </section>
  );
}

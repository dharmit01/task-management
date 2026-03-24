"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import {
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CompanyStats {
  total: number;
  ToDo: number;
  "In-Progress": number;
  Blocked: number;
  "In-Review": number;
  Completed: number;
}

interface Company {
  _id: string;
  name: string;
  description?: string;
  color: string;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  stats: CompanyStats;
}

interface CompanyFormData {
  name: string;
  description: string;
  color: string;
}

type SortKey = "name-asc" | "name-desc" | "tasks-desc" | "tasks-asc" | "newest";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const DEFAULT_PAGE_SIZE: PageSizeOption = 10;

const EMPTY_FORM: CompanyFormData = {
  name: "",
  description: "",
  color: "#3b82f6",
};

const COLOR_PRESETS = [
  "#ef4444",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

const EMPTY_STATS: CompanyStats = {
  total: 0,
  ToDo: 0,
  "In-Progress": 0,
  Blocked: 0,
  "In-Review": 0,
  Completed: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// CompanyFormDialog — shared for Create and Edit
// ─────────────────────────────────────────────────────────────────────────────
interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: CompanyFormData;
  onFormChange: (form: CompanyFormData) => void;
  onSubmit: () => void;
  loading: boolean;
}

function CompanyFormDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  onFormChange,
  onSubmit,
  loading,
}: CompanyFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="e.g. Acme Corp"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-description">Description</Label>
            <Textarea
              id="company-description"
              placeholder="Brief description of this company…"
              value={form.description}
              onChange={(e) =>
                onFormChange({ ...form, description: e.target.value })
              }
              disabled={loading}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            {/* Preset swatches */}
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onFormChange({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-all focus:outline-none"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? "#000" : "transparent",
                    boxShadow:
                      form.color === c
                        ? `0 0 0 2px white, 0 0 0 4px ${c}`
                        : undefined,
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            {/* Native colour picker + read-only hex display */}
            <div className="flex items-center gap-3 pt-1">
              <label
                className="relative cursor-pointer"
                aria-label="Open colour picker"
              >
                <span
                  className="block w-10 h-10 rounded-lg border-2 border-border shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: form.color }}
                />
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    onFormChange({ ...form, color: e.target.value })
                  }
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </label>
              <span className="font-mono text-sm text-muted-foreground select-all">
                {form.color.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading || !form.name.trim()}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeleteConfirmDialog
// ─────────────────────────────────────────────────────────────────────────────
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  company,
  onConfirm,
  loading,
}: DeleteConfirmDialogProps) {
  const taskCount = company?.stats?.total ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &ldquo;{company?.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {taskCount > 0 ? (
                <p className="text-destructive font-medium">
                  This company has {taskCount} task{taskCount === 1 ? "" : "s"}{" "}
                  assigned to it. You must reassign or delete those tasks before
                  deleting this company.
                </p>
              ) : (
                <p>
                  This will permanently delete the company. This action cannot
                  be undone.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {taskCount === 0 && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaginationBar
// ─────────────────────────────────────────────────────────────────────────────
interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: PageSizeOption;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: PageSizeOption) => void;
}

function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPrev,
  onNext,
  onPageSizeChange,
}: PaginationBarProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium">{totalItems}</span> companies
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Rows per page
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v) as PageSizeOption)}
          >
            <SelectTrigger className="data-[size=default]:h-8 w-17.5 rounded-lg text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="whitespace-nowrap px-1 text-sm font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={page >= totalPages}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompaniesTable
// ─────────────────────────────────────────────────────────────────────────────
interface CompaniesTableProps {
  companies: Company[];
  canManage: boolean;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  pageOffset: number;
}

function CompaniesTable({
  companies,
  canManage,
  onEdit,
  onDelete,
  pageOffset,
}: CompaniesTableProps) {
  if (companies.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No companies found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or create a new company.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-linear-to-br from-primary/8 via-background to-background hover:bg-transparent">
              <TableHead className="w-10 pl-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                #
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Company
              </TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Total
              </TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                To Do
              </TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                In Progress
              </TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Blocked
              </TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                In Review
              </TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Completed
              </TableHead>
              {canManage && (
                <TableHead className="pr-6 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, idx) => {
              const stats = company.stats ?? EMPTY_STATS;
              return (
                <TableRow
                  key={company._id}
                  className="group border-border/50 transition-colors duration-150 hover:bg-muted/40"
                >
                  <TableCell className="pl-6 text-xs text-muted-foreground/50 tabular-nums">
                    {pageOffset + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/companies/${company._id}`}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="h-8 w-8 shrink-0 rounded-xl shadow-sm ring-1 ring-black/10"
                        style={{ backgroundColor: company.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                          {company.name}
                        </p>
                        {company.description && (
                          <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {company.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                      {stats.total}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {stats.ToDo}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full border border-blue-200/60 bg-blue-50/60 px-2.5 py-0.5 text-xs tabular-nums text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-400">
                      {stats["In-Progress"]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full border border-red-200/60 bg-red-50/60 px-2.5 py-0.5 text-xs tabular-nums text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-400">
                      {stats.Blocked}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full border border-violet-200/60 bg-violet-50/60 px-2.5 py-0.5 text-xs tabular-nums text-violet-700 dark:border-violet-800/60 dark:bg-violet-900/20 dark:text-violet-400">
                      {stats["In-Review"]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-50/60 px-2.5 py-0.5 text-xs tabular-nums text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400">
                      {stats.Completed}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            onEdit(company);
                          }}
                          title="Edit company"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            onDelete(company);
                          }}
                          title="Delete company"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom hook: useCompanies
// ─────────────────────────────────────────────────────────────────────────────
function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{
        success: boolean;
        taskLists: Company[];
      }>("/api/task-lists");
      setCompanies(res.taskLists ?? []);
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { companies, loading, refresh: fetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const { isAdmin, isManager } = useAuth();
  const router = useRouter();
  const canManage = isAdmin || isManager;

  // Guard: redirect Members
  useEffect(() => {
    if (!isAdmin && !isManager) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isManager, router]);

  const { companies, loading, refresh } = useCompanies();

  // ── Filtering / sorting / pagination state ──────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey, pageSize]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = companies;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => {
      const aStats = a.stats ?? EMPTY_STATS;
      const bStats = b.stats ?? EMPTY_STATS;
      switch (sortKey) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "tasks-desc":
          return bStats.total - aStats.total;
        case "tasks-asc":
          return aStats.total - bStats.total;
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });
  }, [companies, debouncedSearch, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const openEdit = (company: Company) => {
    setSelectedCompany(company);
    setForm({
      name: company.name,
      description: company.description ?? "",
      color: company.color,
    });
    setEditOpen(true);
  };

  const openDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      setFormLoading(true);
      await apiClient.post("/api/task-lists", form);
      toast.success("Company created successfully");
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create company",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCompany || !form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      setFormLoading(true);
      await apiClient.patch(`/api/task-lists/${selectedCompany._id}`, form);
      toast.success("Company updated successfully");
      setEditOpen(false);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update company",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    try {
      setFormLoading(true);
      await apiClient.delete(`/api/task-lists/${selectedCompany._id}`);
      toast.success("Company deleted successfully");
      setDeleteOpen(false);
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete company",
      );
      setDeleteOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 bg-linear-to-br from-primary/8 via-background to-background px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Companies
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage companies and track their tasks
              </p>
            </div>
          </div>
          {canManage && (
            <Button
              className="h-11 rounded-2xl px-5 shadow-sm"
              onClick={openCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Company
            </Button>
          )}
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      {!loading && companies.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: "Companies",
              eyebrow: "Roster",
              value: companies.length,
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/20",
              icon: <Building2 className="h-5 w-5" />,
            },
            {
              label: "Total Tasks",
              eyebrow: "Workload",
              value: companies.reduce((s, c) => s + (c.stats?.total ?? 0), 0),
              color: "text-slate-600",
              bg: "bg-slate-500/10",
              border: "border-slate-500/20",
              icon: <ArrowUpDown className="h-5 w-5" />,
            },
            {
              label: "In Progress",
              eyebrow: "Active",
              value: companies.reduce(
                (s, c) => s + (c.stats?.["In-Progress"] ?? 0),
                0,
              ),
              color: "text-blue-600",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
              icon: <ArrowUpDown className="h-5 w-5" />,
            },
            {
              label: "Completed",
              eyebrow: "Done",
              value: companies.reduce(
                (s, c) => s + (c.stats?.Completed ?? 0),
                0,
              ),
              color: "text-emerald-600",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
              icon: <ArrowUpDown className="h-5 w-5" />,
            },
          ].map(({ label, eyebrow, value, color, bg, border, icon }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.22)] p-5"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${color} opacity-70 mb-2`}
              >
                {eyebrow}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${border} ${bg} ${color}`}
                >
                  {icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + Sort bar ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/95 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
            <Input
              placeholder="Search companies by name or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-2xl border-border/70 bg-background/80 pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Select
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="data-[size=default]:h-11 w-full rounded-2xl border-border/70 bg-background/80 sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A → Z</SelectItem>
                <SelectItem value="name-desc">Name Z → A</SelectItem>
                <SelectItem value="tasks-desc">Most Tasks</SelectItem>
                <SelectItem value="tasks-asc">Fewest Tasks</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Table ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading companies…
            </p>
          </div>
        </div>
      ) : (
        <CompaniesTable
          companies={paginated}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={openDelete}
          pageOffset={(page - 1) * pageSize}
        />
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onPageSizeChange={(size) => setPageSize(size)}
        />
      )}

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <CompanyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Company"
        description="Add a new company to group tasks under."
        form={form}
        onFormChange={setForm}
        onSubmit={handleCreate}
        loading={formLoading}
      />
      <CompanyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Company"
        description="Update the company's name, description, or color."
        form={form}
        onFormChange={setForm}
        onSubmit={handleEdit}
        loading={formLoading}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        company={selectedCompany}
        onConfirm={handleDelete}
        loading={formLoading}
      />
    </div>
  );
}

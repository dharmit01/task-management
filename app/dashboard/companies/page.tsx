'use client';

import { StatBadge } from '@/components/common/StatBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
    ArrowUpDown,
    Building2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CompanyStats {
    total: number;
    ToDo: number;
    'In-Progress': number;
    Blocked: number;
    'In-Review': number;
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

type SortKey = 'name-asc' | 'name-desc' | 'tasks-desc' | 'tasks-asc' | 'newest';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const DEFAULT_PAGE_SIZE: PageSizeOption = 10;

const EMPTY_FORM: CompanyFormData = { name: '', description: '', color: '#3b82f6' };

const COLOR_PRESETS = [
    '#ef4444', '#f59e0b', '#eab308', '#22c55e',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#14b8a6', '#64748b',
];

const EMPTY_STATS: CompanyStats = {
    total: 0,
    ToDo: 0,
    'In-Progress': 0,
    Blocked: 0,
    'In-Review': 0,
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
                            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
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
                                        borderColor: form.color === c ? '#000' : 'transparent',
                                        boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                                    }}
                                    aria-label={`Select color ${c}`}
                                />
                            ))}
                        </div>
                        {/* Native colour picker + read-only hex display */}
                        <div className="flex items-center gap-3 pt-1">
                            <label className="relative cursor-pointer" aria-label="Open colour picker">
                                <span
                                    className="block w-10 h-10 rounded-lg border-2 border-border shadow-sm transition-transform hover:scale-105"
                                    style={{ backgroundColor: form.color }}
                                />
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={(e) => onFormChange({ ...form, color: e.target.value })}
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={loading || !form.name.trim()}>
                        {loading ? 'Saving…' : 'Save'}
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
                    <AlertDialogTitle>Delete &ldquo;{company?.name}&rdquo;?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2">
                            {taskCount > 0 ? (
                                <p className="text-destructive font-medium">
                                    This company has {taskCount} task{taskCount === 1 ? '' : 's'} assigned to it.
                                    You must reassign or delete those tasks before deleting this company.
                                </p>
                            ) : (
                                <p>
                                    This will permanently delete the company. This action cannot be undone.
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
                            {loading ? 'Deleting…' : 'Delete'}
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

function PaginationBar({ page, totalPages, totalItems, pageSize, onPrev, onNext, onPageSizeChange }: PaginationBarProps) {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select
                    value={String(pageSize)}
                    onValueChange={(v) => onPageSizeChange(Number(v) as PageSizeOption)}
                >
                    <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {totalItems > 0 && (
                    <span className="ml-1">
                        Showing {start}–{end} of {totalItems}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrev}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </Button>
                <span className="font-medium px-2">
                    {page} / {totalPages || 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onNext}
                    disabled={page >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
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

function CompaniesTable({ companies, canManage, onEdit, onDelete, pageOffset }: CompaniesTableProps) {
    if (companies.length === 0) {
        return (
            <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No companies found</p>
                    <p className="text-sm mt-1">Try adjusting your search or create a new company.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 pl-4">#</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">To Do</TableHead>
                        <TableHead className="text-center">In Progress</TableHead>
                        <TableHead className="text-center">Blocked</TableHead>
                        <TableHead className="text-center">In Review</TableHead>
                        <TableHead className="text-center">Completed</TableHead>
                        {canManage && <TableHead className="w-20 text-right pr-4">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.map((company, idx) => {
                        const stats = company.stats ?? EMPTY_STATS;
                        return (
                            <TableRow key={company._id} className="group">
                                <TableCell className="pl-4 text-muted-foreground text-sm">
                                    {pageOffset + idx + 1}
                                </TableCell>
                                <TableCell>
                                    <Link
                                        href={`/dashboard/companies/${company._id}`}
                                        className="flex items-center gap-3 hover:underline"
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                                            style={{ backgroundColor: company.color }}
                                        />
                                        <div>
                                            <p className="font-medium">{company.name}</p>
                                            {company.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                    {company.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-semibold tabular-nums">{stats.total}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatBadge count={stats.ToDo} className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatBadge count={stats['In-Progress']} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatBadge count={stats.Blocked} className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatBadge count={stats['In-Review']} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatBadge count={stats.Completed} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" />
                                </TableCell>
                                {canManage && (
                                    <TableCell className="text-right pr-4">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-600"
                                                onClick={(e) => { e.preventDefault(); onEdit(company); }}
                                                title="Edit company"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600"
                                                onClick={(e) => { e.preventDefault(); onDelete(company); }}
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
        </Card>
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
            const res = await apiClient.get<{ success: boolean; taskLists: Company[] }>('/api/task-lists');
            setCompanies(res.taskLists ?? []);
        } catch {
            toast.error('Failed to load companies');
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
            router.replace('/dashboard');
        }
    }, [isAdmin, isManager, router]);

    const { companies, loading, refresh } = useCompanies();

    // ── Filtering / sorting / pagination state ──────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name-asc');
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
                    c.description?.toLowerCase().includes(q)
            );
        }

        return [...result].sort((a, b) => {
            const aStats = a.stats ?? EMPTY_STATS;
            const bStats = b.stats ?? EMPTY_STATS;
            switch (sortKey) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'tasks-desc': return bStats.total - aStats.total;
                case 'tasks-asc': return aStats.total - bStats.total;
                case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default: return 0;
            }
        });
    }, [companies, debouncedSearch, sortKey]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = useMemo(
        () => filtered.slice((page - 1) * pageSize, page * pageSize),
        [filtered, page, pageSize]
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
        setForm({ name: company.name, description: company.description ?? '', color: company.color });
        setEditOpen(true);
    };

    const openDelete = (company: Company) => {
        setSelectedCompany(company);
        setDeleteOpen(true);
    };

    const handleCreate = async () => {
        if (!form.name.trim()) { toast.error('Company name is required'); return; }
        try {
            setFormLoading(true);
            await apiClient.post('/api/task-lists', form);
            toast.success('Company created successfully');
            setCreateOpen(false);
            setForm(EMPTY_FORM);
            refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create company');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedCompany || !form.name.trim()) { toast.error('Company name is required'); return; }
        try {
            setFormLoading(true);
            await apiClient.patch(`/api/task-lists/${selectedCompany._id}`, form);
            toast.success('Company updated successfully');
            setEditOpen(false);
            refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update company');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCompany) return;
        try {
            setFormLoading(true);
            await apiClient.delete(`/api/task-lists/${selectedCompany._id}`);
            toast.success('Company deleted successfully');
            setDeleteOpen(false);
            refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete company');
            setDeleteOpen(false);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-2xl border border-orange-500/20">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                        Companies
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage companies and track their tasks 🏢
                    </p>
                </div>
                {canManage && (
                    <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow" onClick={openCreate}>
                        <Plus className="mr-2 h-5 w-5" />
                        New Company
                    </Button>
                )}
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search companies by name or description…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                        <SelectTrigger className="w-44">
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

            {/* Summary stats bar */}
            {!loading && companies.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Companies', value: companies.length, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
                        { label: 'Total Tasks', value: companies.reduce((s, c) => s + (c.stats?.total ?? 0), 0), color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
                        { label: 'In Progress', value: companies.reduce((s, c) => s + (c.stats?.['In-Progress'] ?? 0), 0), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                        { label: 'Completed', value: companies.reduce((s, c) => s + (c.stats?.Completed ?? 0), 0), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
                            <span>{label}:</span>
                            <span className="font-bold tabular-nums">{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto" />
                        <p className="mt-3 text-muted-foreground">Loading companies…</p>
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

            {/* Pagination */}
            {!loading && (
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

            {/* Dialogs */}
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

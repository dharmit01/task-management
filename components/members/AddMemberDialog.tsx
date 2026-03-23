'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus } from 'lucide-react';
import { Suspense, use, useState } from 'react';
import { useCreateMember } from './hooks/useCreateMember';
import type { Member } from './types';

// ── Inner form that consumes the managers promise via use() ──────────────────

interface FormProps {
    managersPromise: Promise<Member[]>;
    onSuccess: () => void;
    onClose: () => void;
}

function AddMemberForm({ managersPromise, onSuccess, onClose }: FormProps) {
    const managers = use(managersPromise);
    const { formData, updateField, handleSubmit, isSubmitting, reset } = useCreateMember({
        onSuccess: () => {
            onSuccess();
            onClose();
        },
    });

    function handleCancel() {
        reset();
        onClose();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                    id="username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                    minLength={6}
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                    value={formData.role}
                    onValueChange={(v) => updateField('role', v as typeof formData.role)}
                    disabled={isSubmitting}
                >
                    <SelectTrigger id="role">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.role === 'Member' && (
                <div className="space-y-2">
                    <Label htmlFor="manager">Assign Manager</Label>
                    <Select
                        value={formData.managerId || 'none'}
                        onValueChange={(v) => updateField('managerId', v === 'none' ? '' : v)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id="manager">
                            <SelectValue placeholder="Select a manager (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Manager</SelectItem>
                            {managers.map((manager) => (
                                <SelectItem key={manager._id} value={manager._id}>
                                    {manager.name} ({manager.role})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create Member'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
    managersPromise: Promise<Member[]>;
    onSuccess: () => void;
}

export function AddMemberDialog({ managersPromise, onSuccess }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Member</DialogTitle>
                    <DialogDescription>Add a new team member with their credentials</DialogDescription>
                </DialogHeader>
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
                        </div>
                    }
                >
                    <AddMemberForm
                        managersPromise={managersPromise}
                        onSuccess={onSuccess}
                        onClose={() => setOpen(false)}
                    />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}

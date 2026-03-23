"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleMemberStatus } from "../membersApi";
import type { Member } from "../types";

interface UseToggleMemberStatusOptions {
  onSettled?: () => void;
}

export function useToggleMemberStatus(
  members: Member[],
  { onSettled }: UseToggleMemberStatusOptions = {},
) {
  const [optimisticMembers, applyOptimisticUpdate] = useOptimistic(
    members,
    (current: Member[], { id, isActive }: { id: string; isActive: boolean }) =>
      current.map((m) => (m._id === id ? { ...m, isActive } : m)),
  );

  const [isPending, startTransition] = useTransition();

  const toggle = useCallback(
    (id: string, currentStatus: boolean) => {
      const newStatus = !currentStatus;

      startTransition(async () => {
        applyOptimisticUpdate({ id, isActive: newStatus });

        try {
          await toggleMemberStatus(id, newStatus);
          toast.success(
            `Member ${newStatus ? "activated" : "deactivated"} successfully`,
          );
        } catch (error: unknown) {
          // Revert by re-applying initial value
          applyOptimisticUpdate({ id, isActive: currentStatus });
          const message =
            error instanceof Error ? error.message : "Failed to update status";
          toast.error(message);
        } finally {
          onSettled?.();
        }
      });
    },
    [applyOptimisticUpdate, onSettled],
  );

  return { optimisticMembers, toggle, isPending };
}

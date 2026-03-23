"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createMember } from "../membersApi";
import type { CreateMemberPayload, MemberRole } from "../types";

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
  role: MemberRole;
  managerId: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "Member",
  managerId: "",
};

interface UseCreateMemberOptions {
  onSuccess?: () => void;
}

export function useCreateMember({ onSuccess }: UseCreateMemberOptions = {}) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
      // Clear managerId when role changes away from Member
      ...(key === "role" && value !== "Member" ? { managerId: "" } : {}),
    }));
  }

  function reset() {
    setFormData(INITIAL_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CreateMemberPayload = {
        name: formData.name,
        username: formData.username,
        ...(formData.email ? { email: formData.email } : {}),
        password: formData.password,
        role: formData.role,
        ...(formData.role === "Member" && formData.managerId
          ? { managerId: formData.managerId }
          : {}),
      };
      await createMember(payload);
      toast.success("Member created successfully!");
      reset();
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create member";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { formData, updateField, handleSubmit, isSubmitting, reset };
}

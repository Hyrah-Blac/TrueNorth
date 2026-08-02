"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Textarea } from "@/components/forms/Textarea";
import { Select } from "@/components/forms/Select";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch";
import { Button } from "@/components/shared/buttons/Button";
import {
  createKnowledgeBaseSchema,
  type CreateKnowledgeBaseInput,
} from "@/features/knowledge-base/schemas/knowledge-base.schema";
import {
  createKnowledgeBaseEntry,
  updateKnowledgeBaseEntry,
} from "@/features/admin/actions/knowledge-base.actions";
import {
  KNOWLEDGE_BASE_CATEGORY_VALUES,
  KNOWLEDGE_BASE_CATEGORY_LABELS,
  KNOWLEDGE_BASE_STATUS_VALUES,
  KNOWLEDGE_BASE_STATUS_LABELS,
  KNOWLEDGE_BASE_VISIBILITY_VALUES,
  KNOWLEDGE_BASE_VISIBILITY_LABELS,
} from "@/database/constants/knowledge-base";
import type { IKnowledgeBase } from "@/types/knowledge-base";

interface KnowledgeBaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  entry?: IKnowledgeBase | null;
}

function toFormDefaults(entry?: IKnowledgeBase | null): Partial<CreateKnowledgeBaseInput> {
  if (!entry) {
    return {
      status: "draft",
      visibility: "public",
      isFeatured: false,
      priority: 0,
      keywords: [],
    };
  }

  return {
    title: entry.title,
    category: entry.category,
    content: entry.content,
    keywords: entry.keywords,
    visibility: entry.visibility,
    priority: entry.priority,
    isFeatured: entry.isFeatured,
    status: entry.status,
    lastReviewedAt: entry.lastReviewedAt ?? "",
  };
}

export function KnowledgeBaseFormDialog({ open, onClose, onSaved, entry }: KnowledgeBaseFormDialogProps) {
  const isEditing = Boolean(entry);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateKnowledgeBaseInput>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: toFormDefaults(entry),
  });

  useEffect(() => {
    if (open) reset(toFormDefaults(entry));
  }, [open, entry, reset]);

  async function onSubmit(data: CreateKnowledgeBaseInput) {
    const result = isEditing && entry
      ? await updateKnowledgeBaseEntry(entry._id, data)
      : await createKnowledgeBaseEntry(data);

    if (result.success) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Knowledge Base Entry" : "New Knowledge Base Entry"}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
          <TextInput id="title" hasError={Boolean(errors.title)} {...register("title")} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="category" required error={errors.category?.message}>
            <Select id="category" defaultValue="" {...register("category")}>
              <option value="" disabled>Select category</option>
              {KNOWLEDGE_BASE_CATEGORY_VALUES.map((v) => (
                <option key={v} value={v}>{KNOWLEDGE_BASE_CATEGORY_LABELS[v]}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Visibility" htmlFor="visibility" required error={errors.visibility?.message}>
            <Select id="visibility" {...register("visibility")}>
              {KNOWLEDGE_BASE_VISIBILITY_VALUES.map((v) => (
                <option key={v} value={v}>{KNOWLEDGE_BASE_VISIBILITY_LABELS[v]}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          label="Content"
          htmlFor="content"
          required
          error={errors.content?.message}
          hint="Full answer or explanation. Markdown-like formatting is supported for display."
        >
          <Textarea id="content" rows={10} hasError={Boolean(errors.content)} {...register("content")} />
        </FormField>

        <FormField
          label="Keywords"
          htmlFor="keywords"
          hint="Comma-separated keywords used for AI search (max 30)"
          error={errors.keywords?.message}
        >
          <TextInput
            id="keywords"
            defaultValue={toFormDefaults(entry).keywords?.join(", ")}
            onChange={(e) =>
              setValue("keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))
            }
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <FormField label="Priority (0–100)" htmlFor="priority" hint="Higher = shown first" error={errors.priority?.message}>
            <TextInput id="priority" type="number" min={0} max={100} {...register("priority", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
            <Select id="status" {...register("status")}>
              {KNOWLEDGE_BASE_STATUS_VALUES.map((v) => (
                <option key={v} value={v}>{KNOWLEDGE_BASE_STATUS_LABELS[v]}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Last Reviewed" htmlFor="lastReviewedAt" hint="ISO date (YYYY-MM-DD)" error={errors.lastReviewedAt?.message}>
            <TextInput id="lastReviewedAt" type="date" {...register("lastReviewedAt")} />
          </FormField>
        </div>

        <ToggleSwitch label="Featured entry" {...register("isFeatured")} />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Entry"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { Button } from "@/components/shared/buttons/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  error?: string | null;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  isPending = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="md">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isPending}
          className="!bg-red-600 hover:!bg-red-700"
          icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
        >
          {isPending ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

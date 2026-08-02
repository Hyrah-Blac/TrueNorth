"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, BookOpen, Globe, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { EmptyState } from "@/components/shared/empty-state/EmptyState";
import { ConfirmDialog } from "@/components/admin/dialogs/ConfirmDialog";
import { ListToolbar } from "@/components/admin/layout/ListToolbar";
import { KnowledgeBaseFormDialog } from "@/components/admin/dialogs/KnowledgeBaseFormDialog";
import {
  deleteKnowledgeBaseEntry,
  publishKnowledgeBaseEntry,
  unpublishKnowledgeBaseEntry,
} from "@/features/admin/actions/knowledge-base.actions";
import {
  KNOWLEDGE_BASE_CATEGORY_LABELS,
  KNOWLEDGE_BASE_STATUS_LABELS,
  KNOWLEDGE_BASE_VISIBILITY_LABELS,
} from "@/database/constants/knowledge-base";
import type { IKnowledgeBase } from "@/types/knowledge-base";

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
};

interface KnowledgeBaseTableProps {
  initialEntries: IKnowledgeBase[];
  total: number;
}

export function KnowledgeBaseTable({ initialEntries, total }: KnowledgeBaseTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IKnowledgeBase | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<IKnowledgeBase | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();

  function handleSaved() {
    router.refresh();
  }

  function handleDelete() {
    if (!deletingEntry) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const result = await deleteKnowledgeBaseEntry(deletingEntry._id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingEntry(null);
      router.refresh();
    });
  }

  function handleTogglePublish(entry: IKnowledgeBase) {
    startToggleTransition(async () => {
      if (entry.status === "published") {
        await unpublishKnowledgeBaseEntry(entry._id);
      } else {
        await publishKnowledgeBaseEntry(entry._id);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <ListToolbar count={total} noun="entry" pluralNoun="entries">
        <Button
          variant="primary"
          onClick={() => {
            setEditingEntry(null);
            setFormOpen(true);
          }}
          icon={<Plus className="h-4 w-4" />}
        >
          New Entry
        </Button>
      </ListToolbar>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-soft">
        {initialEntries.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
              title="No knowledge base entries yet"
              description="Add your first entry to start building the AI concierge knowledge base."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingEntry(null);
                    setFormOpen(true);
                  }}
                  icon={<Plus className="h-4 w-4" />}
                >
                  New Entry
                </Button>
              }
            />
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest2 text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Title</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">Visibility</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Updated</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialEntries.map((entry, index) => (
                  <tr
                    key={entry._id}
                    className={`transition-colors duration-200 hover:bg-sky-50/60 ${
                      index % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-900">{entry.title}</p>
                      {entry.isFeatured ? (
                        <span className="text-xs text-sky-600">Featured</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {KNOWLEDGE_BASE_CATEGORY_LABELS[entry.category]}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        {entry.visibility === "public" ? (
                          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span className="text-xs">{KNOWLEDGE_BASE_VISIBILITY_LABELS[entry.visibility]}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">{entry.priority}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusStyles[entry.status]}`}
                      >
                        {KNOWLEDGE_BASE_STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(entry.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(entry)}
                          disabled={isToggling}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                          aria-label={entry.status === "published" ? "Unpublish" : "Publish"}
                          title={entry.status === "published" ? "Unpublish" : "Publish"}
                        >
                          {entry.status === "published" ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEntry(entry);
                            setFormOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
                          aria-label={`Edit ${entry.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEntry(entry)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${entry.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <KnowledgeBaseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        entry={editingEntry}
      />

      <ConfirmDialog
        open={Boolean(deletingEntry)}
        onClose={() => {
          setDeletingEntry(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete knowledge base entry"
        description={`"${deletingEntry?.title}" will be permanently deleted.`}
        isPending={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
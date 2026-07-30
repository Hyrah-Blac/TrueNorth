"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Paperclip } from "lucide-react";
import { uploadToCloudinary, type UploadSignatureResponse } from "@/lib/api/cloudinaryClient";
import { formatFileSize } from "@/utils/format";

export interface UploadedAttachment {
  publicId: string;
  resourceType: "image" | "raw";
  fileName: string;
  fileType: string;
}

interface DocumentUploaderProps {
  attachments: UploadedAttachment[];
  onChange: (attachments: UploadedAttachment[]) => void;
  maxFiles?: number;
}

interface PendingUpload {
  id: string;
  fileName: string;
  progress: number;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function DocumentUploader({ attachments, onChange, maxFiles = 10 }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList).slice(0, maxFiles - attachments.length);
    if (files.length === 0) {
      setError(`You can attach up to ${maxFiles} files.`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`${file.name} is larger than 10MB and was skipped.`);
        continue;
      }

      const uploadId = `${file.name}-${Date.now()}`;
      setPending((prev) => [...prev, { id: uploadId, fileName: file.name, progress: 0 }]);

      try {
        const signatureRes = await fetch("/api/upload/documents", { method: "POST" });
        const signatureJson = await signatureRes.json();

        if (!signatureRes.ok || !signatureJson.success) {
          throw new Error(signatureJson.error ?? "Could not prepare upload");
        }

        const signature: UploadSignatureResponse = signatureJson.data;

        const result = await uploadToCloudinary(file, signature, (percent) => {
          setPending((prev) => prev.map((p) => (p.id === uploadId ? { ...p, progress: percent } : p)));
        });

        onChange([
          ...attachments,
          {
            publicId: result.public_id,
            // result.resource_type is "image" or "raw" depending on what
            // Cloudinary auto-detected; not "video", so this cast is safe
            // given the allowed_formats we sign (jpg/jpeg/png/pdf).
            resourceType: result.resource_type as "image" | "raw",
            fileName: file.name,
            fileType: file.type || result.format,
          },
        ]);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : `Failed to upload ${file.name}`);
      } finally {
        setPending((prev) => prev.filter((p) => p.id !== uploadId));
      }
    }
  }

  function handleRemove(index: number) {
    onChange(attachments.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <div
            key={attachment.publicId}
            className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-sm transition-colors hover:border-sky-300"
          >
            <div className="flex items-center gap-2.5 text-slate-600">
              <Paperclip className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              {attachment.fileName}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-slate-500 transition-colors hover:text-red-600"
              aria-label={`Remove ${attachment.fileName}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {pending.map((upload) => (
          <div
            key={upload.id}
            className="overflow-hidden rounded-md border border-dashed border-sky-300 px-4 py-3 text-sm text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
              {upload.fileName} — {upload.progress}%
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {attachments.length + pending.length < maxFiles ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 transition-all duration-300 hover:border-sky-400 hover:bg-sky-500/5 hover:text-sky-600 active:scale-[0.99]"
        >
          <Upload className="h-5 w-5" />
          Attach a file
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <p className="mt-1.5 text-xs text-slate-500">PDF, image, or Word documents up to {formatFileSize(MAX_FILE_SIZE_BYTES)}</p>

      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

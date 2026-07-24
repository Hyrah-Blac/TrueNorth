"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageOff } from "lucide-react";
import { uploadToCloudinary, type UploadSignatureResponse } from "@/lib/api/cloudinaryClient";
import { deleteUploadedAsset } from "@/features/admin/actions/upload.actions";
import type { IAircraftImage } from "@/types/aircraft";

interface ImageUploaderProps {
  label: string;
  images: IAircraftImage[];
  onChange: (images: IAircraftImage[]) => void;
  multiple?: boolean;
  maxImages?: number;
}

interface PendingUpload {
  id: string;
  fileName: string;
  progress: number;
}

export function ImageUploader({ label, images, onChange, multiple = true, maxImages = 12 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList).slice(0, maxImages - images.length);

    if (files.length === 0) {
      setError(`You can upload up to ${maxImages} images here.`);
      return;
    }

    for (const file of files) {
      const uploadId = `${file.name}-${Date.now()}`;
      setPending((prev) => [...prev, { id: uploadId, fileName: file.name, progress: 0 }]);

      try {
        const signatureRes = await fetch("/api/upload/aircraft", { method: "POST" });
        const signatureJson = await signatureRes.json();

        if (!signatureRes.ok || !signatureJson.success) {
          throw new Error(signatureJson.error ?? "Could not prepare upload");
        }

        const signature: UploadSignatureResponse = signatureJson.data;

        const result = await uploadToCloudinary(file, signature, (percent) => {
          setPending((prev) => prev.map((p) => (p.id === uploadId ? { ...p, progress: percent } : p)));
        });

        const newImage: IAircraftImage = { url: result.secure_url, publicId: result.public_id };
        onChange(multiple ? [...images, newImage] : [newImage]);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      } finally {
        setPending((prev) => prev.filter((p) => p.id !== uploadId));
      }
    }
  }

  async function handleRemove(index: number) {
    const image = images[index];
    onChange(images.filter((_, i) => i !== index));
    // Best-effort cleanup — the form already reflects the removal
    // immediately regardless of whether the Cloudinary delete succeeds.
    await deleteUploadedAsset(image.publicId);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-navy-900">{label}</p>

      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div key={image.publicId} className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-slate-200">
            <Image src={image.url} alt="" fill className="object-cover" sizes="112px" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-950/70 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {pending.map((upload) => (
          <div
            key={upload.id}
            className="flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-sky-300 bg-slate-50 px-2 text-slate-500"
          >
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
            <span className="text-[10px]">{upload.progress}%</span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ))}

        {(multiple || images.length === 0) && images.length + pending.length < maxImages ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-slate-500 transition-colors duration-300 hover:border-sky-400 hover:bg-sky-500/5 hover:text-sky-500"
          >
            <Upload className="h-4 w-4" />
            <span className="text-[10px]">Upload</span>
          </button>
        ) : null}

        {images.length === 0 && pending.length === 0 ? (
          <div className="flex h-20 w-28 shrink-0 items-center justify-center text-slate-300">
            <ImageOff className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

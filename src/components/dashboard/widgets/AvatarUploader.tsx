"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { uploadToCloudinary, type UploadSignatureResponse } from "@/lib/api/cloudinaryClient";
import { AVATAR_MAX_BYTES } from "@/lib/config/media";

interface AvatarUploaderProps {
  initials: string;
  currentUrl?: string;
  onUploaded: (result: { avatarUrl: string; avatarPublicId: string }) => void;
}

/**
 * Uploads directly to Cloudinary via a signed payload from
 * /api/upload/avatar, exactly like ImageUploader does for aircraft
 * photos — the file itself never touches our server. The chosen photo
 * is only persisted to the user's profile once the surrounding form is
 * submitted; this component just handles picking + uploading it and
 * reports the result back via onUploaded.
 */
export function AvatarUploader({ initials, currentUrl, onUploaded }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (file.size > AVATAR_MAX_BYTES) {
      setError("Image must be under 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const signatureRes = await fetch("/api/upload/avatar", { method: "POST" });
      const signatureJson = await signatureRes.json();

      if (!signatureRes.ok || !signatureJson.success) {
        throw new Error(signatureJson.error ?? "Could not prepare upload");
      }

      const signature: UploadSignatureResponse = signatureJson.data;
      const result = await uploadToCloudinary(file, signature);

      onUploaded({ avatarUrl: result.secure_url, avatarPublicId: result.public_id });
      // Only swap the displayed photo once the real, Cloudinary-hosted
      // URL comes back — next/image can't render a local blob: URL
      // (it isn't an allow-listed remote host), so we show the spinner
      // over the existing photo/initials instead of a local preview.
      setPreviewUrl(result.secure_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 font-display text-xl font-semibold text-gold-200 ring-2 ring-offset-2 ring-gold-500/60 transition-shadow duration-300 hover:ring-gold-500"
        aria-label="Change profile photo"
      >
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span>{initials || "?"}</span>
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-navy-950/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="text-xs font-medium text-gold-600 transition-colors duration-300 hover:text-gold-500 disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : "Change photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
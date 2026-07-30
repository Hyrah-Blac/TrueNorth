import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "@/lib/logging/logger";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
  type: "upload" | "authenticated";
}

/**
 * Generates a signed-upload payload for the browser to POST directly
 * to Cloudinary's upload endpoint. This avoids routing image/document
 * bytes through a Vercel serverless function, which has a request
 * body size limit well below what a full-resolution aircraft photo
 * can hit. Only the signature (not the file) touches our server.
 *
 * `allowedFormats` is included in the *signed* params (not just sent
 * unsigned by the client), so Cloudinary itself rejects any file
 * extension outside the list — a caller can't widen it by editing the
 * upload request, since that would invalidate the signature. This
 * matters most for /api/upload/documents, which is reachable without
 * signing in: without a signed allow-list, anyone could use that
 * signature to upload arbitrary file types/executables to our
 * Cloudinary account.
 *
 * Cloudinary's per-request signed params don't include a file-size
 * cap — that has to be set as a hard limit on the Cloudinary account
 * or on an upload preset in the Cloudinary dashboard, since it can't
 * be enforced purely from here.
 *
 * `type` is also part of the signed params. Aircraft photos stay
 * `"upload"` (public — they're meant to be shown on the public fleet
 * pages). Quote attachments use `"authenticated"`, so delivery
 * requires a signed URL (see getSignedAttachmentUrl below). This
 * keeps attachments private without depending on the account-wide
 * "Allow delivery of PDF and ZIP files" security setting, which would
 * otherwise make every PDF/ZIP in the whole Cloudinary account
 * publicly fetchable — not just quote attachments.
 */
function createUploadSignature(
  folder: string,
  allowedFormats: string[],
  type: "upload" | "authenticated" = "upload"
): UploadSignature {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormatsStr = allowedFormats.join(",");

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp, allowed_formats: allowedFormatsStr, type },
    apiSecret
  );

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    allowedFormats: allowedFormatsStr,
    type,
  };
}

/** Admin-only: aircraft listing photos. Images only. Publicly deliverable
 *  by design — these are shown on the public fleet pages. */
export function createAircraftImageUploadSignature(folder: string): UploadSignature {
  return createUploadSignature(folder, ["jpg", "jpeg", "png", "webp"]);
}

/** Public: attachments on a charter quote request. Images or PDFs only.
 *  Uploaded as `authenticated` — never publicly deliverable by URL. */
export function createQuoteAttachmentUploadSignature(folder: string): UploadSignature {
  return createUploadSignature(folder, ["jpg", "jpeg", "png", "pdf"], "authenticated");
}

/**
 * Mints a short-lived signed URL for viewing an `authenticated`-type
 * attachment (e.g. a quote's uploaded PDF/image).
 *
 * IMPORTANT: only call this after the caller has already passed an
 * auth/ownership check for the underlying resource (requireAdmin(),
 * a quote-ownership check, etc.). This function itself does no
 * authorization — it just produces a URL that expires, it doesn't
 * decide who's allowed to have that URL. Never store the returned
 * URL; generate it fresh on every render/request instead, since it
 * expires.
 */
export function getSignedAttachmentUrl(
  publicId: string,
  resourceType: "image" | "raw" = "image",
  expiresInSeconds = 300
): string {
  // format "" means "use whatever format the asset was stored as" — the
  // type signature requires a string here even though Cloudinary treats
  // an empty one as unspecified.
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

export async function deleteCloudinaryAsset(publicId: string, resourceType: "image" | "raw" = "image"): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    // Deletion failures shouldn't block the surrounding operation
    // (e.g. removing an image from a form) — log for cleanup, don't throw.
    logger.warn("Failed to delete Cloudinary asset", { publicId, error: String(error) });
  }
}

/**
 * Builds a delivery URL with automatic format/quality transformations
 * (f_auto,q_auto) applied — Cloudinary picks WebP/AVIF and the best
 * quality per-browser automatically. Next.js's own Image component
 * already optimizes images it renders, so this is for contexts that
 * bypass next/image (e.g. email templates, once the Resend phase lands).
 */
export function getOptimizedUrl(secureUrl: string, width?: number): string {
  const transformation = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return secureUrl.replace("/upload/", `/upload/${transformation}/`);
}
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
}

/**
 * Generates a signed-upload payload for the browser to POST directly
 * to Cloudinary's upload endpoint. This avoids routing image/document
 * bytes through a Vercel serverless function, which has a request
 * body size limit well below what a full-resolution aircraft photo
 * can hit. Only the signature (not the file) touches our server.
 */
export function createUploadSignature(folder: string): UploadSignature {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);

  return { signature, timestamp, apiKey, cloudName, folder };
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

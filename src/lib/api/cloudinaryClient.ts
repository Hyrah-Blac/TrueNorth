export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  original_filename: string;
  format: string;
}

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
  type: "upload" | "authenticated";
}

/**
 * Uploads a file directly to Cloudinary from the browser using a
 * pre-signed payload. Reports progress via onProgress (0-100) using
 * XMLHttpRequest, since fetch() has no built-in upload progress event.
 *
 * allowed_formats and type must be sent here exactly as the server
 * signed them — they're part of the signed parameter set, so
 * Cloudinary recomputes the signature over whatever this request
 * actually sends and rejects the upload if it doesn't match. That's
 * what makes the allow-list (and the authenticated delivery type)
 * tamper-proof: this isn't a client-side check being trusted, it's
 * reproducing values the server already committed to.
 *
 * type=authenticated means the uploaded asset is not publicly
 * fetchable by URL — viewing it later requires a freshly-signed URL
 * generated server-side (see getSignedAttachmentUrl in cloudinary.ts).
 */
export function uploadToCloudinary(
  file: File,
  signatureData: UploadSignatureResponse,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", String(signatureData.timestamp));
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);
    formData.append("allowed_formats", signatureData.allowedFormats);
    formData.append("type", signatureData.type);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
      } else {
        reject(new Error("Upload to Cloudinary failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}
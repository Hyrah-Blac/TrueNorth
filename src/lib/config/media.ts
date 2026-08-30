// Kept in its own file (no "server-only") so it can be imported from both
// server code (cloudinary.ts, user.actions.ts) and client components
// (AvatarUploader.tsx) without pulling server-only code into the client
// bundle.
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * The platform's one intended cap for quote attachments — shared by
 * the client-side check in DocumentUploader.tsx (UX only) and the
 * authoritative server-side check in cloudinary.ts's
 * verifyQuoteAttachmentOwnership (see FIX 3/4 in the change report).
 * Kept here rather than duplicated so the two never drift apart.
 */
export const QUOTE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
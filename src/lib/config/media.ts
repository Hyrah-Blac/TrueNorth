// Kept in its own file (no "server-only") so it can be imported from both
// server code (cloudinary.ts, user.actions.ts) and client components
// (AvatarUploader.tsx) without pulling server-only code into the client
// bundle.
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB
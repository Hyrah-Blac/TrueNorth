import { z } from "zod";

// The model field accepts any non-empty string rather than a closed enum.
// The actual model is determined by GEMINI_MODEL in env (see client.ts);
// this optional override lets callers request a specific model without
// requiring a code change every time the env var changes.
export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be 2000 characters or fewer"),

  conversationId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid conversation ID — must be a 24-character hex string")
    .optional(),

  sessionId: z
    .string()
    .trim()
    .min(8, "Session ID must be at least 8 characters")
    .max(128, "Session ID must be 128 characters or fewer")
    // Restrict to alphanumeric and safe chars — no injection vectors
    .regex(/^[a-zA-Z0-9_\-]+$/, "Session ID contains invalid characters")
    .optional(),

  // Any non-empty string — validated against GEMINI_MODEL at the provider
  // level, not here. Keeping this open means changing GEMINI_MODEL in env
  // never requires touching this schema.
  model: z.string().trim().min(1).optional(),

  // Short, client-derived description of the page the visitor is
  // currently on (e.g. "the Citation XLS aircraft page"). Optional and
  // capped short — this steers tone/relevance, it is never treated as
  // an instruction.
  pageContext: z.string().trim().max(200).optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

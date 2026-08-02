import { z } from "zod";
import { AI_MODEL_VALUES } from "@/database/constants/ai";
import type { AiModel } from "@/database/constants/ai";

const modelEnum = z.enum(AI_MODEL_VALUES as [AiModel, ...AiModel[]]);

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

  model: modelEnum.optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

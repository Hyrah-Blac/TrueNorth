import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

/**
 * Normalizes any thrown value into a consistent JSON error response:
 * Zod validation errors become 422s with field-level details,
 * AppError subclasses (Unauthorized/Forbidden/NotFound) map to their
 * own status codes, and everything else is logged and returned as a
 * generic 500 so internals are never leaked to the client.
 */
export function handleApiError(error: unknown, context: string) {
  if (error instanceof ZodError) {
    return errorResponse(
      "Validation failed",
      422,
      error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    );
  }

  if (isAppError(error)) {
    return errorResponse(error.message, error.statusCode);
  }

  logger.error(`Unhandled error in ${context}`, { error: String(error) });
  return errorResponse("An unexpected error occurred", 500);
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown, code?: string) {
  return NextResponse.json({ success: false, error: message, details, ...(code ? { code } : {}) }, { status });
}

/**
 * Normalizes any thrown value into a safe, user-facing message plus the
 * status code that would apply for a normal JSON response — shared by
 * handleApiError (JSON responses) and any streaming endpoint that needs
 * to report an error mid-stream, where an HTTP status code can no
 * longer be changed once bytes have started flowing.
 */
export function resolveErrorMessage(
  error: unknown,
  context: string
): { message: string; status: number; code?: string } {
  if (error instanceof ZodError) {
    return { message: "Validation failed", status: 422 };
  }

  if (isAppError(error)) {
    return { message: error.message, status: error.statusCode, code: error.code };
  }

  logger.error(`Unhandled error in ${context}`, {
    error: String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return { message: "An unexpected error occurred", status: 500 };
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

  const { message, status, code } = resolveErrorMessage(error, context);
  return errorResponse(message, status, undefined, code);
}
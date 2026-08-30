export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  // Optional machine-readable error code (e.g. "AIRCRAFT_CAPACITY_EXCEEDED",
  // "AIRCRAFT_UNAVAILABLE") so a frontend caller can branch on the
  // failure reason without parsing the human-readable message. Purely
  // additive — existing AppError call sites that don't pass one are
  // unaffected, and `code` is simply omitted from the response.
  public readonly code?: string;

  constructor(message: string, statusCode = 500, isOperational = true, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in to perform this action") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

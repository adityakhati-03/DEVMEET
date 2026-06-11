import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware.
 * All errors thrown in route handlers will land here.
 * Returns a consistent JSON error envelope.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = err.statusCode ?? 500;
  let code = err.code ?? 'INTERNAL_ERROR';
  let message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : err.message;

  // Handle MongoDB Connection / DNS Drops
  if (err.name === 'MongoServerSelectionError' || err.message.includes('MongoServerSelectionError')) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Service temporarily unavailable due to database connection issues. Please try again.';
  }

  // Handle Mongoose Cast Errors (Invalid IDs)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_RESOURCE_ID';
    message = 'The provided resource ID is invalid.';
  }

  console.error(`[${code}] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * Factory to create a typed AppError with a status code.
 */
export function createError(
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR'
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

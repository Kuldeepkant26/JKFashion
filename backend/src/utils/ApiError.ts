export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * An error we raised deliberately, as opposed to one that escaped from a
 * library. `isOperational` is what lets the error handler decide whether the
 * message is safe to show a user.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: ErrorDetail[] | null;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, details: ErrorDetail[] | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

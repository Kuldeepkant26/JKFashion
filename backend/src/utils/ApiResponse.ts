/**
 * The single success envelope for every endpoint.
 *
 * Consistency here is what lets the frontend have one `unwrap()` helper
 * instead of remembering the shape each route happens to return.
 */
export class ApiResponse<T = unknown> {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T | null;

  constructor(statusCode: number, data: T | null = null, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

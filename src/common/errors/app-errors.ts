import { BaseError } from './base-error';

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class ExternalServiceError extends BaseError {
  readonly statusCode = 502;
  readonly isOperational = true;

  constructor(message: string, public readonly service: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

export class ConfigurationError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BaseError } from '../errors/base-error';

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    context?: Record<string, unknown>;
  };
}

export async function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log the error
  request.log.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    },
    'Request error'
  );

  // Handle known application errors
  if (error instanceof BaseError) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: error.name,
        ...(error.context && { context: error.context }),
      },
    };

    return reply.status(error.statusCode).send(response);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const response: ErrorResponse = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        context: { issues: (error as any).issues },
      },
    };

    return reply.status(400).send(response);
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };

  return reply.status(500).send(response);
}

export async function registerErrorHandler(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler(errorHandler);
}
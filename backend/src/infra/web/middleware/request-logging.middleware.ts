import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Request performance metrics
 */
interface RequestMetrics {
  startTime: number;
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
}

/**
 * Enhanced request logging with performance metrics
 */
async function requestLoggingPlugin(fastify: FastifyInstance) {
  // Store request metrics in request context
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const requestId = request.headers['x-request-id'] || request.id;
    
    // Store metrics in request context
    const metrics: RequestMetrics = {
      startTime,
      requestId: requestId as string,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    // Attach to request for later use
    (request as any).metrics = metrics;

    // Log request start
    request.log.info({
      reqId: requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      headers: {
        'content-type': request.headers['content-type'],
        'content-length': request.headers['content-length'],
      },
    }, 'Incoming request');
  });

  // Log response with performance metrics
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = (request as any).metrics as RequestMetrics;
    const duration = Date.now() - metrics.startTime;
    
    const logData = {
      reqId: metrics.requestId,
      method: metrics.method,
      url: metrics.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      contentLength: reply.getHeader('content-length'),
    };

    // Determine log level based on status code and duration
    if (reply.statusCode >= 500) {
      request.log.error(logData, 'Request completed with server error');
    } else if (reply.statusCode >= 400) {
      request.log.warn(logData, 'Request completed with client error');
    } else if (duration > 1000) {
      request.log.warn(logData, 'Slow request completed');
    } else {
      request.log.info(logData, 'Request completed');
    }
  });

  // Log errors with context
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const metrics = (request as any).metrics as RequestMetrics;
    
    request.log.error({
      reqId: metrics?.requestId,
      method: metrics?.method,
      url: metrics?.url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, 'Request error occurred');
  });
}

export default fp(requestLoggingPlugin, {
  name: 'request-logging',
});

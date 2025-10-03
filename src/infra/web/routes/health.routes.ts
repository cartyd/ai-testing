import type { FastifyInstance } from 'fastify';
import type { HealthController } from '../controllers/health.controller';

export async function healthRoutes(
  fastify: FastifyInstance,
  healthController: HealthController
): Promise<void> {
  // GET /health
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Check the overall health of the service',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            services: {
              type: 'object',
              additionalProperties: { type: 'string', enum: ['up', 'down'] },
            },
          },
          required: ['status', 'timestamp', 'uptime', 'services'],
        },
      },
    },
  }, healthController.getHealth.bind(healthController));

  // GET /readiness
  fastify.get('/readiness', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness check',
      description: 'Check if the service is ready to accept requests',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
          required: ['status'],
        },
      },
    },
  }, healthController.getReadiness.bind(healthController));

  // GET /liveness
  fastify.get('/liveness', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness check',
      description: 'Check if the service is alive',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
          required: ['status'],
        },
      },
    },
  }, healthController.getLiveness.bind(healthController));
}
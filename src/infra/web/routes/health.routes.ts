import type { FastifyInstance } from 'fastify';
import type { HealthController } from '../controllers/health.controller';
import { HEALTH_ROUTE_CONSTANTS, healthSchemas } from '../schemas/health.schemas';

export async function healthRoutes(
  fastify: FastifyInstance,
  healthController: HealthController
): Promise<void> {
  // GET /health
  fastify.get(HEALTH_ROUTE_CONSTANTS.PATHS.HEALTH, {
    schema: healthSchemas.health,
  }, healthController.getHealth.bind(healthController));

  // GET /readiness
  fastify.get(HEALTH_ROUTE_CONSTANTS.PATHS.READINESS, {
    schema: healthSchemas.readiness,
  }, healthController.getReadiness.bind(healthController));

  // GET /liveness
  fastify.get(HEALTH_ROUTE_CONSTANTS.PATHS.LIVENESS, {
    schema: healthSchemas.liveness,
  }, healthController.getLiveness.bind(healthController));
}
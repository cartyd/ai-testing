import type { FastifyInstance } from 'fastify';
import type { HealthHandlers } from '../controllers/health.controller';
import { HEALTH_ROUTE_CONSTANTS, healthSchemas } from '../schemas/health.schemas';

export async function healthRoutes(
  fastify: FastifyInstance,
  healthHandlers: HealthHandlers
): Promise<void> {
  // GET /health
  fastify.get(HEALTH_ROUTE_CONSTANTS.PATHS.HEALTH, {
    schema: healthSchemas.health,
  }, healthHandlers.getHealth);

  // GET /readiness
  fastify.get(HEALTH_ROUTE_CONSTANTS.PATHS.READINESS, {
    schema: healthSchemas.readiness,
  }, healthHandlers.getReadiness);

  // GET /liveness
  fastify.get(HEALTH_ROUTE_CONSTANTS.PATHS.LIVENESS, {
    schema: healthSchemas.liveness,
  }, healthHandlers.getLiveness);
}

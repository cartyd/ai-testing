import type { FastifyInstance } from 'fastify';
import type { AgentHandlers } from '../controllers/agent.controller';
import { ROUTE_CONSTANTS, agentSchemas } from '../schemas/agent.schemas';

export async function agentRoutes(
  fastify: FastifyInstance,
  agentHandlers: AgentHandlers
): Promise<void> {
  const prefix = ROUTE_CONSTANTS.PREFIX;

  // GET /api/v1/agents
  fastify.get(prefix, {
    schema: agentSchemas.listAgents,
  }, agentHandlers.listAgents);

  // GET /api/v1/agents/:id
  fastify.get(`${prefix}/:id`, {
    schema: agentSchemas.getAgent,
  }, agentHandlers.getAgent);

  // GET /api/v1/agents/:id/prompt
  fastify.get(`${prefix}/:id/prompt`, {
    schema: agentSchemas.getAgentPrompt,
  }, agentHandlers.getAgentPrompt);
}

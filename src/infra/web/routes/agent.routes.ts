import type { FastifyInstance } from 'fastify';
import type { AgentController } from '../controllers/agent.controller';
import { ROUTE_CONSTANTS, agentSchemas } from '../schemas/agent.schemas';

export async function agentRoutes(
  fastify: FastifyInstance,
  agentController: AgentController
): Promise<void> {
  const prefix = ROUTE_CONSTANTS.PREFIX;

  // GET /api/v1/agents
  fastify.get(prefix, {
    schema: agentSchemas.listAgents,
  }, agentController.listAgents.bind(agentController));

  // GET /api/v1/agents/:id
  fastify.get(`${prefix}/:id`, {
    schema: agentSchemas.getAgent,
  }, agentController.getAgent.bind(agentController));

  // GET /api/v1/agents/:id/prompt
  fastify.get(`${prefix}/:id/prompt`, {
    schema: agentSchemas.getAgentPrompt,
  }, agentController.getAgentPrompt.bind(agentController));
}
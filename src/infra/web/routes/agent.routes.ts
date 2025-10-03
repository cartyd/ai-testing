import type { FastifyInstance } from 'fastify';
import type { AgentController } from '../controllers/agent.controller';

export async function agentRoutes(
  fastify: FastifyInstance,
  agentController: AgentController
): Promise<void> {
  const prefix = '/api/v1/agents';

  // GET /api/v1/agents
  fastify.get(prefix, {
    schema: {
      tags: ['Agents'],
      summary: 'List all agents',
      description: 'Retrieve a list of all available Retell AI agents',
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  prompt: { type: 'string' },
                  voiceId: { type: 'string' },
                  language: { type: 'string' },
                  model: { type: 'string' },
                  temperature: { type: 'number' },
                  maxTokens: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'name', 'prompt', 'createdAt', 'updatedAt'],
              },
            },
            message: { type: 'string' },
          },
          required: ['data'],
        },
      },
    },
  }, agentController.listAgents.bind(agentController));

  // GET /api/v1/agents/:id
  fastify.get(`${prefix}/:id`, {
    schema: {
      tags: ['Agents'],
      summary: 'Get agent by ID',
      description: 'Retrieve a specific agent by its ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                prompt: { type: 'string' },
                voiceId: { type: 'string' },
                language: { type: 'string' },
                model: { type: 'string' },
                temperature: { type: 'number' },
                maxTokens: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
              required: ['id', 'name', 'prompt', 'createdAt', 'updatedAt'],
            },
            message: { type: 'string' },
          },
          required: ['data'],
        },
        404: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, agentController.getAgent.bind(agentController));

  // GET /api/v1/agents/:id/prompt
  fastify.get(`${prefix}/:id/prompt`, {
    schema: {
      tags: ['Agents'],
      summary: 'Get agent prompt',
      description: 'Retrieve the system prompt for a specific agent',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                agentId: { type: 'string' },
                prompt: { type: 'string' },
                version: { type: 'number' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
              required: ['agentId', 'prompt', 'updatedAt'],
            },
            message: { type: 'string' },
          },
          required: ['data'],
        },
        404: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, agentController.getAgentPrompt.bind(agentController));
}
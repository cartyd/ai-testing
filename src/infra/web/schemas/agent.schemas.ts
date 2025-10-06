import { HTTP_STATUS } from '../constants/controller.constants';

// Simple constants for reusability
export const AGENT_ROUTE_PREFIX = '/api/v1/agents';

// Agent data schema
const agentData = {
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
} as const;

// Agent prompt schema
const agentPrompt = {
  type: 'object',
  properties: {
    agentId: { type: 'string' },
    prompt: { type: 'string' },
    version: { type: 'number' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['agentId', 'prompt', 'updatedAt'],
} as const;

// Parameter schema
const agentIdParam = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
  },
  required: ['id'],
} as const;

// Success response wrapper
const successResponse = (dataSchema: unknown) => ({
  type: 'object',
  properties: {
    data: dataSchema,
    message: { type: 'string' },
  },
  required: ['data'],
});

// Error response schema
const errorResponse = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['message', 'code', 'timestamp'],
    },
  },
  required: ['error'],
} as const;

// API endpoint schemas
export const agentSchemas = {
  // GET /api/v1/agents
  listAgents: {
    tags: ['Agents'],
    summary: 'List all agents',
    description: 'Retrieve a list of all available Retell AI agents',
    response: {
      [HTTP_STATUS.OK]: successResponse({
        type: 'array',
        items: agentData,
      }),
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },

  // GET /api/v1/agents/:id
  getAgent: {
    tags: ['Agents'],
    summary: 'Get agent by ID',
    description: 'Retrieve a specific agent by its ID',
    params: agentIdParam,
    response: {
      [HTTP_STATUS.OK]: successResponse(agentData),
      [HTTP_STATUS.NOT_FOUND]: errorResponse,
      [HTTP_STATUS.BAD_REQUEST]: errorResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },

  // GET /api/v1/agents/:id/prompt
  getAgentPrompt: {
    tags: ['Agents'],
    summary: 'Get agent prompt',
    description: 'Retrieve the system prompt for a specific agent',
    params: agentIdParam,
    response: {
      [HTTP_STATUS.OK]: successResponse(agentPrompt),
      [HTTP_STATUS.NOT_FOUND]: errorResponse,
      [HTTP_STATUS.BAD_REQUEST]: errorResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },
} as const;

import { HTTP_STATUS } from '../constants/controller.constants';

// Route constants
export const ROUTE_CONSTANTS = {
  PREFIX: '/api/v1/agents',
  TAG: 'Agents',
  MIN_ID_LENGTH: 1,
  RESPONSE_TYPES: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    NUMBER: 'number',
  },
  DATE_FORMAT: 'date-time',
} as const;

// Common parameter schemas
export const commonParams = {
  agentId: {
    type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      id: { 
        type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
        minLength: ROUTE_CONSTANTS.MIN_ID_LENGTH 
      },
    },
    required: ['id'],
  },
} as const;

// Agent data schema (reusable)
export const agentDataSchema = {
  type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
  properties: {
    id: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    name: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    prompt: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    voiceId: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    language: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    model: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    temperature: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.NUMBER },
    maxTokens: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.NUMBER },
    createdAt: { 
      type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
      format: ROUTE_CONSTANTS.DATE_FORMAT 
    },
    updatedAt: { 
      type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
      format: ROUTE_CONSTANTS.DATE_FORMAT 
    },
  },
  required: ['id', 'name', 'prompt', 'createdAt', 'updatedAt'],
} as const;

// Error schema factory to align with health schemas
function createErrorSchema() {
  return {
    type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      error: {
        type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
        properties: {
          message: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          code: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          timestamp: { 
            type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
            format: ROUTE_CONSTANTS.DATE_FORMAT 
          },
        },
        required: ['message', 'code', 'timestamp'],
      },
    },
    required: ['error'],
  };
}

// Common response wrappers
export const responseWrappers = {
  success: <T = unknown>(dataSchema: T) => ({
    type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      data: dataSchema,
      message: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    },
    required: ['data'],
  }),
} as const;

// Error response schemas using factory for consistency
export const agentErrorSchemas = {
  [HTTP_STATUS.NOT_FOUND]: createErrorSchema(),
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: createErrorSchema(),
  [HTTP_STATUS.BAD_REQUEST]: createErrorSchema(),
} as const;

// Specific schemas for each endpoint
export const agentSchemas = {
  // GET /api/v1/agents
  listAgents: {
    tags: [ROUTE_CONSTANTS.TAG],
    summary: 'List all agents',
    description: 'Retrieve a list of all available Retell AI agents',
    response: {
      [HTTP_STATUS.OK]: responseWrappers.success({
        type: ROUTE_CONSTANTS.RESPONSE_TYPES.ARRAY,
        items: agentDataSchema,
      }),
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: agentErrorSchemas[HTTP_STATUS.INTERNAL_SERVER_ERROR],
    },
  },

  // GET /api/v1/agents/:id
  getAgent: {
    tags: [ROUTE_CONSTANTS.TAG],
    summary: 'Get agent by ID',
    description: 'Retrieve a specific agent by its ID',
    params: commonParams.agentId,
    response: {
      [HTTP_STATUS.OK]: responseWrappers.success(agentDataSchema),
      [HTTP_STATUS.NOT_FOUND]: agentErrorSchemas[HTTP_STATUS.NOT_FOUND],
      [HTTP_STATUS.BAD_REQUEST]: agentErrorSchemas[HTTP_STATUS.BAD_REQUEST],
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: agentErrorSchemas[HTTP_STATUS.INTERNAL_SERVER_ERROR],
    },
  },

  // GET /api/v1/agents/:id/prompt
  getAgentPrompt: {
    tags: [ROUTE_CONSTANTS.TAG],
    summary: 'Get agent prompt',
    description: 'Retrieve the system prompt for a specific agent',
    params: commonParams.agentId,
    response: {
      [HTTP_STATUS.OK]: responseWrappers.success({
        type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
        properties: {
          agentId: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          prompt: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          version: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.NUMBER },
          updatedAt: { 
            type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
            format: ROUTE_CONSTANTS.DATE_FORMAT 
          },
        },
        required: ['agentId', 'prompt', 'updatedAt'],
      }),
      [HTTP_STATUS.NOT_FOUND]: agentErrorSchemas[HTTP_STATUS.NOT_FOUND],
      [HTTP_STATUS.BAD_REQUEST]: agentErrorSchemas[HTTP_STATUS.BAD_REQUEST],
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: agentErrorSchemas[HTTP_STATUS.INTERNAL_SERVER_ERROR],
    },
  },
} as const;

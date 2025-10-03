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

// Common response wrappers
export const responseWrappers = {
  success: (dataSchema: any) => ({
    type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      data: dataSchema,
      message: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
    },
    required: ['data'],
  }),
  
  error: (statusCode: number) => ({
    [statusCode]: {
      type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
      properties: {
        error: {
          type: ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
          properties: {
            message: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
            code: { type: ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          },
        },
      },
    },
  }),
} as const;

// Specific schemas for each endpoint
export const agentSchemas = {
  // GET /api/v1/agents
  listAgents: {
    tags: [ROUTE_CONSTANTS.TAG],
    summary: 'List all agents',
    description: 'Retrieve a list of all available Retell AI agents',
    response: {
      200: responseWrappers.success({
        type: ROUTE_CONSTANTS.RESPONSE_TYPES.ARRAY,
        items: agentDataSchema,
      }),
    },
  },

  // GET /api/v1/agents/:id
  getAgent: {
    tags: [ROUTE_CONSTANTS.TAG],
    summary: 'Get agent by ID',
    description: 'Retrieve a specific agent by its ID',
    params: commonParams.agentId,
    response: {
      200: responseWrappers.success(agentDataSchema),
      ...responseWrappers.error(404),
    },
  },

  // GET /api/v1/agents/:id/prompt
  getAgentPrompt: {
    tags: [ROUTE_CONSTANTS.TAG],
    summary: 'Get agent prompt',
    description: 'Retrieve the system prompt for a specific agent',
    params: commonParams.agentId,
    response: {
      200: responseWrappers.success({
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
      ...responseWrappers.error(404),
    },
  },
} as const;
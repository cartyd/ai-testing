import { HTTP_STATUS, HEALTH_CONFIG } from '../constants/controller.constants';

// Health route constants (reusing existing constants for consistency)
export const HEALTH_ROUTE_CONSTANTS = {
  PATHS: {
    HEALTH: '/health',
    READINESS: '/readiness', 
    LIVENESS: '/liveness',
  },
  TAG: 'Health',
  RESPONSE_TYPES: {
    OBJECT: 'object',
    STRING: 'string',
    NUMBER: 'number',
    ARRAY: 'array', // Added for completeness
  },
  DATE_FORMAT: 'date-time',
} as const;

// Error schema factory to eliminate duplication
function createErrorSchema() {
  return {
    type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      error: {
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
        properties: {
          message: { type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          code: { type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING },
          timestamp: { 
            type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
            format: HEALTH_ROUTE_CONSTANTS.DATE_FORMAT 
          },
        },
        required: ['message', 'code', 'timestamp'],
      },
    },
    required: ['error'],
  };
}

// Common response schemas
export const healthResponseSchemas = {
  // Detailed health response with services
  fullHealth: {
    type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      status: { 
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
        enum: [HEALTH_CONFIG.STATUS_VALUES.HEALTHY, HEALTH_CONFIG.STATUS_VALUES.UNHEALTHY] 
      },
      timestamp: { 
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
        format: HEALTH_ROUTE_CONSTANTS.DATE_FORMAT 
      },
      uptime: { type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.NUMBER },
      services: {
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
        additionalProperties: { 
          type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
          enum: [HEALTH_CONFIG.STATUS_VALUES.UP, HEALTH_CONFIG.STATUS_VALUES.DOWN] 
        },
      },
    },
    required: ['status', 'timestamp', 'uptime', 'services'],
  },

  // Readiness response - matches controller return value
  readiness: {
    type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      status: { 
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING,
        enum: [HEALTH_CONFIG.STATUS_VALUES.READY, HEALTH_CONFIG.STATUS_VALUES.NOT_READY]
      },
    },
    required: ['status'],
  },

  // Liveness response - matches controller return value
  liveness: {
    type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      status: { 
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING,
        enum: [HEALTH_CONFIG.STATUS_VALUES.ALIVE, HEALTH_CONFIG.STATUS_VALUES.NOT_ALIVE]
      },
    },
    required: ['status'],
  },
} as const;

// Error response schemas using factory to eliminate duplication
export const healthErrorSchemas = {
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: createErrorSchema(),
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: createErrorSchema(),
} as const;

// Complete schemas for each health endpoint
export const healthSchemas = {
  // GET /health - Detailed health check
  health: {
    tags: [HEALTH_ROUTE_CONSTANTS.TAG],
    summary: 'Health check',
    description: 'Check the overall health of the service',
    response: {
      [HTTP_STATUS.OK]: healthResponseSchemas.fullHealth,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: healthErrorSchemas[HTTP_STATUS.INTERNAL_SERVER_ERROR],
      [HTTP_STATUS.SERVICE_UNAVAILABLE]: healthErrorSchemas[HTTP_STATUS.SERVICE_UNAVAILABLE],
    },
  },

  // GET /readiness - Service readiness check
  readiness: {
    tags: [HEALTH_ROUTE_CONSTANTS.TAG],
    summary: 'Readiness check', 
    description: 'Check if the service is ready to accept requests',
    response: {
      [HTTP_STATUS.OK]: healthResponseSchemas.readiness,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: healthErrorSchemas[HTTP_STATUS.INTERNAL_SERVER_ERROR],
      [HTTP_STATUS.SERVICE_UNAVAILABLE]: healthErrorSchemas[HTTP_STATUS.SERVICE_UNAVAILABLE],
    },
  },

  // GET /liveness - Service liveness check
  liveness: {
    tags: [HEALTH_ROUTE_CONSTANTS.TAG],
    summary: 'Liveness check',
    description: 'Check if the service is alive',
    response: {
      [HTTP_STATUS.OK]: healthResponseSchemas.liveness,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: healthErrorSchemas[HTTP_STATUS.INTERNAL_SERVER_ERROR],
    },
  },
} as const;

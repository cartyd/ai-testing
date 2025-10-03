// Health route constants
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
  },
  DATE_FORMAT: 'date-time',
  STATUS_VALUES: {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    UP: 'up',
    DOWN: 'down',
  },
} as const;

// Common response schemas
export const healthResponseSchemas = {
  // Detailed health response with services
  fullHealth: {
    type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      status: { 
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING, 
        enum: [HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.HEALTHY, HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UNHEALTHY] 
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
          enum: [HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UP, HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.DOWN] 
        },
      },
    },
    required: ['status', 'timestamp', 'uptime', 'services'],
  },

  // Simple status response for readiness/liveness
  simpleStatus: {
    type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.OBJECT,
    properties: {
      status: { 
        type: HEALTH_ROUTE_CONSTANTS.RESPONSE_TYPES.STRING,
        enum: [HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.UP, HEALTH_ROUTE_CONSTANTS.STATUS_VALUES.DOWN]
      },
    },
    required: ['status'],
  },
} as const;

// Error response schemas
export const healthErrorSchemas = {
  500: {
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
  },
  503: {
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
  },
} as const;

// Complete schemas for each health endpoint
export const healthSchemas = {
  // GET /health - Detailed health check
  health: {
    tags: [HEALTH_ROUTE_CONSTANTS.TAG],
    summary: 'Health check',
    description: 'Check the overall health of the service',
    response: {
      200: healthResponseSchemas.fullHealth,
      500: healthErrorSchemas[500],
      503: healthErrorSchemas[503],
    },
  },

  // GET /readiness - Service readiness check
  readiness: {
    tags: [HEALTH_ROUTE_CONSTANTS.TAG],
    summary: 'Readiness check', 
    description: 'Check if the service is ready to accept requests',
    response: {
      200: healthResponseSchemas.simpleStatus,
      500: healthErrorSchemas[500],
      503: healthErrorSchemas[503],
    },
  },

  // GET /liveness - Service liveness check
  liveness: {
    tags: [HEALTH_ROUTE_CONSTANTS.TAG],
    summary: 'Liveness check',
    description: 'Check if the service is alive',
    response: {
      200: healthResponseSchemas.simpleStatus,
      500: healthErrorSchemas[500],
    },
  },
} as const;
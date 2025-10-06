import { HTTP_STATUS, HEALTH_CONFIG } from '../constants/controller.constants';

// Simple constants for health routes
export const HEALTH_PATHS = {
  HEALTH: '/health',
  READINESS: '/readiness',
  LIVENESS: '/liveness',
} as const;

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

// Response schemas
const fullHealthResponse = {
  type: 'object',
  properties: {
    status: { 
      type: 'string', 
      enum: [HEALTH_CONFIG.STATUS_VALUES.HEALTHY, HEALTH_CONFIG.STATUS_VALUES.UNHEALTHY] 
    },
    timestamp: { type: 'string', format: 'date-time' },
    uptime: { type: 'number' },
    services: {
      type: 'object',
      additionalProperties: { 
        type: 'string', 
        enum: [HEALTH_CONFIG.STATUS_VALUES.UP, HEALTH_CONFIG.STATUS_VALUES.DOWN] 
      },
    },
  },
  required: ['status', 'timestamp', 'uptime', 'services'],
} as const;

const readinessResponse = {
  type: 'object',
  properties: {
    status: { 
      type: 'string',
      enum: [HEALTH_CONFIG.STATUS_VALUES.READY, HEALTH_CONFIG.STATUS_VALUES.NOT_READY]
    },
  },
  required: ['status'],
} as const;

const livenessResponse = {
  type: 'object',
  properties: {
    status: { 
      type: 'string',
      enum: [HEALTH_CONFIG.STATUS_VALUES.ALIVE, HEALTH_CONFIG.STATUS_VALUES.NOT_ALIVE]
    },
  },
  required: ['status'],
} as const;

// API endpoint schemas
export const healthSchemas = {
  // GET /health
  health: {
    tags: ['Health'],
    summary: 'Health check',
    description: 'Check the overall health of the service',
    response: {
      [HTTP_STATUS.OK]: fullHealthResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
      [HTTP_STATUS.SERVICE_UNAVAILABLE]: errorResponse,
    },
  },

  // GET /readiness
  readiness: {
    tags: ['Health'],
    summary: 'Readiness check',
    description: 'Check if the service is ready to accept requests',
    response: {
      [HTTP_STATUS.OK]: readinessResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
      [HTTP_STATUS.SERVICE_UNAVAILABLE]: errorResponse,
    },
  },

  // GET /liveness
  liveness: {
    tags: ['Health'],
    summary: 'Liveness check',
    description: 'Check if the service is alive',
    response: {
      [HTTP_STATUS.OK]: livenessResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },
} as const;

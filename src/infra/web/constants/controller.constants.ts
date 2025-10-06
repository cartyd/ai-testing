// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Agent controller messages
export const AGENT_MESSAGES = {
  SUCCESS: {
    AGENTS_RETRIEVED: 'Agents retrieved successfully',
    AGENT_RETRIEVED: 'Agent retrieved successfully',
    AGENT_PROMPT_RETRIEVED: 'Agent prompt retrieved successfully',
  },
  ERROR: {
    AGENT_NOT_FOUND: (id: string) => `Agent with ID ${id} not found`,
    AGENT_PROMPT_NOT_FOUND: (id: string) => `Agent prompt for ID ${id} not found`,
    INVALID_AGENT_ID: (id: string) => `Invalid agent ID: ${id}`,
  },
} as const;

// Health controller messages
export const HEALTH_MESSAGES = {
  SUCCESS: {
    HEALTH_CHECK: 'Health check completed successfully',
    READINESS_CHECK: 'Service is ready',
    LIVENESS_CHECK: 'Service is alive',
  },
  ERROR: {
    HEALTH_CHECK_FAILED: 'Health check failed',
    SERVICE_NOT_READY: 'Service is not ready',
    SERVICE_NOT_ALIVE: 'Service is not alive',
  },
} as const;

// Health service configuration
export const HEALTH_CONFIG = {
  SERVICES: {
    RETELL_AI: 'retell-ai',
    DATABASE: 'database',
    EXTERNAL_API: 'external-api',
  },
  STATUS_VALUES: {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    UP: 'up',
    DOWN: 'down',
    READY: 'ready',
    NOT_READY: 'not_ready',
    ALIVE: 'alive',
    NOT_ALIVE: 'not_alive',
  },
  PERFORMANCE: {
    NS_TO_MS_DIVISOR: 1_000_000,
    RESPONSE_TIME_HEADER: 'X-Response-Time',
  },
} as const;

// Common response messages
export const COMMON_MESSAGES = {
  SUCCESS: {
    OPERATION_COMPLETED: 'Operation completed successfully',
    DATA_RETRIEVED: 'Data retrieved successfully',
  },
  ERROR: {
    INTERNAL_ERROR: 'An internal server error occurred',
    INVALID_REQUEST: 'Invalid request parameters',
    RESOURCE_NOT_FOUND: (resource: string, id: string) => `${resource} with ID ${id} not found`,
    HEALTH_CHECK_FAILED: 'Health check failed',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  },
} as const;

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HealthStatus, ApiResponse } from '../../../common/types';
import { 
  HTTP_STATUS, 
  HEALTH_MESSAGES, 
  HEALTH_CONFIG, 
  COMMON_MESSAGES 
} from '../constants/controller.constants';

// Types for dependency injection
export interface TimeProvider {
  now(): string;
  uptime(): number;
}

export interface ServiceChecker {
  checkAllServices(): Promise<Record<string, 'up' | 'down'>>;
}

// Default implementations
const defaultTimeProvider: TimeProvider = {
  now: () => new Date().toISOString(),
  uptime: () => Math.floor(process.uptime()),
};

const defaultServiceChecker: ServiceChecker = {
  async checkAllServices(): Promise<Record<string, 'up' | 'down'>> {
    // In a real app, these would be actual service health checks
    // For now, simulate a basic check that could potentially fail
    try {
      // Simulate service check that could fail
      const services: Record<string, 'up' | 'down'> = {
        [HEALTH_CONFIG.SERVICES.RETELL_AI]: 'up',
        // Add more services as needed
      };
      return services;
    } catch {
      return {
        [HEALTH_CONFIG.SERVICES.RETELL_AI]: 'down',
      };
    }
  },
};

// Utility functions
/**
 * Performs comprehensive health check of all services
 */
async function performHealthCheck(
  serviceChecker: ServiceChecker = defaultServiceChecker,
  timeProvider: TimeProvider = defaultTimeProvider
): Promise<HealthStatus> {
  const services = await serviceChecker.checkAllServices();
  const overallStatus = determineOverallHealth(services);

  return {
    status: overallStatus,
    timestamp: timeProvider.now(),
    uptime: timeProvider.uptime(),
    services,
  };
}

/**
 * Determines overall health status based on individual service statuses
 */
function determineOverallHealth(services: Record<string, 'up' | 'down'>): 'healthy' | 'unhealthy' {
  const hasDownServices = Object.values(services).some(
    status => status === 'down'
  );
  
  return hasDownServices ? 'unhealthy' : 'healthy';
}

/**
 * Checks if the service is ready to accept requests
 */
async function checkServiceReadiness(): Promise<{ status: string }> {
  // In a real app, check database connections, dependencies, etc.
  try {
    // Simulate dependency checks (database, cache, external services, etc.)
    // For now, always return ready
    return { status: HEALTH_CONFIG.STATUS_VALUES.READY };
  } catch {
    throw new Error('Service dependencies are not ready');
  }
}

/**
 * Checks if the service is alive
 */
async function checkServiceLiveness(): Promise<{ status: string }> {
  // Basic liveness check - service is running and responsive
  // This should be a very lightweight check
  return { status: HEALTH_CONFIG.STATUS_VALUES.ALIVE };
}

/**
 * Calculates response time from start time
 */
function calculateResponseTime(startTime: bigint): number {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime) / HEALTH_CONFIG.PERFORMANCE.NS_TO_MS_DIVISOR;
}

/**
 * Sends health response with performance metrics
 */
function sendHealthResponse(reply: FastifyReply, health: HealthStatus, responseTime: number): void {
  reply
    .header(HEALTH_CONFIG.PERFORMANCE.RESPONSE_TIME_HEADER, `${responseTime.toFixed(2)}ms`)
    .code(HTTP_STATUS.OK)
    .send(health);
}

/**
 * Sends a successful API response with raw data (for health endpoints)
 */
function sendSuccessResponse(reply: FastifyReply, data: unknown): void {
  // Health endpoints return raw bodies per existing API contract
  reply.code(HTTP_STATUS.OK).send(data);
}

/**
 * Determines appropriate HTTP status code based on error type
 */
function getErrorStatusCode(error: unknown): number {
  if (error instanceof Error) {
    // Check for specific error types that should return different status codes
    if (error.message.includes('dependencies') || error.message.includes('ready')) {
      return HTTP_STATUS.SERVICE_UNAVAILABLE; // 503 - Service dependencies not ready
    }
    if (error.message.includes('timeout') || error.message.includes('connection')) {
      return HTTP_STATUS.SERVICE_UNAVAILABLE; // 503 - External service issues
    }
  }
  
  // Default to Internal Server Error for unknown issues
  return HTTP_STATUS.INTERNAL_SERVER_ERROR; // 500 - Internal server error
}

/**
 * Handles errors with appropriate HTTP status codes and response format
 */
function handleError(reply: FastifyReply, error: unknown, defaultMessage: string): void {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  const statusCode = getErrorStatusCode(error);
  
  const response: ApiResponse = {
    data: null,
    message: errorMessage,
  };

  reply.code(statusCode).send(response);
}

// Handler factory functions
export interface HealthHandlers {
  getHealth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getReadiness: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getLiveness: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

interface HealthHandlerOptions {
  serviceChecker?: ServiceChecker;
  timeProvider?: TimeProvider;
}

export function createHealthHandlers(options: HealthHandlerOptions = {}): HealthHandlers {
  const { serviceChecker = defaultServiceChecker, timeProvider = defaultTimeProvider } = options;
  
  return {
    async getHealth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        const startTime = process.hrtime.bigint();
        
        const health = await performHealthCheck(serviceChecker, timeProvider);
        const responseTime = calculateResponseTime(startTime);
        
        sendHealthResponse(reply, health, responseTime);
      } catch (error) {
        handleError(reply, error, COMMON_MESSAGES.ERROR.HEALTH_CHECK_FAILED);
      }
    },

    async getReadiness(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        const readinessData = await checkServiceReadiness();
        sendSuccessResponse(reply, readinessData);
      } catch (error) {
        handleError(reply, error, HEALTH_MESSAGES.ERROR.SERVICE_NOT_READY);
      }
    },

    async getLiveness(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        const livenessData = await checkServiceLiveness();
        sendSuccessResponse(reply, livenessData);
      } catch (error) {
        handleError(reply, error, HEALTH_MESSAGES.ERROR.SERVICE_NOT_ALIVE);
      }
    },
  };
}

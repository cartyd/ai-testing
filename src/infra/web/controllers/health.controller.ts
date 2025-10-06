import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HealthStatus, ApiResponse } from '../../../common/types';
import { 
  HTTP_STATUS, 
  HEALTH_MESSAGES, 
  HEALTH_CONFIG, 
  COMMON_MESSAGES 
} from '../constants/controller.constants';

export class HealthController {
  async getHealth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const startTime = process.hrtime.bigint();
      
      const health = await this.performHealthCheck();
      const responseTime = this.calculateResponseTime(startTime);
      
      this.sendHealthResponse(reply, health, responseTime);
    } catch (error) {
      this.handleHealthCheckError(reply, error);
    }
  }

  async getReadiness(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const readinessData = await this.checkServiceReadiness();
      this.sendSuccessResponse(reply, readinessData, HEALTH_MESSAGES.SUCCESS.READINESS_CHECK);
    } catch (error) {
      this.handleServiceError(reply, error, HEALTH_MESSAGES.ERROR.SERVICE_NOT_READY);
    }
  }

  async getLiveness(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const livenessData = await this.checkServiceLiveness();
      this.sendSuccessResponse(reply, livenessData, HEALTH_MESSAGES.SUCCESS.LIVENESS_CHECK);
    } catch (error) {
      this.handleServiceError(reply, error, HEALTH_MESSAGES.ERROR.SERVICE_NOT_ALIVE);
    }
  }

  /**
   * Performs comprehensive health check of all services
   */
  private async performHealthCheck(): Promise<HealthStatus> {
    // In a real application, you would check actual service connections
    const services = await this.checkAllServices();
    const overallStatus = this.determineOverallHealth(services);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services,
    };
  }

  /**
   * Checks the status of all configured services
   */
  private async checkAllServices(): Promise<Record<string, 'up' | 'down'>> {
    // In a real app, these would be actual service health checks
    return {
      [HEALTH_CONFIG.SERVICES.RETELL_AI]: 'up' as const,
      // Add more services as needed
    };
  }

  /**
   * Determines overall health status based on individual service statuses
   */
  private determineOverallHealth(services: Record<string, 'up' | 'down'>): 'healthy' | 'unhealthy' {
    const hasDownServices = Object.values(services).some(
      status => status === 'down'
    );
    
    return hasDownServices ? 'unhealthy' : 'healthy';
  }

  /**
   * Checks if the service is ready to accept requests
   */
  private async checkServiceReadiness(): Promise<{ status: string }> {
    // In a real app, check database connections, dependencies, etc.
    return { status: HEALTH_CONFIG.STATUS_VALUES.READY };
  }

  /**
   * Checks if the service is alive
   */
  private async checkServiceLiveness(): Promise<{ status: string }> {
    // Basic liveness check - service is running
    return { status: HEALTH_CONFIG.STATUS_VALUES.ALIVE };
  }

  /**
   * Calculates response time from start time
   */
  private calculateResponseTime(startTime: bigint): number {
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / HEALTH_CONFIG.PERFORMANCE.NS_TO_MS_DIVISOR;
  }

  /**
   * Sends health response with performance metrics
   */
  private sendHealthResponse(reply: FastifyReply, health: HealthStatus, responseTime: number): void {
    reply
      .header(HEALTH_CONFIG.PERFORMANCE.RESPONSE_TIME_HEADER, `${responseTime.toFixed(2)}ms`)
      .code(HTTP_STATUS.OK)
      .send(health);
  }

  /**
   * Sends a successful API response with consistent format
   */
  private sendSuccessResponse(reply: FastifyReply, data: unknown, _message: string): void {
    // Health endpoints return raw bodies per existing API contract
    reply.code(HTTP_STATUS.OK).send(data);
  }

  /**
   * Handles health check errors with appropriate HTTP status
   */
  private handleHealthCheckError(reply: FastifyReply, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : COMMON_MESSAGES.ERROR.HEALTH_CHECK_FAILED;
    
    const response: ApiResponse = {
      data: null,
      message: errorMessage,
    };

    reply.code(HTTP_STATUS.SERVICE_UNAVAILABLE).send(response);
  }

  /**
   * Handles service-specific errors (readiness/liveness)
   */
  private handleServiceError(reply: FastifyReply, error: unknown, defaultMessage: string): void {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    
    const response: ApiResponse = {
      data: null,
      message: errorMessage,
    };

    reply.code(HTTP_STATUS.SERVICE_UNAVAILABLE).send(response);
  }
}

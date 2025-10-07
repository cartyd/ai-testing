import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../../../config';

/**
 * Health check status levels
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

/**
 * Individual dependency health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

/**
 * Overall health check response
 */
export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: number;
  };
  dependencies: Record<string, HealthCheckResult>;
}

/**
 * Health checker for external dependencies
 */
class DependencyHealthChecker {
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  registerHealthCheck(name: string, checker: () => Promise<HealthCheckResult>): void {
    this.healthChecks.set(name, checker);
  }

  async checkAll(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};
    
    for (const [name, checker] of this.healthChecks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          checker(),
          new Promise<HealthCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);
        
        if (!result.responseTime) {
          result.responseTime = Date.now() - startTime;
        }
        
        results[name] = result;
      } catch (error) {
        results[name] = {
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : 'Unknown error',
          responseTime: 5000, // Timeout duration
        };
      }
    }

    return results;
  }
}

/**
 * System metrics utilities
 */
function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();
    
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const endTime = Date.now();
      
      const totalCpuTime = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
      const totalElapsedTime = endTime - startTime;
      const cpuPercent = (totalCpuTime / totalElapsedTime) * 100;
      
      resolve(Math.min(100, Math.max(0, cpuPercent))); // Clamp between 0-100
    }, 100);
  });
}

/**
 * Retell API health checker
 */
async function checkRetellApiHealth(): Promise<HealthCheckResult> {
  try {
    const startTime = Date.now();
    
    // Simple connectivity check to Retell API
    // Note: This is a basic implementation. You might want to adjust based on actual Retell API endpoints
    const response = await fetch('https://api.retellai.com/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.RETELL_API_KEY}`,
      },
      signal: AbortSignal.timeout(4000), // 4 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: HealthStatus.HEALTHY,
        message: 'Retell API is accessible',
        responseTime,
        metadata: {
          statusCode: response.status,
        },
      };
    } else {
      return {
        status: HealthStatus.DEGRADED,
        message: `Retell API returned ${response.status}`,
        responseTime,
        metadata: {
          statusCode: response.status,
        },
      };
    }
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: error instanceof Error ? error.message : 'Failed to connect to Retell API',
      metadata: {
        error: error instanceof Error ? error.name : 'UnknownError',
      },
    };
  }
}

/**
 * Enhanced health check plugin
 */
async function enhancedHealthPlugin(fastify: FastifyInstance) {
  const healthChecker = new DependencyHealthChecker();

  // Register default health checks
  healthChecker.registerHealthCheck('retell-api', checkRetellApiHealth);
  
  // You can register additional health checks here
  // healthChecker.registerHealthCheck('database', checkDatabaseHealth);
  // healthChecker.registerHealthCheck('redis', checkRedisHealth);

  // Enhanced health endpoint
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const [dependencyResults, cpuUsage] = await Promise.all([
        healthChecker.checkAll(),
        getCpuUsage(),
      ]);

      // Determine overall health status
      const dependencyStatuses = Object.values(dependencyResults).map(r => r.status);
      let overallStatus = HealthStatus.HEALTHY;
      
      if (dependencyStatuses.some(status => status === HealthStatus.UNHEALTHY)) {
        overallStatus = HealthStatus.UNHEALTHY;
      } else if (dependencyStatuses.some(status => status === HealthStatus.DEGRADED)) {
        overallStatus = HealthStatus.DEGRADED;
      }

      const response: HealthCheckResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.NODE_ENV,
        system: {
          memory: process.memoryUsage(),
          cpu: cpuUsage,
        },
        dependencies: dependencyResults,
      };

      // Set appropriate status code based on health
      const statusCode = overallStatus === HealthStatus.HEALTHY ? 200 : 
                        overallStatus === HealthStatus.DEGRADED ? 200 : 503;
      
      reply.status(statusCode);
      return response;

    } catch (error) {
      const errorResponse: HealthCheckResponse = {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.NODE_ENV,
        system: {
          memory: process.memoryUsage(),
          cpu: 0,
        },
        dependencies: {
          'health-check-system': {
            status: HealthStatus.UNHEALTHY,
            message: error instanceof Error ? error.message : 'Health check system error',
          },
        },
      };

      reply.status(503);
      return errorResponse;
    }
  });

  // Simple liveness probe (for Kubernetes/Docker)
  fastify.get('/health/live', async (request, reply) => {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  });

  // Readiness probe (for Kubernetes/Docker)
  fastify.get('/health/ready', async (request, reply) => {
    try {
      const dependencyResults = await healthChecker.checkAll();
      const hasUnhealthyDependencies = Object.values(dependencyResults)
        .some(result => result.status === HealthStatus.UNHEALTHY);

      if (hasUnhealthyDependencies) {
        reply.status(503);
        return {
          status: 'not-ready',
          timestamp: new Date().toISOString(),
          dependencies: dependencyResults,
        };
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.status(503);
      return {
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Decorate fastify with health checker
  fastify.decorate('healthChecker', healthChecker);
}

export default fp(enhancedHealthPlugin, {
  name: 'enhanced-health',
});

export { DependencyHealthChecker };

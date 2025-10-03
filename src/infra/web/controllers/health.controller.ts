import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HealthStatus } from '../../../common/types';

export class HealthController {
  async getHealth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const startTime = process.hrtime.bigint();
    
    // Basic health check - in a real app you might check database connections, etc.
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        'retell-ai': 'up', // In a real app, you'd actually test the connection
      },
    };

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

    reply
      .header('X-Response-Time', `${responseTime.toFixed(2)}ms`)
      .code(200)
      .send(health);
  }

  async getReadiness(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Readiness check - return 200 if the service is ready to accept requests
    reply.code(200).send({ status: 'ready' });
  }

  async getLiveness(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Liveness check - return 200 if the service is alive
    reply.code(200).send({ status: 'alive' });
  }
}
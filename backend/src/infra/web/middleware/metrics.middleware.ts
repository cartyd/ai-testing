import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Application metrics storage
 */
class MetricsCollector {
  private static instance: MetricsCollector;
  
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeHistogram: number[] = [];
  private statusCodeCounts: Map<number, number> = new Map();
  private endpointMetrics: Map<string, { count: number; totalTime: number; errors: number }> = new Map();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordRequest(method: string, url: string, statusCode: number, duration: number): void {
    this.requestCount++;
    this.responseTimeHistogram.push(duration);
    
    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimeHistogram.length > 1000) {
      this.responseTimeHistogram = this.responseTimeHistogram.slice(-1000);
    }

    // Count status codes
    this.statusCodeCounts.set(statusCode, (this.statusCodeCounts.get(statusCode) || 0) + 1);

    // Record errors
    if (statusCode >= 400) {
      this.errorCount++;
    }

    // Track endpoint-specific metrics
    const endpoint = `${method} ${url}`;
    const endpointData = this.endpointMetrics.get(endpoint) || { count: 0, totalTime: 0, errors: 0 };
    endpointData.count++;
    endpointData.totalTime += duration;
    if (statusCode >= 400) {
      endpointData.errors++;
    }
    this.endpointMetrics.set(endpoint, endpointData);
  }

  getMetrics() {
    const avgResponseTime = this.responseTimeHistogram.length > 0 
      ? this.responseTimeHistogram.reduce((a, b) => a + b, 0) / this.responseTimeHistogram.length
      : 0;

    const p95ResponseTime = this.responseTimeHistogram.length > 0
      ? this.calculatePercentile(this.responseTimeHistogram, 0.95)
      : 0;

    const p99ResponseTime = this.responseTimeHistogram.length > 0
      ? this.calculatePercentile(this.responseTimeHistogram, 0.99)
      : 0;

    // Convert endpoint metrics to a more readable format
    const endpointStats = Array.from(this.endpointMetrics.entries()).map(([endpoint, data]) => ({
      endpoint,
      requests: data.count,
      averageResponseTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
      errors: data.errors,
      errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) + '%' : '0%',
    }));

    return {
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%' : '0%',
      },
      responseTime: {
        average: Math.round(avgResponseTime),
        p95: Math.round(p95ResponseTime),
        p99: Math.round(p99ResponseTime),
      },
      statusCodes: Object.fromEntries(this.statusCodeCounts),
      endpoints: endpointStats.sort((a, b) => b.requests - a.requests),
    };
  }

  private calculatePercentile(arr: number[], percentile: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeHistogram = [];
    this.statusCodeCounts.clear();
    this.endpointMetrics.clear();
  }
}

/**
 * Metrics collection plugin
 */
async function metricsPlugin(fastify: FastifyInstance) {
  const metrics = MetricsCollector.getInstance();

  // Collect metrics on response
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestMetrics = (request as any).metrics;
    if (requestMetrics) {
      const duration = Date.now() - requestMetrics.startTime;
      metrics.recordRequest(request.method, request.url, reply.statusCode, duration);
    }
  });

  // Add metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ...metrics.getMetrics(),
    };
  });

  // Decorate fastify instance with metrics
  fastify.decorate('metrics', metrics);
}

export default fp(metricsPlugin, {
  name: 'metrics',
  dependencies: ['request-logging'], // Ensure request logging runs first
});

export { MetricsCollector };

import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';

import { config, isDevelopment } from '../../config';
import { registerErrorHandler } from '../../common/middleware/error-handler';
import { RetellApiClient, createRetellAgentRepository } from '../http';
import { createAgentHandlers } from './controllers/agent.controller';
import { createHealthHandlers } from './controllers/health.controller';
import { agentRoutes } from './routes/agent.routes';
import { healthRoutes } from './routes/health.routes';
import { ROOT_RESPONSE } from './constants/api.constants';
import { 
  getHelmetConfig, 
  getCorsConfig, 
  getSwaggerConfig, 
  getSwaggerUIConfig,
  getServerUrl,
  getRateLimitConfig,
} from './config/plugins.config';
import type { AppDependencies, DependencyFactory } from './types/dependencies';
import { setupGracefulShutdown, type GracefulShutdownOptions } from './utils/graceful-shutdown';

// Import monitoring middleware
import requestLoggingMiddleware from './middleware/request-logging.middleware';
import metricsMiddleware from './middleware/metrics.middleware';
import enhancedHealthMiddleware from './middleware/enhanced-health.middleware';

/**
 * Default dependency factory - creates production dependencies
 */
const createDefaultDependencies = (): AppDependencies => {
  const retellClient = new RetellApiClient();
  const agentRepository = createRetellAgentRepository(retellClient);
  
  return {
    retellClient,
    agentRepository,
  };
};

/**
 * Application creation options
 */
export interface CreateAppOptions {
  /** Custom dependency factory for testing/configuration */
  dependencyFactory?: DependencyFactory;
  /** Custom Fastify options */
  fastifyOptions?: Record<string, any>;
  /** Enable/disable monitoring features */
  monitoring?: {
    requestLogging?: boolean;
    metrics?: boolean;
    rateLimit?: boolean;
    enhancedHealth?: boolean;
  };
}

/**
 * Creates and configures the Fastify application
 */
export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const { 
    dependencyFactory = createDefaultDependencies,
    fastifyOptions = {},
    monitoring = {
      requestLogging: true,
      metrics: true,
      rateLimit: true,
      enhancedHealth: true,
    }
  } = options;

  // Create Fastify instance with configurable options
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(isDevelopment() && { 
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
    disableRequestLogging: monitoring.requestLogging, // We handle this with our custom middleware
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    ...fastifyOptions,
  });

  // Register plugins in proper order
  await registerMonitoringPlugins(fastify, monitoring);
  await registerSecurityPlugins(fastify, monitoring.rateLimit);
  await registerDocumentationPlugins(fastify);
  await registerErrorHandler(fastify);
  
  // Initialize dependencies
  const dependencies = await dependencyFactory();
  
  // Register application routes
  await registerApplicationRoutes(fastify, dependencies);
  await registerRootRoute(fastify);

  return fastify;
}

/**
 * Register monitoring and performance plugins
 */
async function registerMonitoringPlugins(
  fastify: FastifyInstance, 
  monitoring: CreateAppOptions['monitoring'] = {}
): Promise<void> {
  // Request logging middleware (must be first for metrics)
  if (monitoring.requestLogging !== false) {
    await fastify.register(requestLoggingMiddleware);
  }

  // Metrics collection middleware
  if (monitoring.metrics !== false) {
    await fastify.register(metricsMiddleware);
  }

  // Enhanced health checks
  if (monitoring.enhancedHealth !== false) {
    await fastify.register(enhancedHealthMiddleware);
  }
}

/**
 * Register security-related plugins
 */
async function registerSecurityPlugins(fastify: FastifyInstance, rateLimit = true): Promise<void> {
  // Rate limiting (before other security measures)
  if (rateLimit && !isDevelopment()) { // Skip rate limiting in development
    await fastify.register(fastifyRateLimit, getRateLimitConfig());
  }

  // Security headers (Helmet)
  await fastify.register(fastifyHelmet, getHelmetConfig());
  
  // CORS
  await fastify.register(fastifyCors, getCorsConfig());
}

/**
 * Register API documentation plugins
 */
async function registerDocumentationPlugins(fastify: FastifyInstance): Promise<void> {
  // Swagger for API documentation
  await fastify.register(fastifySwagger, getSwaggerConfig());
  
  // Swagger UI (development only)
  if (isDevelopment()) {
    await fastify.register(fastifySwaggerUI, getSwaggerUIConfig());
  }
}

/**
 * Register application routes
 */
async function registerApplicationRoutes(
  fastify: FastifyInstance, 
  dependencies: AppDependencies
): Promise<void> {
  // Create handlers with injected dependencies
  const agentHandlers = createAgentHandlers(dependencies.agentRepository);
  const healthHandlers = createHealthHandlers();

  // Register route groups
  await agentRoutes(fastify, agentHandlers);
  await healthRoutes(fastify, healthHandlers);
}

/**
 * Register the root route
 */
async function registerRootRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (request, reply) => {
    return {
      message: ROOT_RESPONSE.MESSAGE,
      version: ROOT_RESPONSE.VERSION,
      timestamp: new Date().toISOString(),
      docs: isDevelopment() ? '/docs' : undefined,
      server: getServerUrl(),
      monitoring: {
        metrics: '/metrics',
        health: '/health',
        liveness: '/health/live',
        readiness: '/health/ready',
      },
    };
  });
}

/**
 * Server startup options
 */
export interface StartServerOptions extends CreateAppOptions {
  /** Graceful shutdown configuration */
  gracefulShutdown?: GracefulShutdownOptions;
  /** Custom port (overrides config) */
  port?: number;
  /** Custom host (overrides config) */
  host?: string;
}

/**
 * Starts the server with graceful shutdown handling
 */
export async function startServer(options: StartServerOptions = {}): Promise<FastifyInstance> {
  const {
    gracefulShutdown = {},
    port = config.PORT,
    host = config.HOST,
    ...createAppOptions
  } = options;

  const app = await createApp(createAppOptions);

  // Setup graceful shutdown with custom cleanup
  setupGracefulShutdown(app, {
    timeout: 15000, // 15 seconds for API shutdowns
    onShutdown: async () => {
      app.log.info('Running custom cleanup...');
      // Add any custom cleanup logic here
      // e.g., close database connections, cancel pending operations, etc.
      
      // Close external clients if available
      if ((app as any).retellClient && typeof (app as any).retellClient.close === 'function') {
        await (app as any).retellClient.close();
      }
    },
    ...gracefulShutdown,
  });

  try {
    await app.listen({
      port,
      host,
    });

    app.log.info(`🚀 Server is running on ${getServerUrl()}`);
    
    if (isDevelopment()) {
      app.log.info(`📚 API documentation available at ${getServerUrl()}/docs`);
    }
    
    // Log monitoring endpoints
    app.log.info(`📊 Metrics available at ${getServerUrl()}/metrics`);
    app.log.info(`❤️  Health check available at ${getServerUrl()}/health`);

    return app;
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    throw new Error(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * For backward compatibility - creates app with default dependencies
 * @deprecated Use createApp() instead for better testability
 */
export async function createAppWithDefaults(): Promise<FastifyInstance> {
  return createApp();
}

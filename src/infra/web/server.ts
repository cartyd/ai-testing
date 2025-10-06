import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

import { config, isDevelopment } from '../../config';
import { registerErrorHandler } from '../../common/middleware/error-handler';
import { RetellApiClient, createRetellAgentRepository } from '../http';
import { createAgentHandlers } from './controllers/agent.controller';
import { createHealthHandlers } from './controllers/health.controller';
import { agentRoutes } from './routes/agent.routes';
import { healthRoutes } from './routes/health.routes';

export async function createApp(): Promise<FastifyInstance> {
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
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  });

  // Register CORS
  await fastify.register(fastifyCors, {
    origin: isDevelopment() ? true : false, // Allow all origins in dev, restrict in prod
    credentials: true,
  });

  // Register Swagger for API documentation
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Retell AI API',
        description: 'REST API for Retell AI agent management',
        version: '1.0.0',
        contact: {
          name: 'API Support',
        },
      },
      servers: [
        {
          url: `http://${config.HOST}:${config.PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Agents', description: 'Agent management endpoints' },
        { name: 'Health', description: 'Health check endpoints' },
      ],
    },
  });

  // Register Swagger UI
  if (isDevelopment()) {
    await fastify.register(fastifySwaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
  }

  // Register error handler
  await registerErrorHandler(fastify);

  // Initialize dependencies
  const retellClient = new RetellApiClient();
  const agentRepository = createRetellAgentRepository(retellClient);
  
  // Create functional handlers
  const agentHandlers = createAgentHandlers(agentRepository);
  const healthHandlers = createHealthHandlers();

  // Register routes
  await agentRoutes(fastify, agentHandlers);
  await healthRoutes(fastify, healthHandlers);

  // Root route
  fastify.get('/', async (request, reply) => {
    return {
      message: 'Retell AI API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      docs: isDevelopment() ? '/docs' : undefined,
    };
  });

  return fastify;
}

export async function startServer(): Promise<FastifyInstance> {
  const app = await createApp();

  try {
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    app.log.info(`Server is running on http://${config.HOST}:${config.PORT}`);
    
    if (isDevelopment()) {
      app.log.info(`API documentation available at http://${config.HOST}:${config.PORT}/docs`);
    }

    return app;
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
}
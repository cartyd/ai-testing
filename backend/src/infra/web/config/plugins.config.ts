import { FastifyHelmetOptions } from '@fastify/helmet';
import { FastifyCorsOptions } from '@fastify/cors';
import { SwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

import { config, isDevelopment } from '../../../config';
import { API_METADATA } from '../constants/api.constants';

/**
 * Helmet security configuration
 */
export function getHelmetConfig(): FastifyHelmetOptions {
  return {
    // Configure based on environment
    contentSecurityPolicy: isDevelopment() ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for API docs
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Allow cross-origin embedding in development for Swagger UI
    crossOriginEmbedderPolicy: isDevelopment() ? false : { policy: 'require-corp' },
    // Don't hide the X-Powered-By header in development for debugging
    hidePoweredBy: !isDevelopment(),
    // HSTS only in production with HTTPS
    hsts: isDevelopment() ? false : {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  };
}

/**
 * CORS configuration
 */
export function getCorsConfig(): FastifyCorsOptions {
  return {
    origin: isDevelopment(), // Allow all origins in dev, restrict in prod
    credentials: true,
  };
}

/**
 * Generate server URL based on environment
 */
export function getServerUrl(): string {
  const protocol = isDevelopment() ? 'http' : 'https';
  return `${protocol}://${config.HOST}:${config.PORT}`;
}

/**
 * Swagger OpenAPI configuration
 */
export function getSwaggerConfig(): SwaggerOptions {
  return {
    openapi: {
      openapi: API_METADATA.OPENAPI_VERSION,
      info: {
        title: API_METADATA.TITLE,
        description: API_METADATA.DESCRIPTION,
        version: API_METADATA.VERSION,
        contact: {
          name: API_METADATA.CONTACT_NAME,
        },
      },
      servers: [
        {
          url: getServerUrl(),
          description: isDevelopment() ? 'Development server' : 'Production server',
        },
      ],
      tags: API_METADATA.TAGS,
    },
  };
}

/**
 * Swagger UI configuration
 */
export function getSwaggerUIConfig(): FastifySwaggerUiOptions {
  return {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  };
}

/**
 * Rate limiting configuration
 */
export function getRateLimitConfig() {
  return {
    max: isDevelopment() ? 1000 : 100, // requests per timeWindow
    timeWindow: '1 minute',
    errorResponseBuilder: (request: any, context: any) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${context.max} requests per ${context.timeWindow}`,
        statusCode: 429,
        retryAfter: context.retryAfter,
      };
    },
  };
}

import type { FastifyInstance } from 'fastify';

/**
 * Graceful shutdown configuration
 */
export interface GracefulShutdownOptions {
  /** Timeout in milliseconds for graceful shutdown */
  timeout?: number;
  /** Signals to listen for */
  signals?: NodeJS.Signals[];
  /** Custom cleanup function */
  onShutdown?: () => Promise<void> | void;
}

const DEFAULT_OPTIONS: Required<GracefulShutdownOptions> = {
  timeout: 10000, // 10 seconds
  signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
  onShutdown: async () => {},
};

/**
 * Sets up graceful shutdown handling for a Fastify server
 */
export function setupGracefulShutdown(
  app: FastifyInstance, 
  options: GracefulShutdownOptions = {}
): void {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      app.log.warn(`Received ${signal} again, forcing exit`);
      process.exit(1);
    }

    isShuttingDown = true;
    app.log.info(`Received ${signal}, starting graceful shutdown...`);

    const shutdownTimeout = setTimeout(() => {
      app.log.error('Graceful shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, config.timeout);

    try {
      // Run custom cleanup
      await config.onShutdown();

      // Close the Fastify server
      await app.close();
      
      app.log.info('Graceful shutdown completed');
      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (error) {
      app.log.error(error, 'Error during graceful shutdown');
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  // Listen for shutdown signals
  config.signals.forEach(signal => {
    process.on(signal, () => {
      shutdown(signal).catch(error => {
        console.error('Shutdown error:', error);
        process.exit(1);
      });
    });
  });

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    app.log.error(error, 'Uncaught exception');
    shutdown('uncaughtException').catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    app.log.error({ reason, promise }, 'Unhandled rejection');
    shutdown('unhandledRejection').catch(() => process.exit(1));
  });
}

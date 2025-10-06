import 'dotenv/config'; // Load environment variables first
import { startServer } from './infra/web/server';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown handler
function gracefulShutdown(app: any) {
  return async (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      await app.close();
      console.log('Server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
}

// Start the application
async function main() {
  try {
    const app = await startServer();
    
    // Setup graceful shutdown
    const shutdown = gracefulShutdown(app);
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    console.log('✅ Application started successfully');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Run the application
main();
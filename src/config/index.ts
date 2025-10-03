import { z } from 'zod';
import { requireEnv } from '../common/utils';
import type { Environment, LogLevel } from '../common/types';

// Configuration schema
const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'testing', 'production']).default('development'),
  
  // Server
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
  
  // Retell AI
  RETELL_API_KEY: z.string().min(1, 'Retell AI API key is required'),
  RETELL_BASE_URL: z.string().url().default('https://api.retellai.com/v2'),
  
  // Logging
  LOG_LEVEL: z.enum(['silent', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  
  // API
  API_TIMEOUT: z.coerce.number().default(10000), // 10 seconds
  API_RETRY_ATTEMPTS: z.coerce.number().default(3),
});

export type Config = z.infer<typeof configSchema>;

// Load and validate configuration
function loadConfig(): Config {
  try {
    const config = configSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues
        .filter(issue => issue.code === 'invalid_type')
        .map(issue => issue.path.join('.'));
      
      throw new Error(
        `Configuration validation failed. Missing or invalid fields: ${missingFields.join(', ')}`
      );
    }
    throw error;
  }
}

// Export singleton config instance
export const config = loadConfig();

// Helper functions
export const isDevelopment = (): boolean => config.NODE_ENV === 'development';
export const isTesting = (): boolean => config.NODE_ENV === 'testing';
export const isProduction = (): boolean => config.NODE_ENV === 'production';
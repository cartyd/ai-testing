// Shared types and utilities for both frontend and backend

// Common API response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: Record<string, 'up' | 'down'>;
}

// Environment types
export type Environment = 'development' | 'testing' | 'production';

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Log levels
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Agent types (from your backend)
export interface Agent {
  id: string;
  name: string;
  prompt: string;
  voiceId?: string;
  language?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  version?: number;
  versionTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPrompt {
  agentId: string;
  prompt: string;
  version?: number;
  versionTitle?: string;
  updatedAt: string;
}

// Utility functions that can be shared
export const createApiResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  data,
  message,
});

export const createErrorResponse = (message: string): ApiResponse<null> => ({
  data: null,
  message,
});
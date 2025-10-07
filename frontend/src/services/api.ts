import { Agent, AgentPrompt, ApiResponse } from 'shared';

// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

// Agent API services
export const agentService = {
  // Get all agents
  async getAgents(): Promise<Agent[]> {
    const response: ApiResponse<Agent[]> = await apiRequest('/api/v1/agents');
    return response.data;
  },

  // Get a specific agent by ID
  async getAgent(id: string): Promise<Agent> {
    const response: ApiResponse<Agent> = await apiRequest(`/api/v1/agents/${id}`);
    return response.data;
  },

  // Get agent's prompt
  async getAgentPrompt(id: string): Promise<AgentPrompt> {
    const response: ApiResponse<AgentPrompt> = await apiRequest(`/api/v1/agents/${id}/prompt`);
    return response.data;
  },
};

// Health check service
export const healthService = {
  async getHealth() {
    return await apiRequest('/health');
  },
};

export { ApiError };
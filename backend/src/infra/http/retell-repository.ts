import type { AgentRepository } from '../../app/ports';
import type { Agent, AgentPrompt } from '../../core/entities';
import type { RetellApiClient } from './retell-client';

// Pure mapping functions
/**
 * Maps Retell API agent data to domain Agent entity
 */
function mapToAgent(apiAgent: any): Agent {
  return {
    id: apiAgent.agent_id,
    name: apiAgent.agent_name,
    prompt: apiAgent.system_prompt || '', // Some agents might not have this field
    voiceId: apiAgent.voice_id,
    language: apiAgent.language,
    model: apiAgent.response_engine?.type || 'unknown',
    temperature: apiAgent.temperature || 0.7,
    maxTokens: apiAgent.max_tokens || 1000,
    createdAt: new Date(), // API doesn't provide created_time, use current time
    updatedAt: new Date(apiAgent.last_modification_timestamp), // Use correct timestamp field
  };
}

/**
 * Maps Retell API prompt data to domain AgentPrompt entity
 */
function mapToAgentPrompt(apiPrompt: any): AgentPrompt {
  return {
    agentId: apiPrompt.agent_id,
    prompt: apiPrompt.system_prompt,
    version: apiPrompt.prompt_version,
    updatedAt: new Date(apiPrompt.last_modification_time), // Already in milliseconds
  };
}

/**
 * Checks if an error is a 404 (not found) error
 */
function is404Error(error: unknown): boolean {
  return error instanceof Error && error.message.includes('404');
}

/**
 * Creates a RetellAgentRepository implementation with functional approach
 */
export function createRetellAgentRepository(retellClient: RetellApiClient): AgentRepository {
  return {
    async listAgents(): Promise<Agent[]> {
      const response = await retellClient.listAgents();
      return response.map(mapToAgent);
    },

    async getAgent(id: string): Promise<Agent | null> {
      try {
        const response = await retellClient.getAgent(id);
        return mapToAgent(response);
      } catch (error) {
        // If it's a 404 from the API, return null instead of throwing
        if (is404Error(error)) {
          return null;
        }
        throw error;
      }
    },

    async getAgentPrompt(id: string): Promise<AgentPrompt | null> {
      try {
        const response = await retellClient.getAgentPrompt(id);
        return mapToAgentPrompt(response);
      } catch (error) {
        // If it's a 404 from the API, return null instead of throwing
        if (is404Error(error)) {
          return null;
        }
        throw error;
      }
    },
  };
}

// For backward compatibility, export a class that uses the functional implementation
export class RetellAgentRepository implements AgentRepository {
  private readonly implementation: AgentRepository;

  constructor(retellClient: RetellApiClient) {
    this.implementation = createRetellAgentRepository(retellClient);
  }

  async listAgents(): Promise<Agent[]> {
    return this.implementation.listAgents();
  }

  async getAgent(id: string): Promise<Agent | null> {
    return this.implementation.getAgent(id);
  }

  async getAgentPrompt(id: string): Promise<AgentPrompt | null> {
    return this.implementation.getAgentPrompt(id);
  }
}

import type { AgentRepository } from '../../app/ports';
import type { Agent, AgentPrompt } from '../../core/entities';
import { RetellApiClient } from './retell-client';
import { NotFoundError } from '../../common/errors/app-errors';

export class RetellAgentRepository implements AgentRepository {
  constructor(private readonly retellClient: RetellApiClient) {}

  async listAgents(): Promise<Agent[]> {
    const response = await this.retellClient.listAgents();
    return response.map(this.mapToAgent);
  }

  async getAgent(id: string): Promise<Agent | null> {
    try {
      const response = await this.retellClient.getAgent(id);
      return this.mapToAgent(response);
    } catch (error) {
      // If it's a 404 from the API, return null instead of throwing
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getAgentPrompt(id: string): Promise<AgentPrompt | null> {
    try {
      const response = await this.retellClient.getAgentPrompt(id);
      return this.mapToAgentPrompt(response);
    } catch (error) {
      // If it's a 404 from the API, return null instead of throwing
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  private mapToAgent(apiAgent: any): Agent {
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

  private mapToAgentPrompt(apiPrompt: any): AgentPrompt {
    return {
      agentId: apiPrompt.agent_id,
      prompt: apiPrompt.system_prompt,
      version: apiPrompt.prompt_version,
      updatedAt: new Date(apiPrompt.last_modification_time), // Already in milliseconds
    };
  }
}
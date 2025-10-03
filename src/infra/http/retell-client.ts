import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { config } from '../../config';
import { ExternalServiceError } from '../../common/errors/app-errors';
import type { 
  AgentResponseOutput, 
  ListAgentsResponseOutput,
  AgentPromptResponseOutput,
  LLMResponseOutput
} from '../../app/validators/agent-schema';

export class RetellApiClient {
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: config.RETELL_BASE_URL,
      timeout: config.API_TIMEOUT,
      headers: {
        'Authorization': `Bearer ${config.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message || 'Retell AI API request failed';
        const status = error.response?.status;
        
        throw new ExternalServiceError(
          `Retell AI API error: ${message}`,
          'retell-ai',
          {
            status,
            url: error.config?.url,
            method: error.config?.method,
          }
        );
      }
    );
  }

  async listAgents(): Promise<ListAgentsResponseOutput> {
    try {
      const response = await this.httpClient.get<ListAgentsResponseOutput>('/list-agents');
      return response.data;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Failed to list agents from Retell AI',
        'retell-ai',
        { originalError: error }
      );
    }
  }

  async getAgent(id: string): Promise<AgentResponseOutput> {
    try {
      const response = await this.httpClient.get<AgentResponseOutput>(`/get-agent/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        `Failed to get agent ${id} from Retell AI`,
        'retell-ai',
        { originalError: error, agentId: id }
      );
    }
  }

  async getLLM(llmId: string): Promise<LLMResponseOutput> {
    try {
      const response = await this.httpClient.get<LLMResponseOutput>(`/get-retell-llm/${llmId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        `Failed to get LLM ${llmId} from Retell AI`,
        'retell-ai',
        { originalError: error, llmId }
      );
    }
  }

  async getAgentPrompt(id: string): Promise<AgentPromptResponseOutput> {
    try {
      // First get the agent to get the LLM ID
      const agent = await this.getAgent(id);
      if (!agent.response_engine?.llm_id) {
        throw new Error(`Agent ${id} does not have an associated LLM`);
      }
      
      // Then get the LLM details which contains the prompt
      const llm = await this.getLLM(agent.response_engine.llm_id);
      
      // Return in the expected format
      return {
        agent_id: id,
        system_prompt: llm.general_prompt || '',
        prompt_version: llm.version,
        last_modification_time: llm.last_modification_timestamp,
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        `Failed to get agent prompt for ${id} from Retell AI`,
        'retell-ai',
        { originalError: error, agentId: id }
      );
    }
  }
}
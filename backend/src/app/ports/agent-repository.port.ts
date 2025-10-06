import type { Agent, AgentPrompt } from '../../core/entities';

export interface AgentRepository {
  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  getAgentPrompt(id: string): Promise<AgentPrompt | null>;
}
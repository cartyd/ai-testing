import type { Agent } from '../entities';
import type { AgentRepository } from '../../app/ports';

export async function listAgents(
  agentRepository: AgentRepository
): Promise<Agent[]> {
  return await agentRepository.listAgents();
}
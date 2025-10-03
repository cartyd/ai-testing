import type { Agent } from '../entities';
import type { AgentRepository } from '../../app/ports';

export async function getAgent(
  agentRepository: AgentRepository,
  id: string
): Promise<Agent | null> {
  if (!id || id.trim() === '') {
    throw new Error('Agent ID is required');
  }
  
  return await agentRepository.getAgent(id);
}
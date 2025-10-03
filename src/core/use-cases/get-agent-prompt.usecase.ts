import type { AgentPrompt } from '../entities';
import type { AgentRepository } from '../../app/ports';

export async function getAgentPrompt(
  agentRepository: AgentRepository,
  id: string
): Promise<AgentPrompt | null> {
  if (!id || id.trim() === '') {
    throw new Error('Agent ID is required');
  }
  
  return await agentRepository.getAgentPrompt(id);
}
import type { AgentRepository } from '../../app/ports';
import type { AgentVersion } from '../entities';
import { ValidationError } from '../../common/errors/app-errors';

export async function getAgentVersions(
  agentRepository: AgentRepository,
  agentId: string
): Promise<AgentVersion[]> {
  // Validate input
  if (!agentId || typeof agentId !== 'string' || agentId.trim().length === 0) {
    throw new ValidationError('Agent ID is required');
  }

  // Get agent versions from repository
  return await agentRepository.getAgentVersions(agentId.trim());
}
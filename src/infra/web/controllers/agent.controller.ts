import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AgentRepository } from '../../../app/ports';
import { listAgents, getAgent, getAgentPrompt } from '../../../core/use-cases';
import { GetAgentParamsSchema } from '../../../app/validators/agent-schema';
import { NotFoundError } from '../../../common/errors/app-errors';
import type { ApiResponse } from '../../../common/types';

export class AgentController {
  constructor(private readonly agentRepository: AgentRepository) {}

  async listAgents(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const agents = await listAgents(this.agentRepository);
    
    const response: ApiResponse = {
      data: agents,
      message: 'Agents retrieved successfully',
    };

    reply.code(200).send(response);
  }

  async getAgent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = GetAgentParamsSchema.parse(request.params);
    
    const agent = await getAgent(this.agentRepository, id);
    
    if (!agent) {
      throw new NotFoundError(`Agent with ID ${id} not found`);
    }

    const response: ApiResponse = {
      data: agent,
      message: 'Agent retrieved successfully',
    };

    reply.code(200).send(response);
  }

  async getAgentPrompt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = GetAgentParamsSchema.parse(request.params);
    
    const agentPrompt = await getAgentPrompt(this.agentRepository, id);
    
    if (!agentPrompt) {
      throw new NotFoundError(`Agent prompt for ID ${id} not found`);
    }

    const response: ApiResponse = {
      data: agentPrompt,
      message: 'Agent prompt retrieved successfully',
    };

    reply.code(200).send(response);
  }
}
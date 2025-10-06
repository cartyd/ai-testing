import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AgentRepository } from '../../../app/ports';
import { listAgents, getAgent, getAgentPrompt } from '../../../core/use-cases';
import { GetAgentParamsSchema } from '../../../app/validators/agent-schema';
import { NotFoundError } from '../../../common/errors/app-errors';
import type { ApiResponse } from '../../../common/types';
import { HTTP_STATUS, AGENT_MESSAGES } from '../constants/controller.constants';

export class AgentController {
  constructor(private readonly agentRepository: AgentRepository) {}

  async listAgents(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const agents = await listAgents(this.agentRepository);
    this.sendSuccessResponse(reply, agents, AGENT_MESSAGES.SUCCESS.AGENTS_RETRIEVED);
  }

  async getAgent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = this.parseAgentParams(request);
    const agent = await getAgent(this.agentRepository, id);
    
    this.ensureResourceExists(agent, AGENT_MESSAGES.ERROR.AGENT_NOT_FOUND(id));
    this.sendSuccessResponse(reply, agent, AGENT_MESSAGES.SUCCESS.AGENT_RETRIEVED);
  }

  async getAgentPrompt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = this.parseAgentParams(request);
    const agentPrompt = await getAgentPrompt(this.agentRepository, id);
    
    this.ensureResourceExists(agentPrompt, AGENT_MESSAGES.ERROR.AGENT_PROMPT_NOT_FOUND(id));
    this.sendSuccessResponse(reply, agentPrompt, AGENT_MESSAGES.SUCCESS.AGENT_PROMPT_RETRIEVED);
  }

  /**
   * Parses and validates agent parameters from the request
   */
  private parseAgentParams(request: FastifyRequest): { id: string } {
    return GetAgentParamsSchema.parse(request.params);
  }

  /**
   * Ensures a resource exists, throwing NotFoundError if it doesn't
   */
  private ensureResourceExists<T>(resource: T | null | undefined, errorMessage: string): asserts resource is T {
    if (!resource) {
      throw new NotFoundError(errorMessage);
    }
  }

  /**
   * Sends a successful API response with the provided data and message
   */
  private sendSuccessResponse(reply: FastifyReply, data: unknown, message: string): void {
    const response: ApiResponse = {
      data,
      message,
    };

    reply.code(HTTP_STATUS.OK).send(response);
  }
}

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AgentRepository } from '../../../app/ports';
import { listAgents, getAgent, getAgentPrompt, getAgentVersions } from '../../../core/use-cases';
import { GetAgentParamsSchema } from '../../../app/validators/agent-schema';
import { NotFoundError } from '../../../common/errors/app-errors';
import type { ApiResponse } from '../../../common/types';
import { HTTP_STATUS, AGENT_MESSAGES } from '../constants/controller.constants';
import { ZodError } from 'zod';

// Utility functions
/**
 * Parses and validates agent parameters from the request
 * @throws {ZodError} When validation fails
 */
function parseAgentParams(request: FastifyRequest): { id: string } {
  try {
    return GetAgentParamsSchema.parse(request.params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid agent ID: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Ensures a resource exists, throwing NotFoundError if it doesn't
 */
function ensureResourceExists<T>(resource: T | null | undefined, errorMessage: string): asserts resource is T {
  if (!resource) {
    throw new NotFoundError(errorMessage);
  }
}

/**
 * Sends a successful API response with the provided data and message
 */
function sendSuccessResponse(reply: FastifyReply, data: unknown, message: string, statusCode: number = HTTP_STATUS.OK): void {
  const response: ApiResponse = {
    data,
    message,
  };

  reply.code(statusCode).send(response);
}

/**
 * Determines appropriate HTTP status code based on error type
 */
function getErrorStatusCode(error: unknown): number {
  if (error instanceof NotFoundError) {
    return HTTP_STATUS.NOT_FOUND; // 404
  }
  
  if (error instanceof Error) {
    // Check for validation-related errors
    if (error.message.includes('Invalid agent ID') || 
        error.message.includes('validation') ||
        error.message.includes('required')) {
      return HTTP_STATUS.BAD_REQUEST; // 400
    }
    
    // Check for external service errors
    if (error.message.includes('timeout') || 
        error.message.includes('connection') ||
        error.message.includes('network')) {
      return HTTP_STATUS.BAD_GATEWAY; // 502
    }
    
    // Check for authentication/authorization errors
    if (error.message.includes('unauthorized') || 
        error.message.includes('forbidden') ||
        error.message.includes('authentication')) {
      return HTTP_STATUS.UNAUTHORIZED; // 401
    }
  }
  
  // Default to Internal Server Error
  return HTTP_STATUS.INTERNAL_SERVER_ERROR; // 500
}

/**
 * Handles errors with appropriate HTTP status codes and response format
 */
function handleError(reply: FastifyReply, error: unknown, defaultMessage: string): void {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  const statusCode = getErrorStatusCode(error);
  
  const response: ApiResponse = {
    data: null,
    message: errorMessage,
  };

  reply.code(statusCode).send(response);
}

/**
 * Safely executes an async handler with comprehensive error handling
 */
async function safeAsyncHandler(
  reply: FastifyReply,
  handler: () => Promise<void>,
  defaultErrorMessage: string = 'An unexpected error occurred'
): Promise<void> {
  try {
    await handler();
  } catch (error) {
    handleError(reply, error, defaultErrorMessage);
  }
}

// Handler factory functions
export interface AgentHandlers {
  listAgents: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getAgent: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getAgentPrompt: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getAgentVersions: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

/**
 * Creates agent handlers with comprehensive error handling and validation
 */
export function createAgentHandlers(agentRepository: AgentRepository): AgentHandlers {
  return {
    async listAgents(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await safeAsyncHandler(reply, async () => {
        const agents = await listAgents(agentRepository);
        sendSuccessResponse(reply, agents, AGENT_MESSAGES.SUCCESS.AGENTS_RETRIEVED);
      }, 'Failed to retrieve agents');
    },

    async getAgent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await safeAsyncHandler(reply, async () => {
        const { id } = parseAgentParams(request);
        const agent = await getAgent(agentRepository, id);
        
        ensureResourceExists(agent, AGENT_MESSAGES.ERROR.AGENT_NOT_FOUND(id));
        sendSuccessResponse(reply, agent, AGENT_MESSAGES.SUCCESS.AGENT_RETRIEVED);
      }, 'Failed to retrieve agent');
    },

    async getAgentPrompt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await safeAsyncHandler(reply, async () => {
        const { id } = parseAgentParams(request);
        const agentPrompt = await getAgentPrompt(agentRepository, id);
        
        ensureResourceExists(agentPrompt, AGENT_MESSAGES.ERROR.AGENT_PROMPT_NOT_FOUND(id));
        sendSuccessResponse(reply, agentPrompt, AGENT_MESSAGES.SUCCESS.AGENT_PROMPT_RETRIEVED);
      }, 'Failed to retrieve agent prompt');
    },

    async getAgentVersions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      await safeAsyncHandler(reply, async () => {
        const { id } = parseAgentParams(request);
        const agentVersions = await getAgentVersions(agentRepository, id);
        
        sendSuccessResponse(reply, agentVersions, AGENT_MESSAGES.SUCCESS.AGENT_VERSIONS_RETRIEVED);
      }, 'Failed to retrieve agent versions');
    },
  };
}

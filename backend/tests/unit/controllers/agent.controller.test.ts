import { 
  createAgentHandlers,
  type AgentHandlers
} from '../../../src/infra/web/controllers/agent.controller';
import { HTTP_STATUS, AGENT_MESSAGES } from '../../../src/infra/web/constants/controller.constants';
import { NotFoundError } from '../../../src/common/errors/app-errors';
import type { AgentRepository } from '../../../src/app/ports';
import type { Agent, AgentPrompt } from '../../../src/core/entities';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

// Test constants
const TEST_CONSTANTS = {
  MOCK_AGENT_ID: 'agent-123',
  MOCK_AGENT: {
    id: 'agent-123',
    name: 'Test Agent',
    prompt: 'You are a helpful assistant',
    voiceId: 'voice-456',
    language: 'en-US',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Agent,
  MOCK_AGENT_PROMPT: {
    agentId: 'agent-123',
    prompt: 'You are a helpful assistant',
    version: 1,
    updatedAt: new Date('2023-01-01'),
  } as AgentPrompt,
  ERROR_MESSAGES: {
    VALIDATION: 'Invalid agent ID: Agent ID is required',
    NOT_FOUND: 'Agent with ID agent-123 not found',
    TIMEOUT: 'Request timeout exceeded',
    UNAUTHORIZED: 'unauthorized access to agent',
    CONNECTION: 'Database connection failed',
    NETWORK: 'Network unreachable',
    GENERIC: 'Something unexpected happened',
  },
} as const;

// Mock repository
const mockAgentRepository: jest.Mocked<AgentRepository> = {
  listAgents: jest.fn(),
  getAgent: jest.fn(),
  getAgentPrompt: jest.fn(),
  getAgentVersions: jest.fn(),
};

// Mock Fastify request
const createMockRequest = (params: any = {}): jest.Mocked<FastifyRequest> => ({
  params,
  query: {},
  body: {},
  headers: {},
} as any);

// Mock Fastify reply
const createMockReply = (): jest.Mocked<FastifyReply> => ({
  code: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  header: jest.fn().mockReturnThis(),
} as any);

describe('Agent Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAgentHandlers - Factory Function', () => {
    it('should create handlers with agent repository', () => {
      const handlers = createAgentHandlers(mockAgentRepository);
      
      expect(handlers).toHaveProperty('listAgents');
      expect(handlers).toHaveProperty('getAgent');
      expect(handlers).toHaveProperty('getAgentPrompt');
      expect(typeof handlers.listAgents).toBe('function');
      expect(typeof handlers.getAgent).toBe('function');
      expect(typeof handlers.getAgentPrompt).toBe('function');
    });

    it('should create independent handler instances', () => {
      const handlers1 = createAgentHandlers(mockAgentRepository);
      const handlers2 = createAgentHandlers(mockAgentRepository);
      
      expect(handlers1).not.toBe(handlers2);
      expect(handlers1.listAgents).not.toBe(handlers2.listAgents);
    });
  });

  describe('listAgents handler', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    it('should return agents list successfully', async () => {
      // Arrange
      const mockAgents = [TEST_CONSTANTS.MOCK_AGENT];
      mockAgentRepository.listAgents.mockResolvedValue(mockAgents);

      // Act
      await handlers.listAgents({} as any, mockReply);

      // Assert
      expect(mockAgentRepository.listAgents).toHaveBeenCalledTimes(1);
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: mockAgents,
        message: AGENT_MESSAGES.SUCCESS.AGENTS_RETRIEVED,
      });
    });

    it('should handle empty agents list', async () => {
      // Arrange
      mockAgentRepository.listAgents.mockResolvedValue([]);

      // Act
      await handlers.listAgents({} as any, mockReply);

      // Assert
      expect(mockReply.send).toHaveBeenCalledWith({
        data: [],
        message: AGENT_MESSAGES.SUCCESS.AGENTS_RETRIEVED,
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.TIMEOUT);
      mockAgentRepository.listAgents.mockRejectedValue(error);

      // Act
      await handlers.listAgents({} as any, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_GATEWAY);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: TEST_CONSTANTS.ERROR_MESSAGES.TIMEOUT,
      });
    });
  });

  describe('getAgent handler', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    it('should return agent successfully', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgent.mockResolvedValue(TEST_CONSTANTS.MOCK_AGENT);

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(TEST_CONSTANTS.MOCK_AGENT_ID);
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: TEST_CONSTANTS.MOCK_AGENT,
        message: AGENT_MESSAGES.SUCCESS.AGENT_RETRIEVED,
      });
    });

    it('should handle agent not found', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgent.mockResolvedValue(null);

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: AGENT_MESSAGES.ERROR.AGENT_NOT_FOUND(TEST_CONSTANTS.MOCK_AGENT_ID),
      });
    });

    it('should handle invalid agent ID parameter', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: '' }); // Empty ID

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: expect.stringContaining('Invalid agent ID'),
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      const error = new Error(TEST_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED);
      mockAgentRepository.getAgent.mockRejectedValue(error);

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: TEST_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED,
      });
    });
  });

  describe('getAgentPrompt handler', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    it('should return agent prompt successfully', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgentPrompt.mockResolvedValue(TEST_CONSTANTS.MOCK_AGENT_PROMPT);

      // Act
      await handlers.getAgentPrompt(mockRequest, mockReply);

      // Assert
      expect(mockAgentRepository.getAgentPrompt).toHaveBeenCalledWith(TEST_CONSTANTS.MOCK_AGENT_ID);
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: TEST_CONSTANTS.MOCK_AGENT_PROMPT,
        message: AGENT_MESSAGES.SUCCESS.AGENT_PROMPT_RETRIEVED,
      });
    });

    it('should handle agent prompt not found', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgentPrompt.mockResolvedValue(null);

      // Act
      await handlers.getAgentPrompt(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: AGENT_MESSAGES.ERROR.AGENT_PROMPT_NOT_FOUND(TEST_CONSTANTS.MOCK_AGENT_ID),
      });
    });

    it('should handle invalid agent ID parameter', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: '   ' }); // Whitespace ID

      // Act
      await handlers.getAgentPrompt(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: expect.stringMatching(/Agent ID is required|Invalid agent ID/),
      });
    });
  });

  describe('Error Status Code Logic', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    const errorTestCases = [
      {
        description: 'should return 404 for NotFoundError',
        error: new NotFoundError(TEST_CONSTANTS.ERROR_MESSAGES.NOT_FOUND),
        expectedStatus: HTTP_STATUS.NOT_FOUND,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.NOT_FOUND,
      },
      {
        description: 'should return 400 for validation errors',
        error: new Error(TEST_CONSTANTS.ERROR_MESSAGES.VALIDATION),
        expectedStatus: HTTP_STATUS.BAD_REQUEST,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.VALIDATION,
      },
      {
        description: 'should return 400 for required field errors',
        error: new Error('Agent name is required'),
        expectedStatus: HTTP_STATUS.BAD_REQUEST,
        expectedMessage: 'Agent name is required',
      },
      {
        description: 'should return 502 for timeout errors',
        error: new Error(TEST_CONSTANTS.ERROR_MESSAGES.TIMEOUT),
        expectedStatus: HTTP_STATUS.BAD_GATEWAY,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.TIMEOUT,
      },
      {
        description: 'should return 502 for connection errors',
        error: new Error(TEST_CONSTANTS.ERROR_MESSAGES.CONNECTION),
        expectedStatus: HTTP_STATUS.BAD_GATEWAY,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.CONNECTION,
      },
      {
        description: 'should return 500 for network errors (not matching pattern)',
        error: new Error(TEST_CONSTANTS.ERROR_MESSAGES.NETWORK),
        expectedStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.NETWORK,
      },
      {
        description: 'should return 401 for unauthorized errors',
        error: new Error(TEST_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED),
        expectedStatus: HTTP_STATUS.UNAUTHORIZED,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED,
      },
      {
        description: 'should return 401 for forbidden errors',
        error: new Error('Access forbidden to this agent'),
        expectedStatus: HTTP_STATUS.UNAUTHORIZED,
        expectedMessage: 'Access forbidden to this agent',
      },
      {
        description: 'should return 401 for authentication errors',
        error: new Error('authentication failed for agent access'),
        expectedStatus: HTTP_STATUS.UNAUTHORIZED,
        expectedMessage: 'authentication failed for agent access',
      },
      {
        description: 'should return 500 for generic errors',
        error: new Error(TEST_CONSTANTS.ERROR_MESSAGES.GENERIC),
        expectedStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        expectedMessage: TEST_CONSTANTS.ERROR_MESSAGES.GENERIC,
      },
      {
        description: 'should return 500 for errors without message',
        error: new Error(''),
        expectedStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        expectedMessage: '',
      },
    ];

    test.each(errorTestCases)('$description', async ({ error, expectedStatus, expectedMessage }) => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgent.mockRejectedValue(error);

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(expectedStatus);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: expectedMessage,
      });
    });

    it('should handle non-Error objects', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgent.mockRejectedValue('String error');

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: 'Failed to retrieve agent',
      });
    });
  });

  describe('Parameter Parsing Logic', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    const parameterTestCases = [
      {
        description: 'should handle valid agent ID',
        params: { id: 'valid-agent-123' },
        shouldCallRepository: true,
      },
      {
        description: 'should reject empty string ID',
        params: { id: '' },
        shouldCallRepository: false,
      },
      {
        description: 'should reject whitespace-only ID',
        params: { id: '   ' },
        shouldCallRepository: false,
      },
      {
        description: 'should reject tab-only ID',
        params: { id: '\t\t\t' },
        shouldCallRepository: false,
      },
      {
        description: 'should reject newline-only ID',
        params: { id: '\n\n\n' },
        shouldCallRepository: false,
      },
      {
        description: 'should handle missing ID parameter',
        params: {},
        shouldCallRepository: false,
      },
      {
        description: 'should handle null ID parameter',
        params: { id: null },
        shouldCallRepository: false,
      },
      {
        description: 'should handle undefined ID parameter',
        params: { id: undefined },
        shouldCallRepository: false,
      },
    ];

    test.each(parameterTestCases)('$description', async ({ params, shouldCallRepository }) => {
      // Arrange
      const mockRequest = createMockRequest(params);
      if (shouldCallRepository) {
        mockAgentRepository.getAgent.mockResolvedValue(TEST_CONSTANTS.MOCK_AGENT);
      }

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      if (shouldCallRepository) {
        expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(params.id);
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      } else {
        expect(mockAgentRepository.getAgent).not.toHaveBeenCalled();
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
        expect(mockReply.send).toHaveBeenCalledWith({
          data: null,
          message: expect.stringMatching(/Agent ID is required|Invalid agent ID/),
        });
      }
    });

    it('should handle special characters in valid IDs', async () => {
      // Arrange
      const specialIds = [
        'agent-with-dashes',
        'agent_with_underscores',
        'agent.with.dots',
        'agent123numbers',
        'AGENT-UPPERCASE',
        'agent-émojis-🤖',
        'agent-unicode-测试',
      ];

      for (const id of specialIds) {
        jest.clearAllMocks();
        const mockRequest = createMockRequest({ id });
        mockAgentRepository.getAgent.mockResolvedValue(TEST_CONSTANTS.MOCK_AGENT);

        // Act
        await handlers.getAgent(mockRequest, mockReply);

        // Assert
        expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(id);
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      }
    });
  });

  describe('Resource Existence Validation', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    const resourceTestCases = [
      {
        description: 'should handle null agent response',
        repositoryResponse: null,
        expectedStatus: HTTP_STATUS.NOT_FOUND,
        handler: 'getAgent' as const,
      },
      {
        description: 'should handle undefined agent response',
        repositoryResponse: undefined,
        expectedStatus: HTTP_STATUS.NOT_FOUND,
        handler: 'getAgent' as const,
      },
      {
        description: 'should handle null agent prompt response',
        repositoryResponse: null,
        expectedStatus: HTTP_STATUS.NOT_FOUND,
        handler: 'getAgentPrompt' as const,
      },
      {
        description: 'should handle undefined agent prompt response',
        repositoryResponse: undefined,
        expectedStatus: HTTP_STATUS.NOT_FOUND,
        handler: 'getAgentPrompt' as const,
      },
    ];

    test.each(resourceTestCases)('$description', async ({ repositoryResponse, expectedStatus, handler }) => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      
      if (handler === 'getAgent') {
        mockAgentRepository.getAgent.mockResolvedValue(repositoryResponse as any);
      } else {
        mockAgentRepository.getAgentPrompt.mockResolvedValue(repositoryResponse as any);
      }

      // Act
      await handlers[handler](mockRequest, mockReply);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(expectedStatus);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: expect.stringContaining('not found'),
      });
    });

    it('should handle falsy values correctly', async () => {
      // Test various falsy values - ensureResourceExists treats ALL falsy values as missing
      const falsyValues = [false, 0, '', NaN];
      
      for (const falsyValue of falsyValues) {
        jest.clearAllMocks();
        const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
        mockAgentRepository.getAgent.mockResolvedValue(falsyValue as any);

        // Act
        await handlers.getAgent(mockRequest, mockReply);

        // Assert - ALL falsy values are treated as missing resources
        expect(mockReply.code).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
        expect(mockReply.send).toHaveBeenCalledWith({
          data: null,
          message: expect.stringContaining('not found'),
        });
      }
    });
  });

  describe('Response Formatting', () => {
    let handlers: AgentHandlers;
    let mockReply: jest.Mocked<FastifyReply>;

    beforeEach(() => {
      handlers = createAgentHandlers(mockAgentRepository);
      mockReply = createMockReply();
    });

    it('should format success responses consistently', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgent.mockResolvedValue(TEST_CONSTANTS.MOCK_AGENT);

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.send).toHaveBeenCalledWith({
        data: TEST_CONSTANTS.MOCK_AGENT,
        message: AGENT_MESSAGES.SUCCESS.AGENT_RETRIEVED,
      });
    });

    it('should format error responses consistently', async () => {
      // Arrange
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      const error = new Error('Test error');
      mockAgentRepository.getAgent.mockRejectedValue(error);

      // Act
      await handlers.getAgent(mockRequest, mockReply);

      // Assert
      expect(mockReply.send).toHaveBeenCalledWith({
        data: null,
        message: 'Test error',
      });
    });

    it('should use appropriate success messages for different operations', async () => {
      // Test listAgents
      mockAgentRepository.listAgents.mockResolvedValue([TEST_CONSTANTS.MOCK_AGENT]);
      await handlers.listAgents({} as any, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: [TEST_CONSTANTS.MOCK_AGENT],
        message: AGENT_MESSAGES.SUCCESS.AGENTS_RETRIEVED,
      });

      // Reset and test getAgentPrompt
      jest.clearAllMocks();
      const mockRequest = createMockRequest({ id: TEST_CONSTANTS.MOCK_AGENT_ID });
      mockAgentRepository.getAgentPrompt.mockResolvedValue(TEST_CONSTANTS.MOCK_AGENT_PROMPT);
      await handlers.getAgentPrompt(mockRequest, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith({
        data: TEST_CONSTANTS.MOCK_AGENT_PROMPT,
        message: AGENT_MESSAGES.SUCCESS.AGENT_PROMPT_RETRIEVED,
      });
    });
  });
});
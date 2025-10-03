import { getAgent } from '../../../src/core/use-cases/get-agent.usecase';
import type { AgentRepository } from '../../../src/app/ports/agent-repository.port';
import type { Agent } from '../../../src/core/entities/agent';

// Test constants
const TEST_CONSTANTS = {
  VALID_AGENT_ID: 'agent-123',
  NON_EXISTENT_ID: 'non-existent-agent',
  UNICODE_ID: 'agent-测试-🤖',
  LONG_ID: 'agent-' + 'a'.repeat(1000),
  SQL_INJECTION_ID: "'; DROP TABLE agents; --",
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  EXTREME_TEMPERATURE: 0.0001,
  MAX_TOKENS_EXTREME: Number.MAX_SAFE_INTEGER,
} as const;

const TEST_DATES = {
  DEFAULT: '2023-01-01',
  CREATED_DATE: '2023-01-01T10:00:00Z',
  UPDATED_DATE: '2023-01-02T15:30:00Z',
  UNIX_EPOCH: '1970-01-01T00:00:00.000Z',
  FAR_FUTURE: '9999-12-31T23:59:59.999Z',
} as const;

const ERROR_MESSAGES = {
  AGENT_ID_REQUIRED: 'Agent ID is required',
  DATABASE_CONNECTION: 'Database connection failed',
  NETWORK_TIMEOUT: 'Network timeout',
  UNAUTHORIZED: 'Unauthorized access',
  REPOSITORY_ERROR: 'Repository error',
} as const;

// Mock repository
const mockAgentRepository: jest.Mocked<AgentRepository> = {
  listAgents: jest.fn(), // Not used in getAgent tests but required by interface
  getAgent: jest.fn(),
  getAgentPrompt: jest.fn(), // Not used in getAgent tests but required by interface
};

// Test data factory
const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: TEST_CONSTANTS.VALID_AGENT_ID,
  name: 'Test Agent',
  prompt: 'You are a helpful assistant',
  voiceId: 'voice-456',
  language: 'en-US',
  model: 'gpt-4',
  temperature: TEST_CONSTANTS.DEFAULT_TEMPERATURE,
  maxTokens: TEST_CONSTANTS.DEFAULT_MAX_TOKENS,
  createdAt: new Date(TEST_DATES.DEFAULT),
  updatedAt: new Date(TEST_DATES.DEFAULT),
  ...overrides,
});

// Reusable test data generators
const TEST_DATA = {
  standardAgent: () => createMockAgent(),
  minimalAgent: () => createMockAgent({
    voiceId: undefined,
    language: undefined,
    model: undefined,
    temperature: undefined,
    maxTokens: undefined,
  }),
  fullFeaturedAgent: () => createMockAgent({
    id: 'agent-full-featured',
    name: 'Full Feature Agent',
    prompt: 'Comprehensive system prompt with detailed instructions',
    voiceId: 'voice-premium-123',
    language: 'en-US',
    model: 'gpt-4-turbo',
    temperature: TEST_CONSTANTS.DEFAULT_TEMPERATURE,
    maxTokens: 2000,
    createdAt: new Date(TEST_DATES.CREATED_DATE),
    updatedAt: new Date(TEST_DATES.UPDATED_DATE),
  }),
  agentWithExtremeValues: () => createMockAgent({
    id: 'agent-extreme',
    name: 'Extreme Values Agent',
    temperature: TEST_CONSTANTS.EXTREME_TEMPERATURE,
    maxTokens: TEST_CONSTANTS.MAX_TOKENS_EXTREME,
  }),
  agentWithSpecialCharacters: () => createMockAgent({
    id: TEST_CONSTANTS.UNICODE_ID,
    name: 'Agent with 特殊字符 & émojis 🤖',
    prompt: 'Handle special characters: éñ中文日本語',
  }),
  agentWithBoundaryDates: () => createMockAgent({
    id: 'agent-dates',
    name: 'Date Boundary Agent',
    createdAt: new Date(TEST_DATES.UNIX_EPOCH),
    updatedAt: new Date(TEST_DATES.FAR_FUTURE),
  }),
} as const;

describe('getAgent use case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid cases', () => {
    test.each([
      {
        description: 'should return standard agent when found',
        agentId: TEST_CONSTANTS.VALID_AGENT_ID,
        testDataKey: 'standardAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return minimal agent with only required fields',
        agentId: 'agent-minimal',
        testDataKey: 'minimalAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return full featured agent with all fields populated',
        agentId: 'agent-full-featured',
        testDataKey: 'fullFeaturedAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return agent with extreme numeric values',
        agentId: 'agent-extreme',
        testDataKey: 'agentWithExtremeValues' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return agent with special characters in ID and content',
        agentId: TEST_CONSTANTS.UNICODE_ID,
        testDataKey: 'agentWithSpecialCharacters' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return agent with boundary date values',
        agentId: 'agent-dates',
        testDataKey: 'agentWithBoundaryDates' as keyof typeof TEST_DATA,
      },
    ])('$description', async ({ agentId, testDataKey }) => {
      // Arrange
      const expectedAgent = TEST_DATA[testDataKey]();
      mockAgentRepository.getAgent.mockResolvedValue(expectedAgent);

      // Act
      const result = await getAgent(mockAgentRepository, agentId);

      // Assert
      expect(result).toEqual(expectedAgent);
      expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepository.getAgent).toHaveBeenCalledTimes(1);
    });

    test.each([
      {
        description: 'should return null when agent not found with standard ID',
        agentId: TEST_CONSTANTS.NON_EXISTENT_ID,
      },
      {
        description: 'should return null when agent not found with UUID format',
        agentId: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        description: 'should return null when agent not found with special characters',
        agentId: 'agent-with-émojis-📁',
      },
    ])('$description', async ({ agentId }) => {
      // Arrange
      mockAgentRepository.getAgent.mockResolvedValue(null);

      // Act
      const result = await getAgent(mockAgentRepository, agentId);

      // Assert
      expect(result).toBeNull();
      expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepository.getAgent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invalid input validation', () => {
    test.each([
      {
        description: 'should throw error when ID is empty string',
        agentId: '',
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID is whitespace only',
        agentId: '   ',
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID contains only tabs',
        agentId: '\t\t\t',
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID contains only newlines',
        agentId: '\n\n\n',
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID is undefined',
        agentId: undefined,
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID is null',
        agentId: null,
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
    ])('$description', async ({ agentId, expectedError }) => {
      // Act & Assert
      await expect(getAgent(mockAgentRepository, agentId as any)).rejects.toThrow(expectedError);
      expect(mockAgentRepository.getAgent).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    test.each([
      {
        description: 'should handle very long agent ID',
        agentId: TEST_CONSTANTS.LONG_ID,
        testDataKey: 'standardAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with SQL injection patterns',
        agentId: TEST_CONSTANTS.SQL_INJECTION_ID,
        testDataKey: 'standardAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with Unicode characters',
        agentId: TEST_CONSTANTS.UNICODE_ID,
        testDataKey: 'agentWithSpecialCharacters' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with emojis',
        agentId: 'agent-🚀-🤖-📊',
        testDataKey: 'standardAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with mixed language characters',
        agentId: 'agent-English-中文-日本語-한국어',
        testDataKey: 'standardAgent' as keyof typeof TEST_DATA,
      },
    ])('$description', async ({ agentId, testDataKey }) => {
      // Arrange
      const expectedAgent = TEST_DATA[testDataKey]();
      mockAgentRepository.getAgent.mockResolvedValue(expectedAgent);

      // Act
      const result = await getAgent(mockAgentRepository, agentId);

      // Assert
      expect(result).toEqual(expectedAgent);
      expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepository.getAgent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    test.each([
      {
        description: 'should propagate database connection error',
        error: new Error(ERROR_MESSAGES.DATABASE_CONNECTION),
        expectedMessage: ERROR_MESSAGES.DATABASE_CONNECTION,
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate network timeout error',
        error: new Error(ERROR_MESSAGES.NETWORK_TIMEOUT),
        expectedMessage: ERROR_MESSAGES.NETWORK_TIMEOUT,
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate authentication error',
        error: new Error(ERROR_MESSAGES.UNAUTHORIZED),
        expectedMessage: ERROR_MESSAGES.UNAUTHORIZED,
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate generic repository error',
        error: new Error(ERROR_MESSAGES.REPOSITORY_ERROR),
        expectedMessage: ERROR_MESSAGES.REPOSITORY_ERROR,
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should handle error with no message',
        error: new Error(),
        expectedMessage: '',
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should handle repository throwing non-Error objects',
        error: 'String error message',
        expectedMessage: 'String error message',
        assertionType: 'toBe' as const,
      },
      {
        description: 'should handle repository throwing null',
        error: null,
        expectedMessage: null,
        assertionType: 'toBe' as const,
      },
      {
        description: 'should handle repository throwing undefined',
        error: undefined,
        expectedMessage: undefined,
        assertionType: 'toBe' as const,
      },
      {
        description: 'should handle repository throwing number',
        error: 500,
        expectedMessage: 500,
        assertionType: 'toBe' as const,
      },
    ])('$description', async ({ error, expectedMessage, assertionType }) => {
      // Arrange
      const testAgentId = TEST_CONSTANTS.VALID_AGENT_ID;
      mockAgentRepository.getAgent.mockRejectedValue(error);

      // Act & Assert
      const promise = getAgent(mockAgentRepository, testAgentId);
      if (assertionType === 'toThrow') {
        await expect(promise).rejects.toThrow(expectedMessage as string);
      } else {
        await expect(promise).rejects.toBe(expectedMessage);
      }
      expect(mockAgentRepository.getAgent).toHaveBeenCalledWith(testAgentId);
      expect(mockAgentRepository.getAgent).toHaveBeenCalledTimes(1);
    });
  });
});
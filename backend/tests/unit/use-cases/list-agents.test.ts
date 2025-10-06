import { listAgents } from '../../../src/core/use-cases/list-agents.usecase';
import type { AgentRepository } from '../../../src/app/ports/agent-repository.port';
import type { Agent } from '../../../src/core/entities/agent';

// Test constants
const TEST_CONSTANTS = {
  LARGE_PROMPT_SIZE: 10000,
  LARGE_AGENT_COUNT: 1000,
  EXTREME_TEMPERATURE: 0.0001,
  MAX_TOKENS_EXTREME: Number.MAX_SAFE_INTEGER,
} as const;

const TEST_DATES = {
  DEFAULT: '2023-01-01',
  UNIX_EPOCH: '1970-01-01T00:00:00.000Z',
  FAR_FUTURE: '9999-12-31T23:59:59.999Z',
  FULL_FEATURE_CREATED: '2023-01-01T10:00:00Z',
  FULL_FEATURE_UPDATED: '2023-01-02T15:30:00Z',
} as const;

// Mock repository
const mockAgentRepository: jest.Mocked<AgentRepository> = {
  listAgents: jest.fn(),
  getAgent: jest.fn(), // Not used in listAgents tests but required by interface
  getAgentPrompt: jest.fn(), // Not used in listAgents tests but required by interface
};

// Test data factory
const createAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'agent-1',
  name: 'Test Agent',
  prompt: 'You are a helpful assistant',
  createdAt: new Date(TEST_DATES.DEFAULT),
  updatedAt: new Date(TEST_DATES.DEFAULT),
  ...overrides,
});

// Reusable test data generators
const TEST_DATA = {
  singleMinimalAgent: () => [createAgent()],
  singleFullFeaturedAgent: () => [
    createAgent({
      id: 'agent-full',
      name: 'Full Feature Agent',
      prompt: 'Comprehensive system prompt',
      voiceId: 'voice-123',
      language: 'en-US',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      createdAt: new Date(TEST_DATES.FULL_FEATURE_CREATED),
      updatedAt: new Date(TEST_DATES.FULL_FEATURE_UPDATED),
    }),
  ],
  multipleAgentsWithDifferentConfigs: () => [
    createAgent({
      id: 'agent-1',
      name: 'Customer Service Agent',
      prompt: 'You help customers',
      language: 'en-US',
    }),
    createAgent({
      id: 'agent-2',
      name: 'Sales Agent',
      prompt: 'You help with sales',
      voiceId: 'voice-sales',
      model: 'gpt-3.5',
      temperature: 0.5,
    }),
    createAgent({
      id: 'agent-3',
      name: 'Support Agent',
      prompt: 'You provide technical support',
      language: 'es-ES',
      maxTokens: 2000,
    }),
  ],
  agentsWithSpecialCharacters: () => [
    createAgent({
      id: 'agent-special',
      name: 'Agent with émojis 🤖 & sp€cial chârs',
      prompt: 'Handle special characters: éñ中文',
    }),
  ],
  agentsWithLongPrompts: () => [
    createAgent({
      id: 'agent-long',
      name: 'Long Prompt Agent',
      prompt: 'A'.repeat(TEST_CONSTANTS.LARGE_PROMPT_SIZE),
    }),
  ],
  largeNumberOfAgents: () =>
    Array.from({ length: TEST_CONSTANTS.LARGE_AGENT_COUNT }, (_, i) =>
      createAgent({
        id: `agent-${i}`,
        name: `Agent ${i}`,
        prompt: `System prompt for agent ${i}`,
      })
    ),
  agentsWithExtremeNumericValues: () => [
    createAgent({
      id: 'agent-extreme',
      name: 'Extreme Values Agent',
      temperature: TEST_CONSTANTS.EXTREME_TEMPERATURE,
      maxTokens: TEST_CONSTANTS.MAX_TOKENS_EXTREME,
    }),
  ],
  agentsWithBoundaryDates: () => [
    createAgent({
      id: 'agent-dates',
      name: 'Date Boundary Agent',
      createdAt: new Date(TEST_DATES.UNIX_EPOCH),
      updatedAt: new Date(TEST_DATES.FAR_FUTURE),
    }),
  ],
  emptyArray: () => [],
} as const;

describe('listAgents use case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid cases', () => {
    test.each([
      {
        description: 'should return single agent with minimal required fields',
        testDataKey: 'singleMinimalAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return single agent with all fields populated',
        testDataKey: 'singleFullFeaturedAgent' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return multiple agents with different configurations',
        testDataKey: 'multipleAgentsWithDifferentConfigs' as keyof typeof TEST_DATA,
      },
      {
        description: 'should return empty array when no agents exist',
        testDataKey: 'emptyArray' as keyof typeof TEST_DATA,
      },
    ])('$description', async ({ testDataKey }) => {
      // Arrange
      const testData = TEST_DATA[testDataKey]();
      mockAgentRepository.listAgents.mockResolvedValue(testData);

      // Act
      const result = await listAgents(mockAgentRepository);

      // Assert
      expect(result).toEqual(testData);
      expect(mockAgentRepository.listAgents).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    test.each([
      {
        description: 'should handle agents with special characters in names',
        testDataKey: 'agentsWithSpecialCharacters' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agents with very long prompts',
        testDataKey: 'agentsWithLongPrompts' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle large number of agents',
        testDataKey: 'largeNumberOfAgents' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agents with extreme numeric values',
        testDataKey: 'agentsWithExtremeNumericValues' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agents with boundary date values',
        testDataKey: 'agentsWithBoundaryDates' as keyof typeof TEST_DATA,
      },
    ])('$description', async ({ testDataKey }) => {
      // Arrange
      const testData = TEST_DATA[testDataKey]();
      mockAgentRepository.listAgents.mockResolvedValue(testData);

      // Act
      const result = await listAgents(mockAgentRepository);

      // Assert
      expect(result).toEqual(testData);
      expect(mockAgentRepository.listAgents).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    test.each([
      {
        description: 'should propagate generic repository error',
        error: new Error('Generic repository error'),
        expectedMessage: 'Generic repository error',
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate network timeout error',
        error: new Error('Network timeout'),
        expectedMessage: 'Network timeout',
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate database connection error',
        error: new Error('Database connection failed'),
        expectedMessage: 'Database connection failed',
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate authentication error',
        error: new Error('Unauthorized access'),
        expectedMessage: 'Unauthorized access',
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
        error: 'String error',
        expectedMessage: 'String error',
        assertionType: 'toBe' as const,
      },
      {
        description: 'should handle repository throwing null',
        error: null,
        expectedMessage: null,
        assertionType: 'toBe' as const,
      },
    ])('$description', async ({ error, expectedMessage, assertionType }) => {
      // Arrange
      mockAgentRepository.listAgents.mockRejectedValue(error);

      // Act & Assert
      const promise = listAgents(mockAgentRepository);
      if (assertionType === 'toThrow') {
        await expect(promise).rejects.toThrow(expectedMessage as string);
      } else {
        await expect(promise).rejects.toBe(expectedMessage);
      }
      expect(mockAgentRepository.listAgents).toHaveBeenCalledTimes(1);
    });
  });
});

import { getAgentVersions } from '../../../src/core/use-cases/get-agent-versions.usecase';
import type { AgentRepository } from '../../../src/app/ports/agent-repository.port';
import type { AgentVersion } from '../../../src/core/entities/agent';

// Test constants
const TEST_CONSTANTS = {
  VALID_AGENT_ID: 'agent-123',
  NON_EXISTENT_ID: 'non-existent-agent',
  UNICODE_ID: 'agent-测试-🤖',
  LONG_ID: 'agent-' + 'a'.repeat(1000),
  SQL_INJECTION_ID: "'; DROP TABLE agents; --",
  EMPTY_STRING: '',
  WHITESPACE_ONLY: '   ',
  TAB_ONLY: '\t\t\t',
  NEWLINE_ONLY: '\n\n\n',
} as const;

const ERROR_MESSAGES = {
  AGENT_ID_REQUIRED: 'Agent ID is required',
  DATABASE_CONNECTION: 'Database connection failed',
  NETWORK_TIMEOUT: 'Network timeout',
  UNAUTHORIZED: 'Unauthorized access',
  REPOSITORY_ERROR: 'Repository error',
  API_RATE_LIMIT: 'API rate limit exceeded',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// Mock repository
const mockAgentRepository: jest.Mocked<AgentRepository> = {
  listAgents: jest.fn(),
  getAgent: jest.fn(),
  getAgentPrompt: jest.fn(),
  getAgentVersions: jest.fn(),
};

// Test data factory
const createMockAgentVersion = (overrides: Partial<AgentVersion> = {}): AgentVersion => ({
  agentId: TEST_CONSTANTS.VALID_AGENT_ID,
  version: 0,
  isPublished: false,
  agentName: 'Test Agent',
  voiceId: '11labs-Adrian',
  voiceModel: 'eleven_turbo_v2',
  fallbackVoiceIds: ['openai-Alloy', 'deepgram-Angus'],
  voiceTemperature: 1,
  voiceSpeed: 1,
  volume: 1,
  responsiveness: 1,
  interruptionSensitivity: 1,
  enableBackchannel: true,
  backchannelFrequency: 0.9,
  backchannelWords: ['yeah', 'uh-huh'],
  reminderTriggerMs: 10000,
  reminderMaxCount: 2,
  ambientSound: 'coffee-shop',
  ambientSoundVolume: 1,
  language: 'en-US',
  webhookUrl: 'https://webhook-url-here',
  webhookTimeoutMs: 10000,
  boostedKeywords: ['retell', 'kroger'],
  dataStorageSetting: 'everything',
  optInSignedUrl: true,
  pronunciationDictionary: [
    {
      word: 'actually',
      alphabet: 'ipa',
      phoneme: 'ˈæktʃuəli',
    },
  ],
  normalizeForSpeech: true,
  endCallAfterSilenceMs: 600000,
  maxCallDurationMs: 3600000,
  voicemailOption: {
    action: {
      type: 'static_text',
      text: 'Please give us a callback tomorrow at 10am.',
    },
  },
  postCallAnalysisData: [
    {
      type: 'string',
      name: 'customer_name',
      description: 'The name of the customer.',
      examples: ['John Doe', 'Jane Smith'],
    },
  ],
  postCallAnalysisModel: 'gpt-4o-mini',
  beginMessageDelayMs: 1000,
  ringDurationMs: 30000,
  sttMode: 'fast',
  vocabSpecialization: 'general',
  allowUserDtmf: true,
  userDtmfOptions: {
    digitLimit: 25,
    terminationKey: '#',
    timeoutMs: 8000,
  },
  denoisingMode: 'noise-cancellation',
  piiConfig: {
    mode: 'post_call',
    categories: [],
  },
  responseEngine: {
    type: 'retell-llm',
    llmId: 'llm_234sdertfsdsfsdf',
    version: 0,
  },
  lastModificationTimestamp: 1703413636133,
  ...overrides,
});

// Reusable test data generators
const TEST_DATA = {
  singleVersion: () => [createMockAgentVersion()],
  multipleVersions: () => [
    createMockAgentVersion({ version: 0, isPublished: false }),
    createMockAgentVersion({ version: 1, isPublished: true }),
    createMockAgentVersion({ version: 2, isPublished: false }),
  ],
  publishedVersion: () => [
    createMockAgentVersion({ version: 1, isPublished: true }),
  ],
  unpublishedVersion: () => [
    createMockAgentVersion({ version: 0, isPublished: false }),
  ],
  emptyVersions: () => [],
  versionWithMinimalData: () => [
    createMockAgentVersion({
      agentName: null,
      voiceModel: null,
      fallbackVoiceIds: null,
      voiceTemperature: undefined,
      voiceSpeed: undefined,
      volume: undefined,
      responsiveness: undefined,
      interruptionSensitivity: undefined,
      enableBackchannel: undefined,
      backchannelFrequency: undefined,
      backchannelWords: undefined,
      reminderTriggerMs: undefined,
      reminderMaxCount: undefined,
      ambientSound: undefined,
      ambientSoundVolume: undefined,
      language: undefined,
      webhookUrl: undefined,
      webhookTimeoutMs: undefined,
      boostedKeywords: undefined,
      dataStorageSetting: undefined,
      optInSignedUrl: undefined,
      pronunciationDictionary: undefined,
      normalizeForSpeech: undefined,
      endCallAfterSilenceMs: undefined,
      maxCallDurationMs: undefined,
      voicemailOption: undefined,
      postCallAnalysisData: undefined,
      postCallAnalysisModel: undefined,
      beginMessageDelayMs: undefined,
      ringDurationMs: undefined,
      sttMode: undefined,
      vocabSpecialization: undefined,
      allowUserDtmf: undefined,
      userDtmfOptions: undefined,
      denoisingMode: undefined,
      piiConfig: undefined,
      responseEngine: undefined,
    }),
  ],
  versionWithSpecialCharacters: () => [
    createMockAgentVersion({
      agentId: TEST_CONSTANTS.UNICODE_ID,
      agentName: 'Agent with 特殊字符 & émojis 🤖',
    }),
  ],
} as const;

describe('getAgentVersions use case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid cases', () => {
    test.each([
      {
        description: 'should return single agent version when found',
        agentId: TEST_CONSTANTS.VALID_AGENT_ID,
        testDataKey: 'singleVersion' as keyof typeof TEST_DATA,
        expectedLength: 1,
      },
      {
        description: 'should return multiple agent versions when found',
        agentId: TEST_CONSTANTS.VALID_AGENT_ID,
        testDataKey: 'multipleVersions' as keyof typeof TEST_DATA,
        expectedLength: 3,
      },
      {
        description: 'should return empty array when no versions exist',
        agentId: TEST_CONSTANTS.NON_EXISTENT_ID,
        testDataKey: 'emptyVersions' as keyof typeof TEST_DATA,
        expectedLength: 0,
      },
      {
        description: 'should return published version',
        agentId: 'agent-published',
        testDataKey: 'publishedVersion' as keyof typeof TEST_DATA,
        expectedLength: 1,
      },
      {
        description: 'should return unpublished version',
        agentId: 'agent-unpublished',
        testDataKey: 'unpublishedVersion' as keyof typeof TEST_DATA,
        expectedLength: 1,
      },
      {
        description: 'should return version with minimal data',
        agentId: 'agent-minimal',
        testDataKey: 'versionWithMinimalData' as keyof typeof TEST_DATA,
        expectedLength: 1,
      },
      {
        description: 'should return version with special characters',
        agentId: TEST_CONSTANTS.UNICODE_ID,
        testDataKey: 'versionWithSpecialCharacters' as keyof typeof TEST_DATA,
        expectedLength: 1,
      },
    ])('$description', async ({ agentId, testDataKey, expectedLength }) => {
      // Arrange
      const expectedVersions = TEST_DATA[testDataKey]();
      mockAgentRepository.getAgentVersions.mockResolvedValue(expectedVersions);

      // Act
      const result = await getAgentVersions(mockAgentRepository, agentId);

      // Assert
      expect(result).toEqual(expectedVersions);
      expect(result).toHaveLength(expectedLength);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledTimes(1);
    });

    test('should trim whitespace from agent ID', async () => {
      // Arrange
      const agentIdWithWhitespace = `  ${TEST_CONSTANTS.VALID_AGENT_ID}  `;
      const expectedVersions = TEST_DATA.singleVersion();
      mockAgentRepository.getAgentVersions.mockResolvedValue(expectedVersions);

      // Act
      const result = await getAgentVersions(mockAgentRepository, agentIdWithWhitespace);

      // Assert
      expect(result).toEqual(expectedVersions);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_AGENT_ID);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invalid input validation', () => {
    test.each([
      {
        description: 'should throw error when ID is empty string',
        agentId: TEST_CONSTANTS.EMPTY_STRING,
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID is whitespace only',
        agentId: TEST_CONSTANTS.WHITESPACE_ONLY,
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID contains only tabs',
        agentId: TEST_CONSTANTS.TAB_ONLY,
        expectedError: ERROR_MESSAGES.AGENT_ID_REQUIRED,
      },
      {
        description: 'should throw error when ID contains only newlines',
        agentId: TEST_CONSTANTS.NEWLINE_ONLY,
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
      await expect(getAgentVersions(mockAgentRepository, agentId as any)).rejects.toThrow(expectedError);
      expect(mockAgentRepository.getAgentVersions).not.toHaveBeenCalled();
    });

    test('should throw error when agent ID is not a string', async () => {
      // Arrange
      const invalidIds = [123, true, {}, [], () => {}];

      for (const invalidId of invalidIds) {
        // Act & Assert
        await expect(getAgentVersions(mockAgentRepository, invalidId as any))
          .rejects.toThrow(ERROR_MESSAGES.AGENT_ID_REQUIRED);
        expect(mockAgentRepository.getAgentVersions).not.toHaveBeenCalled();
      }
    });
  });

  describe('Edge cases', () => {
    test.each([
      {
        description: 'should handle very long agent ID',
        agentId: TEST_CONSTANTS.LONG_ID,
        testDataKey: 'singleVersion' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with SQL injection patterns',
        agentId: TEST_CONSTANTS.SQL_INJECTION_ID,
        testDataKey: 'singleVersion' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with Unicode characters',
        agentId: TEST_CONSTANTS.UNICODE_ID,
        testDataKey: 'versionWithSpecialCharacters' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with emojis',
        agentId: 'agent-🚀-🤖-📊',
        testDataKey: 'singleVersion' as keyof typeof TEST_DATA,
      },
      {
        description: 'should handle agent ID with mixed language characters',
        agentId: 'agent-English-中文-日本語-한국어',
        testDataKey: 'singleVersion' as keyof typeof TEST_DATA,
      },
    ])('$description', async ({ agentId, testDataKey }) => {
      // Arrange
      const expectedVersions = TEST_DATA[testDataKey]();
      mockAgentRepository.getAgentVersions.mockResolvedValue(expectedVersions);

      // Act
      const result = await getAgentVersions(mockAgentRepository, agentId);

      // Assert
      expect(result).toEqual(expectedVersions);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledWith(agentId);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledTimes(1);
    });

    test('should handle repository returning very large number of versions', async () => {
      // Arrange
      const largeVersionArray = Array.from({ length: 1000 }, (_, index) =>
        createMockAgentVersion({ version: index, isPublished: index % 2 === 0 })
      );
      mockAgentRepository.getAgentVersions.mockResolvedValue(largeVersionArray);

      // Act
      const result = await getAgentVersions(mockAgentRepository, TEST_CONSTANTS.VALID_AGENT_ID);

      // Assert
      expect(result).toHaveLength(1000);
      expect(result[0].version).toBe(0);
      expect(result[999].version).toBe(999);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_AGENT_ID);
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
        description: 'should propagate API rate limit error',
        error: new Error(ERROR_MESSAGES.API_RATE_LIMIT),
        expectedMessage: ERROR_MESSAGES.API_RATE_LIMIT,
        assertionType: 'toThrow' as const,
      },
      {
        description: 'should propagate service unavailable error',
        error: new Error(ERROR_MESSAGES.SERVICE_UNAVAILABLE),
        expectedMessage: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
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
      mockAgentRepository.getAgentVersions.mockRejectedValue(error);

      // Act & Assert
      const promise = getAgentVersions(mockAgentRepository, testAgentId);
      if (assertionType === 'toThrow') {
        await expect(promise).rejects.toThrow(expectedMessage as string);
      } else {
        await expect(promise).rejects.toBe(expectedMessage);
      }
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledWith(testAgentId);
      expect(mockAgentRepository.getAgentVersions).toHaveBeenCalledTimes(1);
    });
  });

  describe('Version data integrity', () => {
    test('should preserve all agent version properties', async () => {
      // Arrange
      const complexVersion = createMockAgentVersion({
        version: 5,
        isPublished: true,
        agentName: 'Complex Agent',
        voiceModel: 'eleven_flash_v2',
        fallbackVoiceIds: ['openai-Nova', 'deepgram-Angus', 'cartesia-Sonic'],
        voiceTemperature: 0.8,
        voiceSpeed: 1.2,
        volume: 0.9,
        responsiveness: 0.7,
        interruptionSensitivity: 0.6,
        enableBackchannel: false,
        backchannelFrequency: 0.5,
        backchannelWords: ['mm-hmm', 'right', 'okay'],
        reminderTriggerMs: 15000,
        reminderMaxCount: 3,
        ambientSound: 'office',
        ambientSoundVolume: 0.3,
        language: 'es-ES',
        webhookUrl: 'https://my-webhook.example.com/retell',
        webhookTimeoutMs: 15000,
        boostedKeywords: ['producto', 'servicio', 'precio'],
        dataStorageSetting: 'transcript_only',
        optInSignedUrl: false,
        pronunciationDictionary: [
          { word: 'café', alphabet: 'ipa', phoneme: 'kaˈfe' },
          { word: 'niño', alphabet: 'ipa', phoneme: 'ˈniɲo' },
        ],
        normalizeForSpeech: false,
        endCallAfterSilenceMs: 300000,
        maxCallDurationMs: 1800000,
        postCallAnalysisModel: 'gpt-4',
        beginMessageDelayMs: 2000,
        ringDurationMs: 45000,
        sttMode: 'accurate',
        vocabSpecialization: 'customer_service',
        allowUserDtmf: false,
        denoisingMode: 'basic',
        lastModificationTimestamp: Date.now(),
      });
      mockAgentRepository.getAgentVersions.mockResolvedValue([complexVersion]);

      // Act
      const result = await getAgentVersions(mockAgentRepository, TEST_CONSTANTS.VALID_AGENT_ID);

      // Assert
      expect(result).toHaveLength(1);
      const returnedVersion = result[0];
      
      // Verify all properties are preserved
      expect(returnedVersion.version).toBe(5);
      expect(returnedVersion.isPublished).toBe(true);
      expect(returnedVersion.agentName).toBe('Complex Agent');
      expect(returnedVersion.voiceModel).toBe('eleven_flash_v2');
      expect(returnedVersion.fallbackVoiceIds).toEqual(['openai-Nova', 'deepgram-Angus', 'cartesia-Sonic']);
      expect(returnedVersion.voiceTemperature).toBe(0.8);
      expect(returnedVersion.language).toBe('es-ES');
      expect(returnedVersion.boostedKeywords).toEqual(['producto', 'servicio', 'precio']);
      expect(returnedVersion.pronunciationDictionary).toHaveLength(2);
      expect(returnedVersion.pronunciationDictionary?.[0].word).toBe('café');
    });

    test('should handle versions with nullable fields correctly', async () => {
      // Arrange
      const versionWithNulls = createMockAgentVersion({
        agentName: null,
        voiceModel: null,
        fallbackVoiceIds: null,
        language: undefined,
        webhookUrl: undefined,
        boostedKeywords: undefined,
        pronunciationDictionary: undefined,
        voicemailOption: undefined,
        postCallAnalysisData: undefined,
        userDtmfOptions: undefined,
        piiConfig: undefined,
        responseEngine: undefined,
      });
      mockAgentRepository.getAgentVersions.mockResolvedValue([versionWithNulls]);

      // Act
      const result = await getAgentVersions(mockAgentRepository, TEST_CONSTANTS.VALID_AGENT_ID);

      // Assert
      expect(result).toHaveLength(1);
      const returnedVersion = result[0];
      
      expect(returnedVersion.agentName).toBeNull();
      expect(returnedVersion.voiceModel).toBeNull();
      expect(returnedVersion.fallbackVoiceIds).toBeNull();
      expect(returnedVersion.language).toBeUndefined();
      expect(returnedVersion.webhookUrl).toBeUndefined();
      expect(returnedVersion.boostedKeywords).toBeUndefined();
      
      // Required fields should still be present
      expect(returnedVersion.agentId).toBeTruthy();
      expect(returnedVersion.voiceId).toBeTruthy();
      expect(typeof returnedVersion.version).toBe('number');
      expect(typeof returnedVersion.isPublished).toBe('boolean');
      expect(typeof returnedVersion.lastModificationTimestamp).toBe('number');
    });
  });
});
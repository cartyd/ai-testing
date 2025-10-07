import { HTTP_STATUS } from '../constants/controller.constants';

// Simple constants for reusability
export const AGENT_ROUTE_PREFIX = '/api/v1/agents';

// Agent data schema
const agentData = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    prompt: { type: 'string' },
    voiceId: { type: 'string' },
    language: { type: 'string' },
    model: { type: 'string' },
    temperature: { type: 'number' },
    maxTokens: { type: 'number' },
    version: { type: 'number' },
    versionTitle: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    // New fields from Get Agent API
    channel: { type: 'string' },
    isPublished: { type: 'boolean' },
    responseEngine: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        llmId: { type: 'string' },
        version: { type: 'number' },
      },
      required: ['type'],
    },
  },
  required: ['id', 'name', 'prompt', 'createdAt', 'updatedAt'],
} as const;
// Agent prompt schema
const agentPrompt = {
  type: 'object',
  properties: {
    agentId: { type: 'string' },
    prompt: { type: 'string' },
    version: { type: 'number' },
    versionTitle: { type: 'string' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['agentId', 'prompt', 'updatedAt'],
} as const;

// Agent version schema
const agentVersion = {
  type: 'object',
  properties: {
    agentId: { type: 'string' },
    version: { type: 'number' },
    isPublished: { type: 'boolean' },
    agentName: { type: 'string', nullable: true },
    voiceId: { type: 'string' },
    voiceModel: { type: 'string', nullable: true },
    fallbackVoiceIds: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    voiceTemperature: { type: 'number' },
    voiceSpeed: { type: 'number' },
    volume: { type: 'number' },
    responsiveness: { type: 'number' },
    interruptionSensitivity: { type: 'number' },
    enableBackchannel: { type: 'boolean' },
    backchannelFrequency: { type: 'number' },
    backchannelWords: {
      type: 'array',
      items: { type: 'string' },
    },
    reminderTriggerMs: { type: 'number' },
    reminderMaxCount: { type: 'number' },
    ambientSound: { type: 'string' },
    ambientSoundVolume: { type: 'number' },
    language: { type: 'string' },
    webhookUrl: { type: 'string' },
    webhookTimeoutMs: { type: 'number' },
    boostedKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    dataStorageSetting: { type: 'string' },
    optInSignedUrl: { type: 'boolean' },
    pronunciationDictionary: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          word: { type: 'string' },
          alphabet: { type: 'string' },
          phoneme: { type: 'string' },
        },
        required: ['word', 'alphabet', 'phoneme'],
      },
    },
    normalizeForSpeech: { type: 'boolean' },
    endCallAfterSilenceMs: { type: 'number' },
    maxCallDurationMs: { type: 'number' },
    voicemailOption: {
      type: 'object',
      properties: {
        action: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['type', 'text'],
        },
      },
      required: ['action'],
    },
    postCallAnalysisData: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          examples: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['type', 'name', 'description', 'examples'],
      },
    },
    postCallAnalysisModel: { type: 'string' },
    beginMessageDelayMs: { type: 'number' },
    ringDurationMs: { type: 'number' },
    sttMode: { type: 'string' },
    vocabSpecialization: { type: 'string' },
    allowUserDtmf: { type: 'boolean' },
    userDtmfOptions: {
      type: 'object',
      properties: {
        digitLimit: { type: 'number' },
        terminationKey: { type: 'string' },
        timeoutMs: { type: 'number' },
      },
      required: ['digitLimit', 'terminationKey', 'timeoutMs'],
    },
    denoisingMode: { type: 'string' },
    piiConfig: {
      type: 'object',
      properties: {
        mode: { type: 'string' },
        categories: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['mode', 'categories'],
    },
    responseEngine: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        llmId: { type: 'string' },
        version: { type: 'number' },
      },
      required: ['type'],
    },
    lastModificationTimestamp: { type: 'number' },
  },
  required: ['agentId', 'version', 'isPublished', 'voiceId', 'lastModificationTimestamp'],
} as const;

// Parameter schema
const agentIdParam = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
  },
  required: ['id'],
} as const;

// Success response wrapper
const successResponse = (dataSchema: unknown) => ({
  type: 'object',
  properties: {
    data: dataSchema,
    message: { type: 'string' },
  },
  required: ['data'],
});

// Error response schema
const errorResponse = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['message', 'code', 'timestamp'],
    },
  },
  required: ['error'],
} as const;

// API endpoint schemas
export const agentSchemas = {
  // GET /api/v1/agents
  listAgents: {
    tags: ['Agents'],
    summary: 'List all agents',
    description: 'Retrieve a list of all available Retell AI agents',
    response: {
      [HTTP_STATUS.OK]: successResponse({
        type: 'array',
        items: agentData,
      }),
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },

  // GET /api/v1/agents/:id
  getAgent: {
    tags: ['Agents'],
    summary: 'Get agent by ID',
    description: 'Retrieve a specific agent by its ID',
    params: agentIdParam,
    response: {
      [HTTP_STATUS.OK]: successResponse(agentData),
      [HTTP_STATUS.NOT_FOUND]: errorResponse,
      [HTTP_STATUS.BAD_REQUEST]: errorResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },

  // GET /api/v1/agents/:id/prompt
  getAgentPrompt: {
    tags: ['Agents'],
    summary: 'Get agent prompt',
    description: 'Retrieve the system prompt for a specific agent',
    params: agentIdParam,
    response: {
      [HTTP_STATUS.OK]: successResponse(agentPrompt),
      [HTTP_STATUS.NOT_FOUND]: errorResponse,
      [HTTP_STATUS.BAD_REQUEST]: errorResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },

  // GET /api/v1/agents/:id/versions
  getAgentVersions: {
    tags: ['Agents'],
    summary: 'Get agent versions',
    description: 'Retrieve all versions of a specific agent',
    params: agentIdParam,
    response: {
      [HTTP_STATUS.OK]: successResponse({
        type: 'array',
        items: agentVersion,
      }),
      [HTTP_STATUS.NOT_FOUND]: errorResponse,
      [HTTP_STATUS.BAD_REQUEST]: errorResponse,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: errorResponse,
    },
  },
} as const;

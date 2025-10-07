import type { AgentRepository } from '../../app/ports';
import type { Agent, AgentPrompt, AgentVersion } from '../../core/entities';
import type { RetellApiClient } from './retell-client';

// Pure mapping functions
/**
 * Maps Retell API agent data to domain Agent entity
 */
function mapToAgent(apiAgent: any): Agent {
  return {
    id: apiAgent.agent_id,
    name: apiAgent.agent_name,
    prompt: apiAgent.system_prompt || '', // Some agents might not have this field
    voiceId: apiAgent.voice_id,
    language: apiAgent.language,
    model: apiAgent.response_engine?.type || 'unknown',
    temperature: apiAgent.temperature || 0.7,
    maxTokens: apiAgent.max_tokens || 1000,
    version: apiAgent.version,
    versionTitle: apiAgent.version_title,
    createdAt: new Date(), // API doesn't provide created_time, use current time
    updatedAt: new Date(apiAgent.last_modification_timestamp), // Use correct timestamp field
    // New fields from Get Agent API
    channel: apiAgent.channel,
    isPublished: apiAgent.is_published,
    responseEngine: apiAgent.response_engine ? {
      type: apiAgent.response_engine.type,
      llmId: apiAgent.response_engine.llm_id,
      version: apiAgent.response_engine.version,
    } : undefined,
  };
}
/**
 * Maps Retell API prompt data to domain AgentPrompt entity
 */
function mapToAgentPrompt(apiPrompt: any): AgentPrompt {
  return {
    agentId: apiPrompt.agent_id,
    prompt: apiPrompt.system_prompt,
    version: apiPrompt.prompt_version,
    versionTitle: apiPrompt.version_title,
    updatedAt: new Date(apiPrompt.last_modification_time), // Already in milliseconds
  };
}

/**
 * Maps Retell API agent version data to domain AgentVersion entity
 */
function mapToAgentVersion(apiVersion: any): AgentVersion {
  return {
    agentId: apiVersion.agent_id,
    version: apiVersion.version,
    isPublished: apiVersion.is_published,
    agentName: apiVersion.agent_name,
    voiceId: apiVersion.voice_id,
    voiceModel: apiVersion.voice_model,
    fallbackVoiceIds: apiVersion.fallback_voice_ids,
    voiceTemperature: apiVersion.voice_temperature,
    voiceSpeed: apiVersion.voice_speed,
    volume: apiVersion.volume,
    responsiveness: apiVersion.responsiveness,
    interruptionSensitivity: apiVersion.interruption_sensitivity,
    enableBackchannel: apiVersion.enable_backchannel,
    backchannelFrequency: apiVersion.backchannel_frequency,
    backchannelWords: apiVersion.backchannel_words,
    reminderTriggerMs: apiVersion.reminder_trigger_ms,
    reminderMaxCount: apiVersion.reminder_max_count,
    ambientSound: apiVersion.ambient_sound,
    ambientSoundVolume: apiVersion.ambient_sound_volume,
    language: apiVersion.language,
    webhookUrl: apiVersion.webhook_url,
    webhookTimeoutMs: apiVersion.webhook_timeout_ms,
    boostedKeywords: apiVersion.boosted_keywords,
    dataStorageSetting: apiVersion.data_storage_setting,
    optInSignedUrl: apiVersion.opt_in_signed_url,
    pronunciationDictionary: apiVersion.pronunciation_dictionary,
    normalizeForSpeech: apiVersion.normalize_for_speech,
    endCallAfterSilenceMs: apiVersion.end_call_after_silence_ms,
    maxCallDurationMs: apiVersion.max_call_duration_ms,
    voicemailOption: apiVersion.voicemail_option,
    postCallAnalysisData: apiVersion.post_call_analysis_data,
    postCallAnalysisModel: apiVersion.post_call_analysis_model,
    beginMessageDelayMs: apiVersion.begin_message_delay_ms,
    ringDurationMs: apiVersion.ring_duration_ms,
    sttMode: apiVersion.stt_mode,
    vocabSpecialization: apiVersion.vocab_specialization,
    allowUserDtmf: apiVersion.allow_user_dtmf,
    userDtmfOptions: apiVersion.user_dtmf_options,
    denoisingMode: apiVersion.denoising_mode,
    piiConfig: apiVersion.pii_config,
    responseEngine: apiVersion.response_engine,
    lastModificationTimestamp: apiVersion.last_modification_timestamp,
  };
}

/**
 * Checks if an error is a 404 (not found) error
 */
function is404Error(error: unknown): boolean {
  return error instanceof Error && error.message.includes('404');
}

/**
 * Creates a RetellAgentRepository implementation with functional approach
 */
export function createRetellAgentRepository(retellClient: RetellApiClient): AgentRepository {
  return {
    async listAgents(): Promise<Agent[]> {
      const response = await retellClient.listAgents();
      return response.map(mapToAgent);
    },

    async getAgent(id: string): Promise<Agent | null> {
      try {
        const response = await retellClient.getAgent(id);
        return mapToAgent(response);
      } catch (error) {
        // If it's a 404 from the API, return null instead of throwing
        if (is404Error(error)) {
          return null;
        }
        throw error;
      }
    },

    async getAgentPrompt(id: string): Promise<AgentPrompt | null> {
      try {
        const response = await retellClient.getAgentPrompt(id);
        return mapToAgentPrompt(response);
      } catch (error) {
        // If it's a 404 from the API, return null instead of throwing
        if (is404Error(error)) {
          return null;
        }
        throw error;
      }
    },

    async getAgentVersions(id: string): Promise<AgentVersion[]> {
      const response = await retellClient.getAgentVersions(id);
      return response.map(mapToAgentVersion);
    },
  };
}

// For backward compatibility, export a class that uses the functional implementation
export class RetellAgentRepository implements AgentRepository {
  private readonly implementation: AgentRepository;

  constructor(retellClient: RetellApiClient) {
    this.implementation = createRetellAgentRepository(retellClient);
  }

  async listAgents(): Promise<Agent[]> {
    return this.implementation.listAgents();
  }

  async getAgent(id: string): Promise<Agent | null> {
    return this.implementation.getAgent(id);
  }

  async getAgentPrompt(id: string): Promise<AgentPrompt | null> {
    return this.implementation.getAgentPrompt(id);
  }

  async getAgentVersions(id: string): Promise<AgentVersion[]> {
    return this.implementation.getAgentVersions(id);
  }
}

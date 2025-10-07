import { z } from 'zod';

/**
 * Base agent schema containing common fields shared between 
 * AgentResponseSchema and AgentVersionResponseSchema
 */
export const BaseAgentSchema = z.object({
  agent_id: z.string(),
  version: z.number().optional(),
  is_published: z.boolean().optional(),
  language: z.string().optional(),
  voice_id: z.string().optional(),
  response_engine: z.object({
    type: z.string(),
    llm_id: z.string().optional(),
    version: z.number().optional(),
  }).optional(),
  last_modification_timestamp: z.number(),
});

/**
 * Agent response schema from Retell AI API - extends base with agent-specific fields
 */
export const AgentResponseSchema = BaseAgentSchema.extend({
  agent_name: z.string(),
  channel: z.string().optional(),
  version_title: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  system_prompt: z.string().optional(),
});

/**
 * Agent version response schema from Retell AI API - extends base with version-specific fields
 * Note: Some base fields have different optionality requirements in the version schema
 */
export const AgentVersionResponseSchema = BaseAgentSchema.extend({
  // Override base fields with different requirements
  version: z.number(), // Required in version schema
  voice_id: z.string(), // Required in version schema
  
  // Version-specific fields
  agent_name: z.string().nullable().optional(),
  voice_model: z.string().nullable().optional(),
  fallback_voice_ids: z.array(z.string()).nullable().optional(),
  voice_temperature: z.number().optional(),
  voice_speed: z.number().optional(),
  volume: z.number().optional(),
  responsiveness: z.number().optional(),
  interruption_sensitivity: z.number().optional(),
  enable_backchannel: z.boolean().optional(),
  backchannel_frequency: z.number().optional(),
  backchannel_words: z.array(z.string()).optional(),
  reminder_trigger_ms: z.number().optional(),
  reminder_max_count: z.number().optional(),
  ambient_sound: z.string().optional(),
  ambient_sound_volume: z.number().optional(),
  webhook_url: z.string().optional(),
  webhook_timeout_ms: z.number().optional(),
  boosted_keywords: z.array(z.string()).optional(),
  data_storage_setting: z.string().optional(),
  opt_in_signed_url: z.boolean().optional(),
  pronunciation_dictionary: z.array(z.object({
    word: z.string(),
    alphabet: z.string(),
    phoneme: z.string(),
  })).optional(),
  normalize_for_speech: z.boolean().optional(),
  end_call_after_silence_ms: z.number().optional(),
  max_call_duration_ms: z.number().optional(),
  voicemail_option: z.object({
    action: z.object({
      type: z.string(),
      text: z.string(),
    }),
  }).optional(),
  post_call_analysis_data: z.array(z.object({
    type: z.string(),
    name: z.string(),
    description: z.string(),
    examples: z.array(z.string()),
  })).optional(),
  post_call_analysis_model: z.string().optional(),
  begin_message_delay_ms: z.number().optional(),
  ring_duration_ms: z.number().optional(),
  stt_mode: z.string().optional(),
  vocab_specialization: z.string().optional(),
  allow_user_dtmf: z.boolean().optional(),
  user_dtmf_options: z.object({
    digit_limit: z.number(),
    termination_key: z.string(),
    timeout_ms: z.number(),
  }).optional(),
  denoising_mode: z.string().optional(),
  pii_config: z.object({
    mode: z.string(),
    categories: z.array(z.string()),
  }).optional(),
});

// List agents response schema - API returns array directly
export const ListAgentsResponseSchema = z.array(AgentResponseSchema);

// List agent versions response schema - API returns array directly
export const ListAgentVersionsResponseSchema = z.array(AgentVersionResponseSchema);

// Get agent params schema
export const GetAgentParamsSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
});

// LLM response schema from Retell AI API
export const LLMResponseSchema = z.object({
  llm_id: z.string(),
  version: z.number().optional(),
  model: z.string().optional(),
  general_prompt: z.string().optional(),
  last_modification_timestamp: z.number(),
});

// Get agent prompt response schema
export const AgentPromptResponseSchema = z.object({
  agent_id: z.string(),
  system_prompt: z.string(),
  prompt_version: z.number().optional(),
  version_title: z.string().optional(),
  last_modification_time: z.number(),
});

// Type exports for the base schema
export type BaseAgentInput = z.input<typeof BaseAgentSchema>;
export type BaseAgentOutput = z.output<typeof BaseAgentSchema>;

// Type exports for agent response schemas
export type AgentResponseInput = z.input<typeof AgentResponseSchema>;
export type AgentResponseOutput = z.output<typeof AgentResponseSchema>;
export type ListAgentsResponseInput = z.input<typeof ListAgentsResponseSchema>;
export type ListAgentsResponseOutput = z.output<typeof ListAgentsResponseSchema>;

// Type exports for agent version schemas
export type AgentVersionResponseInput = z.input<typeof AgentVersionResponseSchema>;
export type AgentVersionResponseOutput = z.output<typeof AgentVersionResponseSchema>;
export type ListAgentVersionsResponseInput = z.input<typeof ListAgentVersionsResponseSchema>;
export type ListAgentVersionsResponseOutput = z.output<typeof ListAgentVersionsResponseSchema>;

// Type exports for other schemas
export type GetAgentParamsInput = z.input<typeof GetAgentParamsSchema>;
export type GetAgentParamsOutput = z.output<typeof GetAgentParamsSchema>;
export type LLMResponseInput = z.input<typeof LLMResponseSchema>;
export type LLMResponseOutput = z.output<typeof LLMResponseSchema>;
export type AgentPromptResponseInput = z.input<typeof AgentPromptResponseSchema>;
export type AgentPromptResponseOutput = z.output<typeof AgentPromptResponseSchema>;

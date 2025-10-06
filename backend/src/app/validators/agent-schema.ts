import { z } from 'zod';

// Agent response schema from Retell AI API
export const AgentResponseSchema = z.object({
  agent_id: z.string(),
  agent_name: z.string(),
  channel: z.string().optional(),
  last_modification_timestamp: z.number(),
  response_engine: z.object({
    type: z.string(),
    llm_id: z.string().optional(),
    version: z.number().optional(),
  }).optional(),
  language: z.string().optional(),
  voice_id: z.string().optional(),
  version: z.number().optional(),
  is_published: z.boolean().optional(),
  version_title: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  system_prompt: z.string().optional(),
});

// List agents response schema - API returns array directly
export const ListAgentsResponseSchema = z.array(AgentResponseSchema);

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
  last_modification_time: z.number(),
});

export type AgentResponseInput = z.input<typeof AgentResponseSchema>;
export type AgentResponseOutput = z.output<typeof AgentResponseSchema>;
export type ListAgentsResponseInput = z.input<typeof ListAgentsResponseSchema>;
export type ListAgentsResponseOutput = z.output<typeof ListAgentsResponseSchema>;
export type GetAgentParamsInput = z.input<typeof GetAgentParamsSchema>;
export type GetAgentParamsOutput = z.output<typeof GetAgentParamsSchema>;
export type LLMResponseInput = z.input<typeof LLMResponseSchema>;
export type LLMResponseOutput = z.output<typeof LLMResponseSchema>;
export type AgentPromptResponseInput = z.input<typeof AgentPromptResponseSchema>;
export type AgentPromptResponseOutput = z.output<typeof AgentPromptResponseSchema>;

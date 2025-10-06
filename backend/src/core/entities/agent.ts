export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly voiceId?: string;
  readonly language?: string;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AgentPrompt {
  readonly agentId: string;
  readonly prompt: string;
  readonly version?: number;
  readonly updatedAt: Date;
}
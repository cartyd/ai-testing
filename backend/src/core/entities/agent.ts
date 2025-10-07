export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly voiceId?: string;
  readonly language?: string;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly version?: number;
  readonly versionTitle?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // New fields from Get Agent API
  readonly channel?: string;
  readonly isPublished?: boolean;
  readonly responseEngine?: {
    readonly type: string;
    readonly llmId?: string;
    readonly version?: number;
  };
}

export interface AgentPrompt {
  readonly agentId: string;
  readonly prompt: string;
  readonly version?: number;
  readonly versionTitle?: string;
  readonly updatedAt: Date;
}

export interface AgentVersion {
  readonly agentId: string;
  readonly version: number;
  readonly isPublished: boolean;
  readonly agentName: string | null;
  readonly voiceId: string;
  readonly voiceModel?: string | null;
  readonly fallbackVoiceIds?: string[] | null;
  readonly voiceTemperature?: number;
  readonly voiceSpeed?: number;
  readonly volume?: number;
  readonly responsiveness?: number;
  readonly interruptionSensitivity?: number;
  readonly enableBackchannel?: boolean;
  readonly backchannelFrequency?: number;
  readonly backchannelWords?: string[];
  readonly reminderTriggerMs?: number;
  readonly reminderMaxCount?: number;
  readonly ambientSound?: string;
  readonly ambientSoundVolume?: number;
  readonly language?: string;
  readonly webhookUrl?: string;
  readonly webhookTimeoutMs?: number;
  readonly boostedKeywords?: string[];
  readonly dataStorageSetting?: string;
  readonly optInSignedUrl?: boolean;
  readonly pronunciationDictionary?: Array<{
    word: string;
    alphabet: string;
    phoneme: string;
  }>;
  readonly normalizeForSpeech?: boolean;
  readonly endCallAfterSilenceMs?: number;
  readonly maxCallDurationMs?: number;
  readonly voicemailOption?: {
    action: {
      type: string;
      text: string;
    };
  };
  readonly postCallAnalysisData?: Array<{
    type: string;
    name: string;
    description: string;
    examples: string[];
  }>;
  readonly postCallAnalysisModel?: string;
  readonly beginMessageDelayMs?: number;
  readonly ringDurationMs?: number;
  readonly sttMode?: string;
  readonly vocabSpecialization?: string;
  readonly allowUserDtmf?: boolean;
  readonly userDtmfOptions?: {
    digitLimit: number;
    terminationKey: string;
    timeoutMs: number;
  };
  readonly denoisingMode?: string;
  readonly piiConfig?: {
    mode: string;
    categories: string[];
  };
  readonly responseEngine?: {
    type: string;
    llmId?: string;
    version?: number;
  };
  readonly lastModificationTimestamp: number;
}

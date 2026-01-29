export enum CallState {
  IDLE = 'IDLE',
  RINGING = 'RINGING',
  CONNECTING = 'CONNECTING',
  USER_SPEAKING = 'USER_SPEAKING',
  AGENT_SPEAKING = 'AGENT_SPEAKING',
  CONVERSATION = 'CONVERSATION',
  ENDED = 'ENDED',
}

export type ContactTone = 'Formal' | 'Casual' | 'Friendly';

export interface PromptConfig {
  agentName: string;
  donorName: string;
  currentAmount: number;
  targetAmount: number;
  donationHistory: string;
  contactTone: ContactTone;
  additionalInstructions?: string;
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  agentName: 'Sarah',
  donorName: 'Max Mustermann',
  currentAmount: 20,
  targetAmount: 35,
  donationHistory: '2 Jahre',
  contactTone: 'Friendly',
  additionalInstructions: '',
};

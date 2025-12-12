export interface Prompt {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  tags?: string[];
}

export interface PromptVersion {
  id: string;
  promptId: string;
  content: string;
  createdAt: number;
  changeDescription: string;
}

export interface AIResponse {
  continuations: string[];
  enhancements: string[];
  typos: { original: string; suggestion: string; index: number }[];
}

export type EditorStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';
export type AIStatus = 'idle' | 'thinking' | 'ready';

export interface Suggestion {
  id: string;
  type: 'continuation' | 'enhancement' | 'typo';
  content: string;
  description?: string;
}
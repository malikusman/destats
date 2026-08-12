import { controlPlaneGet } from './client';
import type { AiModelRoute, AiPromptMetadata, AiRequestLog } from '../../types/control-plane';

export function fetchAiModels(): Promise<AiModelRoute[]> {
  return controlPlaneGet<AiModelRoute[]>('/ai/models');
}

export function fetchAiPrompts(): Promise<AiPromptMetadata[]> {
  return controlPlaneGet<AiPromptMetadata[]>('/ai/prompts');
}

export function fetchAiLogs(): Promise<AiRequestLog[]> {
  return controlPlaneGet<AiRequestLog[]>('/ai/logs');
}

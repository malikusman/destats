import { controlPlaneGet } from './client';

export interface ControlPlaneHealth {
  status: string;
  service?: string;
  mode?: string;
}

export function fetchAiHealth(): Promise<ControlPlaneHealth> {
  return controlPlaneGet<ControlPlaneHealth>('/ai/health');
}

export function fetchAgentHealth(): Promise<ControlPlaneHealth> {
  return controlPlaneGet<ControlPlaneHealth>('/agent/health');
}

export function fetchPolicyHealth(): Promise<ControlPlaneHealth> {
  return controlPlaneGet<ControlPlaneHealth>('/policy/health');
}

export function fetchExecutionHealth(): Promise<ControlPlaneHealth> {
  return controlPlaneGet<ControlPlaneHealth>('/execution/health');
}

export type IncidentSource = 'demo' | 'api';

export interface UnifiedIncidentListItem {
  id: string;
  source: IncidentSource;
  title: string;
  description: string;
  severity: string;
  status: string;
  sortTime: string;
  contextLabel: string;
  countLabel: string;
  tags?: string[];
}

export interface UnifiedIncidentStats {
  active: number;
  critical: number;
  high: number;
  resolved: number;
  total: number;
}

export interface UnifiedIncidentsResult {
  incidents: UnifiedIncidentListItem[];
  stats: UnifiedIncidentStats;
  apiAvailable: boolean;
}

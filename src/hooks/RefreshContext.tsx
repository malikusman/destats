import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface RefreshOption {
  label: string;
  /** false = polling off (TanStack Query convention). */
  interval: number | false;
}

export const REFRESH_OPTIONS: RefreshOption[] = [
  { label: 'Off', interval: false },
  { label: '15s', interval: 15_000 },
  { label: '30s', interval: 30_000 },
  { label: '60s', interval: 60_000 },
  { label: '5m', interval: 300_000 },
];

const DEFAULT_INDEX = 2; // 30s

interface RefreshContextValue {
  option: RefreshOption;
  setOptionIndex: (index: number) => void;
  optionIndex: number;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [optionIndex, setOptionIndex] = useState(DEFAULT_INDEX);
  const value = useMemo(
    () => ({
      option: REFRESH_OPTIONS[optionIndex] ?? REFRESH_OPTIONS[DEFAULT_INDEX],
      optionIndex,
      setOptionIndex,
    }),
    [optionIndex],
  );
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useRefreshInterval(): RefreshContextValue {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error('useRefreshInterval must be used within RefreshProvider');
  return ctx;
}

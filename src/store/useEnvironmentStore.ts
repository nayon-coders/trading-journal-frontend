import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EnvironmentState {
  environment: 'Live' | 'Backtesting';
  setEnvironment: (env: 'Live' | 'Backtesting') => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set) => ({
      environment: 'Live',
      setEnvironment: (env) => set({ environment: env }),
    }),
    { name: 'trading-environment' }
  )
);

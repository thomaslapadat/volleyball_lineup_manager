import { create } from 'zustand';
import type { AppState } from '@/types';

const STORAGE_KEY = 'volleyball_app_state';

const initialState: AppState = {
  players: {},
  leagues: {},
};

function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return JSON.parse(raw) as AppState;
  } catch {
    return initialState;
  }
}

interface AppStore extends AppState {
  // Actions will be added in Stage 2
}

export const useAppStore = create<AppStore>(() => ({
  ...loadFromStorage(),
}));

// Persist every state change to localStorage
useAppStore.subscribe((state) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ players: state.players, leagues: state.leagues }),
  );
});

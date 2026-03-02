import { create } from 'zustand';
import type {
  AppState,
  League,
  LeaguePlayer,
  Player,
  Session,
  UiSettings,
} from '@/types';

const STORAGE_KEY = 'volleyball_app_state';

const PLAYER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#84cc16', // lime
  '#6366f1', // indigo
];

function getSystemTheme(): UiSettings['theme'] {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

const initialState: AppState = {
  uiSettings: { theme: getSystemTheme() },
  players: {},
  leagues: {},
};

function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    // Merge so that new fields (e.g. uiSettings) fall back to defaults if absent.
    const stored = JSON.parse(raw) as Partial<AppState>;
    return { ...initialState, ...stored };
  } catch {
    return initialState;
  }
}

// ─── Action Signatures ────────────────────────────────────────────────────────

interface AppActions {
  // Theme
  setTheme: (theme: UiSettings['theme']) => void;

  // Players
  addPlayer: (name: string, gender: Player['gender']) => void;
  updatePlayer: (
    id: string,
    patch: Partial<Pick<Player, 'name' | 'gender'>>,
  ) => void;
  deletePlayer: (id: string) => void;

  // Leagues
  addLeague: (name: string) => void;
  updateLeague: (id: string, patch: Partial<Pick<League, 'name'>>) => void;
  deleteLeague: (id: string) => void;

  // Roster membership
  addPlayerToLeague: (leagueId: string, playerId: string) => void;
  updateLeaguePlayer: (
    leagueId: string,
    playerId: string,
    patch: Partial<Pick<LeaguePlayer, 'preferences'>>,
  ) => void;
  removePlayerFromLeague: (leagueId: string, playerId: string) => void;

  // Sessions
  saveSession: (session: Session) => void;
  deleteSession: (leagueId: string, sessionId: string) => void;
}

type AppStore = AppState & AppActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set) => ({
  ...loadFromStorage(),

  // ─── Theme ────────────────────────────────────────────────────────────────

  setTheme: (theme) =>
    set((state) => ({ uiSettings: { ...state.uiSettings, theme } })),

  // ─── Players ──────────────────────────────────────────────────────────────

  addPlayer: (name, gender) => {
    const id = crypto.randomUUID();
    const color =
      PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
    set((state) => ({
      players: { ...state.players, [id]: { id, name, gender, color } },
    }));
  },

  updatePlayer: (id, patch) =>
    set((state) => ({
      players: { ...state.players, [id]: { ...state.players[id], ...patch } },
    })),

  // Also removes the player from every league roster to keep data consistent.
  deletePlayer: (id) =>
    set((state) => {
      const players = { ...state.players };
      delete players[id];

      const leagues: AppState['leagues'] = {};
      for (const [leagueId, league] of Object.entries(state.leagues)) {
        const roster = { ...league.roster };
        delete roster[id];
        leagues[leagueId] = { ...league, roster };
      }

      return { players, leagues };
    }),

  // ─── Leagues ──────────────────────────────────────────────────────────────

  addLeague: (name) => {
    const id = crypto.randomUUID();
    set((state) => ({
      leagues: {
        ...state.leagues,
        [id]: { id, name, roster: {}, sessions: {} },
      },
    }));
  },

  updateLeague: (id, patch) =>
    set((state) => ({
      leagues: { ...state.leagues, [id]: { ...state.leagues[id], ...patch } },
    })),

  deleteLeague: (id) =>
    set((state) => {
      const leagues = { ...state.leagues };
      delete leagues[id];
      return { leagues };
    }),

  // ─── Roster ───────────────────────────────────────────────────────────────

  addPlayerToLeague: (leagueId, playerId) =>
    set((state) => ({
      leagues: {
        ...state.leagues,
        [leagueId]: {
          ...state.leagues[leagueId],
          roster: {
            ...state.leagues[leagueId].roster,
            [playerId]: { playerId, preferences: [] },
          },
        },
      },
    })),

  updateLeaguePlayer: (leagueId, playerId, patch) =>
    set((state) => ({
      leagues: {
        ...state.leagues,
        [leagueId]: {
          ...state.leagues[leagueId],
          roster: {
            ...state.leagues[leagueId].roster,
            [playerId]: {
              ...state.leagues[leagueId].roster[playerId],
              ...patch,
            },
          },
        },
      },
    })),

  removePlayerFromLeague: (leagueId, playerId) =>
    set((state) => {
      const roster = { ...state.leagues[leagueId].roster };
      delete roster[playerId];
      return {
        leagues: {
          ...state.leagues,
          [leagueId]: { ...state.leagues[leagueId], roster },
        },
      };
    }),

  // ─── Sessions ─────────────────────────────────────────────────────────────

  saveSession: (session) =>
    set((state) => ({
      leagues: {
        ...state.leagues,
        [session.leagueId]: {
          ...state.leagues[session.leagueId],
          sessions: {
            ...state.leagues[session.leagueId].sessions,
            [session.id]: session,
          },
        },
      },
    })),

  deleteSession: (leagueId, sessionId) =>
    set((state) => {
      const sessions = { ...state.leagues[leagueId].sessions };
      delete sessions[sessionId];
      return {
        leagues: {
          ...state.leagues,
          [leagueId]: { ...state.leagues[leagueId], sessions },
        },
      };
    }),
}));

// ─── Persistence & Theme Sync ─────────────────────────────────────────────────

useAppStore.subscribe((state) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      uiSettings: state.uiSettings,
      players: state.players,
      leagues: state.leagues,
    }),
  );
  // Keep the <html> class in sync with the stored theme.
  document.documentElement.classList.toggle(
    'dark',
    state.uiSettings.theme === 'dark',
  );
});

// Apply theme immediately on load, before React's first render.
document.documentElement.classList.toggle(
  'dark',
  useAppStore.getState().uiSettings.theme === 'dark',
);

// ─── Primitives ─────────────────────────────────────────────────────────────

export type Position =
  | 'setter'
  | 'opposite'
  | 'power1'
  | 'power2'
  | 'middle1'
  | 'middle2'
  | 'libero';

/** All primary (non-libero) positions in front-row → back-row court order. */
export const PRIMARY_POSITIONS: Position[] = [
  'middle1',
  'power1',
  'setter',
  'opposite',
  'power2',
  'middle2',
];

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string; // crypto.randomUUID()
  name: string;
  gender: 'male' | 'female';
  color: string; // hex, auto-assigned on creation
}

// ─── League ──────────────────────────────────────────────────────────────────

/**
 * Grouped preference positions (power/middle collapse the two sub-positions).
 * Stored on the roster entry; not the same as the court Position type.
 */
export type PositionGroup =
  | 'setter'
  | 'opposite'
  | 'power'
  | 'middle'
  | 'libero';

export interface LeaguePlayer {
  playerId: string;
  preferences: PositionGroup[]; // ordered most → least preferred; may be empty
}

export interface League {
  id: string;
  name: string;
  roster: Record<string, LeaguePlayer>; // keyed by player ID
  sessions: Record<string, Session>; // keyed by session ID
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  leagueId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  attendees: string[]; // player IDs
  games: GameLineup[];
}

// ─── Game Lineup ─────────────────────────────────────────────────────────────

export interface GameLineup {
  id: string;
  hasLibero: boolean;
  assignments: Assignment[];
  overrides: Override[];
}

export interface Assignment {
  playerId: string;
  position: Position;
  isSharing: boolean; // true for the middle who shares a slot with a libero
  isLocked?: boolean; // when true: position cannot be changed by drag or reroll
}

export interface Override {
  playerId: string;
  position: Position;
}

// ─── UI Settings ─────────────────────────────────────────────────────────────

export interface UiSettings {
  theme: 'light' | 'dark';
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  uiSettings: UiSettings;
  players: Record<string, Player>; // keyed by player ID
  leagues: Record<string, League>; // keyed by league ID
}

// ─── Derived (never stored) ───────────────────────────────────────────────────

export interface PlaytimeSummary {
  playerId: string;
  gamesAttended: number;
  gamesPlayed: number; // 0.5 per shared slot, 1.0 per full slot
  playtimeRate: number; // gamesPlayed / gamesAttended; 0 if no history
}

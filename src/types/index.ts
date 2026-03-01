// ─── Primitives ─────────────────────────────────────────────────────────────

export type Position = 'setter' | 'opposite' | 'power' | 'middle' | 'libero';

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string; // crypto.randomUUID()
  name: string;
  gender: 'male' | 'female' | 'other';
}

// ─── League ──────────────────────────────────────────────────────────────────

export interface LeaguePlayer {
  playerId: string;
  preferences: Position[]; // ordered most → least preferred; may be empty
  lockedIn: boolean; // always assign top preference when true
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
}

export interface Override {
  playerId: string;
  position: Position;
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
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

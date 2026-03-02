import type {
  Assignment,
  GameLineup,
  League,
  Player,
  Position,
  Session,
} from '@/types';

// Position slots for a standard 6-player game
const SLOTS_NO_LIBERO: Position[] = [
  'setter',
  'opposite',
  'middle',
  'middle',
  'power',
  'power',
];

const SLOTS_WITH_LIBERO: Position[] = [
  'setter',
  'opposite',
  'middle',
  'power',
  'power',
  'libero',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Selects the primary players (those assigned a unique slot, not sharing).
 *
 * Rules applied in order:
 * 1. Locked-in players always play.
 * 2. Male players are capped at `maxMale` (female + other are treated as
 *    non-male and fill slots freely). Any male players beyond the cap are
 *    deferred until all non-male players have been considered.
 * 3. Remaining slots filled randomly from the deferred male pool if needed.
 */
function selectPrimary(
  candidates: string[],
  slotCount: number,
  players: Record<string, Player>,
  league: League,
  maxMale = 4,
): string[] {
  if (candidates.length <= slotCount) return [...candidates];

  const isMale = (id: string) => players[id]?.gender === 'male';
  const isLocked = (id: string) => league.roster[id]?.lockedIn ?? false;

  const locked = candidates.filter(isLocked);
  const available = shuffle(candidates.filter((id) => !isLocked(id)));

  const primary = [...locked];
  let maleCount = primary.filter((id) => isMale(id)).length;
  const deferredMale: string[] = [];

  for (const id of available) {
    if (primary.length >= slotCount) break;
    if (isMale(id)) {
      if (maleCount < maxMale) {
        primary.push(id);
        maleCount++;
      } else {
        deferredMale.push(id);
      }
    } else {
      primary.push(id);
    }
  }

  // If there are still open slots (not enough non-male players), fill with
  // deferred males rather than leaving slots empty.
  for (const id of deferredMale) {
    if (primary.length >= slotCount) break;
    primary.push(id);
  }

  return primary;
}

/**
 * Generates lineups for every game in the session.
 *
 * - Locked-in players always appear in the primary lineup.
 * - Male players are capped (female + other fill slots first).
 * - Position assignment is random: primary players are shuffled and mapped
 *   directly to slots.
 * - When more than 6 players attend, extras share positions cyclically.
 */
export function generateLineups(
  session: Session,
  league: League,
  players: Record<string, Player>,
): GameLineup[] {
  if (session.attendees.length === 0) return session.games;

  // Locked-in first, then shuffled regular — stable across games in the
  // session so playtime is distributed evenly.
  const lockedIn = session.attendees.filter(
    (id) => league.roster[id]?.lockedIn,
  );
  const regular = shuffle(
    session.attendees.filter((id) => !league.roster[id]?.lockedIn),
  );
  const ordered = [...lockedIn, ...regular];

  return session.games.map((game) => {
    const slots = game.hasLibero ? SLOTS_WITH_LIBERO : SLOTS_NO_LIBERO;

    const primary = selectPrimary(ordered, slots.length, players, league);
    const bench = ordered.filter((id) => !primary.includes(id));

    // Shuffle primary for random position assignment, then map to slots
    const shuffledPrimary = shuffle(primary);
    const willShare = bench.length > 0;
    const primaryAssignments: Assignment[] = shuffledPrimary.map((id, i) => ({
      playerId: id,
      position: slots[i],
      isSharing: willShare,
    }));

    // Bench players share slots cyclically
    const benchAssignments: Assignment[] = bench.map((id, i) => ({
      playerId: id,
      position: slots[i % slots.length],
      isSharing: true,
    }));

    return {
      ...game,
      assignments: [...primaryAssignments, ...benchAssignments],
      overrides: [],
    };
  });
}

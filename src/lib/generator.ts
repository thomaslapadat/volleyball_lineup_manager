import type {
  Assignment,
  GameLineup,
  League,
  Player,
  Position,
  Session,
} from '@/types';
import { PRIMARY_POSITIONS } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Selects players to fill available slots from the candidate pool.
 *
 * Rules applied in order:
 * 1. Locked-in players always play.
 * 2. Male players are capped at `maxMale` (female + other fill freely).
 *    Any male players beyond the cap are deferred.
 * 3. Remaining slots filled from the deferred male pool if needed.
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

  for (const id of deferredMale) {
    if (primary.length >= slotCount) break;
    primary.push(id);
  }

  return primary;
}

/**
 * Generates lineups for every game in the session, filling only the empty
 * primary position slots. Slots that already have a manual assignment are
 * left untouched. The libero overlay is handled separately and is never
 * assigned here.
 *
 * - Locked-in players always appear first in the candidate pool.
 * - Male players are capped (female + other fill slots first).
 * - Position assignment is random among the empty slots.
 */
export function generateLineups(
  session: Session,
  league: League,
  players: Record<string, Player>,
): GameLineup[] {
  if (session.attendees.length === 0) return session.games;

  const lockedIn = session.attendees.filter(
    (id) => league.roster[id]?.lockedIn,
  );
  const regular = shuffle(
    session.attendees.filter((id) => !league.roster[id]?.lockedIn),
  );
  const ordered = [...lockedIn, ...regular];

  return session.games.map((game) => {
    const existingPositions = new Set<Position>(
      game.assignments.map((a) => a.position),
    );
    const existingPlayerIds = new Set<string>(
      game.assignments.map((a) => a.playerId),
    );

    const emptySlots = PRIMARY_POSITIONS.filter(
      (p) => !existingPositions.has(p),
    );
    if (emptySlots.length === 0) return game;

    const availableCandidates = ordered.filter(
      (id) => !existingPlayerIds.has(id),
    );

    const selected = selectPrimary(
      availableCandidates,
      emptySlots.length,
      players,
      league,
    );
    const shuffled = shuffle(selected);

    const newAssignments: Assignment[] = emptySlots
      .map((pos, i) =>
        shuffled[i] !== undefined
          ? { playerId: shuffled[i], position: pos, isSharing: false }
          : null,
      )
      .filter((a): a is Assignment => a !== null);

    return {
      ...game,
      assignments: [...game.assignments, ...newAssignments],
    };
  });
}

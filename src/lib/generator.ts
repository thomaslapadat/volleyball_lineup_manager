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
 * Generates lineups for every game in the session.
 *
 * When `clearFirst` is false (default / "fill" mode): only empty primary
 * position slots are filled; existing assignments are preserved.
 *
 * When `clearFirst` is true ("reroll" mode): all non-locked assignments are
 * cleared first, then the full set of primary slots is filled fresh.
 *
 * Locked positions (Assignment.isLocked = true) are never touched by either
 * mode. The libero overlay is handled separately and is never assigned here.
 */
export function generateLineups(
  session: Session,
  league: League,
  players: Record<string, Player>,
  clearFirst = false,
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
    // In reroll mode keep only locked assignments; otherwise keep everything.
    const baseAssignments = clearFirst
      ? game.assignments.filter((a) => a.isLocked)
      : game.assignments;

    const existingPositions = new Set<Position>(
      baseAssignments.map((a) => a.position),
    );
    const existingPlayerIds = new Set<string>(
      baseAssignments.map((a) => a.playerId),
    );

    const emptySlots = PRIMARY_POSITIONS.filter(
      (p) => !existingPositions.has(p),
    );
    if (emptySlots.length === 0) {
      return { ...game, assignments: baseAssignments };
    }

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
      assignments: [...baseAssignments, ...newAssignments],
    };
  });
}

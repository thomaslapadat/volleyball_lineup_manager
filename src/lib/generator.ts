import type {
  Assignment,
  GameLineup,
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
 * 1. Male players are capped at `maxMale` (female players fill freely).
 *    Any male players beyond the cap are deferred.
 * 2. Remaining slots filled from the deferred male pool if needed.
 */
function selectPrimary(
  candidates: string[],
  slotCount: number,
  players: Record<string, Player>,
  maxMale = 4,
): string[] {
  if (candidates.length <= slotCount) return [...candidates];

  const isMale = (id: string) => players[id]?.gender === 'male';
  const available = shuffle(candidates);

  const primary: string[] = [];
  let maleCount = 0;
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
  players: Record<string, Player>,
  clearFirst = false,
): GameLineup[] {
  if (session.attendees.length === 0) return session.games;

  const ordered = shuffle(session.attendees);

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

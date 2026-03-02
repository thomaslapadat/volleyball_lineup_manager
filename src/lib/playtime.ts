import type { Assignment, GameLineup, PlaytimeSummary, Session } from '@/types';

/**
 * Resolves the effective assignments for a game by applying overrides on top
 * of generated assignments. An override for a player replaces their generated
 * assignment; override entries for positions act as the sole assignment for
 * that position.
 */
function getEffectiveAssignments(game: GameLineup): Assignment[] {
  const overriddenIds = new Set(game.overrides.map((o) => o.playerId));
  const base = game.assignments.filter((a) => !overriddenIds.has(a.playerId));
  const fromOverrides = game.overrides.map((o) => ({
    playerId: o.playerId,
    position: o.position,
    isSharing: false,
  }));
  return [...base, ...fromOverrides];
}

/**
 * Derives per-player playtime stats for a single session.
 *
 * gamesAttended = total games in the session (attendees are present the whole
 *                 session, not tracked per-game).
 * gamesPlayed   = games where the player appears in the effective lineup.
 * playtimeRate  = gamesPlayed / gamesAttended.
 */
export function computePlaytimeSummaries(session: Session): PlaytimeSummary[] {
  const { attendees, games } = session;
  return attendees.map((playerId) => {
    const gamesPlayed = games.filter((game) =>
      getEffectiveAssignments(game).some((a) => a.playerId === playerId),
    ).length;
    return {
      playerId,
      gamesAttended: games.length,
      gamesPlayed,
      playtimeRate: games.length > 0 ? gamesPlayed / games.length : 0,
    };
  });
}

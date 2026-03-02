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
 * Placeholder random lineup generator.
 *
 * Distributes attendees across position slots cyclically so that when more
 * players attend than there are slots, positions are shared (isSharing=true)
 * between alternating players.
 *
 * The `league` and `players` arguments are unused here but are part of the
 * interface so Stage 8 can replace this with a preference-aware algorithm
 * without changing call sites.
 */
export function generateLineups(
  session: Session,
  _league: League,
  _players: Record<string, Player>,
): GameLineup[] {
  return session.games.map((game) => {
    const slots = game.hasLibero ? SLOTS_WITH_LIBERO : SLOTS_NO_LIBERO;
    const shuffled = shuffle(session.attendees);

    // Bucket players into slot indices cyclically
    const buckets = new Map<number, string[]>();
    for (let i = 0; i < shuffled.length; i++) {
      const idx = i % slots.length;
      if (!buckets.has(idx)) buckets.set(idx, []);
      // biome-ignore lint/style/noNonNullAssertion: key was just inserted above
      buckets.get(idx)!.push(shuffled[i]);
    }

    const assignments: Assignment[] = [];
    for (const [idx, playerIds] of buckets) {
      const position = slots[idx];
      const isSharing = playerIds.length > 1;
      for (const playerId of playerIds) {
        assignments.push({ playerId, position, isSharing });
      }
    }

    return { ...game, assignments, overrides: [] };
  });
}

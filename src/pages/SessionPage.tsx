import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, RefreshCwIcon, ZapIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameCard } from '@/components/session/GameCard';
import { Button } from '@/components/ui/button';
import { generateLineups } from '@/lib/generator';
import { computePlaytimeSummaries } from '@/lib/playtime';
import { useAppStore } from '@/store/useAppStore';
import type { GameLineup } from '@/types';

const containerVariants = {
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function SessionPage() {
  const { leagueId, sessionId } = useParams<{
    leagueId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();

  const league = useAppStore((s) =>
    leagueId ? s.leagues[leagueId] : undefined,
  );
  const session = useAppStore((s) =>
    leagueId && sessionId
      ? s.leagues[leagueId]?.sessions[sessionId]
      : undefined,
  );
  const playersMap = useAppStore((s) => s.players);
  const saveSession = useAppStore((s) => s.saveSession);

  if (!league || !session) {
    return (
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Session not found.
      </div>
    );
  }

  // Narrowed refs so closures below see non-undefined types
  const currentLeague = league;
  const currentSession = session;

  const hasLineups = currentSession.games.some((g) => g.assignments.length > 0);
  const summaries = hasLineups ? computePlaytimeSummaries(currentSession) : [];

  function handleGenerate() {
    const updatedGames = generateLineups(
      currentSession,
      currentLeague,
      playersMap,
    );
    saveSession({ ...currentSession, games: updatedGames });
  }

  function handleUpdateGame(updatedGame: GameLineup) {
    const games = currentSession.games.map((g) =>
      g.id === updatedGame.id ? updatedGame : g,
    );
    saveSession({ ...currentSession, games });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(`/leagues/${currentLeague.id}`)}
          aria-label="Back to league"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{currentLeague.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(currentSession.date)}
          </p>
        </div>
      </div>

      {/* Generate / Regenerate */}
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleGenerate}>
          {hasLineups ? <RefreshCwIcon /> : <ZapIcon />}
          {hasLineups ? 'Regenerate' : 'Generate lineups'}
        </Button>
        {hasLineups && (
          <span className="text-xs text-muted-foreground">
            {currentSession.attendees.length} players ·{' '}
            {currentSession.games.length} games
          </span>
        )}
      </div>

      {/* Game cards (staggered in) */}
      {hasLineups && (
        <AnimatePresence>
          <motion.div
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {currentSession.games.map((game, i) => (
              <motion.div key={game.id} variants={cardVariants}>
                <GameCard
                  game={game}
                  gameNumber={i + 1}
                  attendees={currentSession.attendees}
                  players={playersMap}
                  onUpdateGame={handleUpdateGame}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Playtime summary */}
      {hasLineups && summaries.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Playtime
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Player
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                    Games
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...summaries]
                  .sort((a, b) => b.playtimeRate - a.playtimeRate)
                  .map((s) => (
                    <tr key={s.playerId}>
                      <td className="px-4 py-2 font-medium">
                        {playersMap[s.playerId]?.name ?? s.playerId}
                      </td>
                      <td className="px-4 py-2 text-center tabular-nums">
                        {s.gamesPlayed}/{s.gamesAttended}
                      </td>
                      <td className="px-4 py-2 text-center tabular-nums">
                        {Math.round(s.playtimeRate * 100)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

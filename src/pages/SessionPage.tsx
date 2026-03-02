import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import { ArrowLeftIcon, ShuffleIcon, Trash2Icon, ZapIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AttendeePanel } from '@/components/session/AttendeePanel';
import { GameBox } from '@/components/session/GameBox';
import { PlayerAvatar } from '@/components/session/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { generateLineups } from '@/lib/generator';
import { computePlaytimeSummaries } from '@/lib/playtime';
import { useAppStore } from '@/store/useAppStore';
import type { Assignment, GameLineup, Player, Position } from '@/types';
import { PRIMARY_POSITIONS } from '@/types';

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

  const [activeDragPlayer, setActiveDragPlayer] = useState<Player | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  if (!league || !session) {
    return (
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Session not found.
      </div>
    );
  }

  const currentLeague = league;
  const currentSession = session;

  const hasLineups = currentSession.games.some((g) => g.assignments.length > 0);
  const allFilled =
    currentSession.games.length > 0 &&
    currentSession.games.every((g) =>
      PRIMARY_POSITIONS.every((p) =>
        g.assignments.some((a) => a.position === p),
      ),
    );
  const summaries = computePlaytimeSummaries(currentSession);

  function handleReroll() {
    const updatedGames = generateLineups(
      currentSession,
      currentLeague,
      playersMap,
      true,
    );
    saveSession({ ...currentSession, games: updatedGames });
  }

  function handleClear() {
    const games = currentSession.games.map((g) => ({ ...g, assignments: [] }));
    saveSession({ ...currentSession, games });
  }

  function handleToggleLock(gameId: string, position: Position) {
    const games = currentSession.games.map((g) => {
      if (g.id !== gameId) return g;
      const assignments = g.assignments.map((a) =>
        a.position === position ? { ...a, isLocked: !a.isLocked } : a,
      );
      return { ...g, assignments };
    });
    saveSession({ ...currentSession, games });
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === 'attendee') {
      const player = playersMap[data.playerId as string];
      if (player) setActiveDragPlayer(player);
    } else if (data?.type === 'position') {
      const player = playersMap[data.playerId as string];
      if (player) setActiveDragPlayer(player);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragPlayer(null);
    const { active, over } = event;
    const activeData = active.data.current;
    const overData = over?.data.current;

    // ── Attendee → slot ──────────────────────────────────────────────────────
    if (activeData?.type === 'attendee' && overData?.type === 'slot') {
      const playerId = activeData.playerId as string;
      const gameId = overData.gameId as string;
      const position = overData.position as Position;

      // Refuse to drop onto a locked slot
      const targetGame = currentSession.games.find((g) => g.id === gameId);
      if (
        targetGame?.assignments.find((a) => a.position === position)?.isLocked
      ) {
        return;
      }

      const games = currentSession.games.map((g) => {
        if (g.id !== gameId) return g;
        const filtered = g.assignments.filter(
          (a) => a.position !== position && a.playerId !== playerId,
        );
        return {
          ...g,
          assignments: [
            ...filtered,
            { playerId, position, isSharing: false } satisfies Assignment,
          ],
        };
      });
      saveSession({ ...currentSession, games });
      return;
    }

    // ── Position → slot (move or swap) ───────────────────────────────────────
    if (activeData?.type === 'position' && overData?.type === 'slot') {
      const playerId = activeData.playerId as string;
      const fromGameId = activeData.gameId as string;
      const fromPos = activeData.fromPosition as Position;
      const toGameId = overData.gameId as string;
      const toPos = overData.position as Position;

      if (fromGameId === toGameId && fromPos === toPos) return; // same slot

      // Refuse to drop onto a locked slot
      const targetGame = currentSession.games.find((g) => g.id === toGameId);
      const targetAssignment = targetGame?.assignments.find(
        (a) => a.position === toPos,
      );
      if (targetAssignment?.isLocked) return;

      const displacedPlayerId = targetAssignment?.playerId;
      const displacedIsLocked = targetAssignment?.isLocked;

      const games = currentSession.games.map((g) => {
        if (fromGameId === toGameId) {
          // Same game: swap the two positions
          if (g.id !== fromGameId) return g;
          const filtered = g.assignments.filter(
            (a) => a.position !== fromPos && a.position !== toPos,
          );
          const next: Assignment[] = [
            ...filtered,
            { playerId, position: toPos, isSharing: false },
          ];
          // Put the displaced player (if any) into the vacated position
          if (displacedPlayerId && !displacedIsLocked) {
            next.push({
              playerId: displacedPlayerId,
              position: fromPos,
              isSharing: false,
            });
          }
          return { ...g, assignments: next };
        }
        // Cross-game: remove from source, place in target (no swap)
        if (g.id === fromGameId) {
          return {
            ...g,
            assignments: g.assignments.filter((a) => a.position !== fromPos),
          };
        }
        if (g.id === toGameId) {
          const filtered = g.assignments.filter(
            (a) => a.position !== toPos && a.playerId !== playerId,
          );
          return {
            ...g,
            assignments: [
              ...filtered,
              { playerId, position: toPos, isSharing: false },
            ],
          };
        }
        return g;
      });
      saveSession({ ...currentSession, games });
      return;
    }

    // ── Position → nowhere (unassign) ────────────────────────────────────────
    if (activeData?.type === 'position' && !over) {
      const fromGameId = activeData.gameId as string;
      const fromPos = activeData.fromPosition as Position;
      const games = currentSession.games.map((g) => {
        if (g.id !== fromGameId) return g;
        return {
          ...g,
          assignments: g.assignments.filter((a) => a.position !== fromPos),
        };
      });
      saveSession({ ...currentSession, games });
      return;
    }

    // ── Game → game (reorder) ────────────────────────────────────────────────
    if (activeData?.type === 'game' && overData?.type === 'game') {
      const oldIndex = currentSession.games.findIndex(
        (g) => g.id === String(active.id),
      );
      const newIndex = currentSession.games.findIndex(
        (g) => g.id === String(over?.id),
      );
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        saveSession({
          ...currentSession,
          games: arrayMove(currentSession.games, oldIndex, newIndex),
        });
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

      {/* Action bar */}
      <div className="mt-4 flex items-center gap-2">
        <Button onClick={handleReroll}>
          {allFilled ? <ShuffleIcon /> : <ZapIcon />}
          {allFilled ? 'Reroll' : 'Generate'}
        </Button>
        {hasLineups && (
          <Button variant="outline" onClick={handleClear}>
            <Trash2Icon />
            Clear
          </Button>
        )}
        {hasLineups && (
          <span className="ml-1 text-xs text-muted-foreground">
            {currentSession.attendees.length} players ·{' '}
            {currentSession.games.length} games
          </span>
        )}
      </div>

      {/* Main layout: attendees left, games right */}
      <div className="mt-6 flex gap-6 items-start">
        {/* Attendees panel */}
        <div className="w-52 shrink-0 rounded-lg border border-border overflow-hidden">
          <AttendeePanel
            attendees={currentSession.attendees}
            players={playersMap}
          />
        </div>

        {/* Games grid */}
        <div className="flex-1 min-w-0">
          <SortableContext
            items={currentSession.games.map((g) => g.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {currentSession.games.map((game: GameLineup, i: number) => (
                <GameBox
                  key={game.id}
                  game={game}
                  gameNumber={i + 1}
                  players={playersMap}
                  onToggleLock={(pos) => handleToggleLock(game.id, pos)}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>

      {/* Playtime summary */}
      {summaries.length > 0 && (
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

      {/* Drag overlay — avatar shown under cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeDragPlayer ? (
          <PlayerAvatar player={activeDragPlayer} size="md" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

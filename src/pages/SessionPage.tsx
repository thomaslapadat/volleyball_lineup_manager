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
import { ArrowLeftIcon, RefreshCwIcon, ZapIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AttendeePanel } from '@/components/session/AttendeePanel';
import { GameBox } from '@/components/session/GameBox';
import { PlayerAvatar } from '@/components/session/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { generateLineups } from '@/lib/generator';
import { computePlaytimeSummaries } from '@/lib/playtime';
import { useAppStore } from '@/store/useAppStore';
import type { GameLineup, Position } from '@/types';

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

  const [activeDragPlayerId, setActiveDragPlayerId] = useState<string | null>(
    null,
  );

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
  const summaries = hasLineups ? computePlaytimeSummaries(currentSession) : [];

  // Player IDs that currently occupy a slot in any game
  const assignedPlayerIds = new Set<string>(
    currentSession.games.flatMap((g) => g.assignments.map((a) => a.playerId)),
  );

  function handleGenerate() {
    const updatedGames = generateLineups(
      currentSession,
      currentLeague,
      playersMap,
    );
    saveSession({ ...currentSession, games: updatedGames });
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === 'attendee') {
      setActiveDragPlayerId(data.playerId as string);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragPlayerId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'attendee' && overData?.type === 'slot') {
      const playerId = activeData.playerId as string;
      const gameId = overData.gameId as string;
      const position = overData.position as Position;

      const games = currentSession.games.map((g) => {
        if (g.id !== gameId) return g;
        // Remove any existing assignment at the target position and any
        // existing assignment for this player (one slot per player per game)
        const filtered = g.assignments.filter(
          (a) => a.position !== position && a.playerId !== playerId,
        );
        return {
          ...g,
          assignments: [...filtered, { playerId, position, isSharing: false }],
        };
      });
      saveSession({ ...currentSession, games });
      return;
    }

    if (activeData?.type === 'game' && overData?.type === 'game') {
      const oldIndex = currentSession.games.findIndex(
        (g) => g.id === String(active.id),
      );
      const newIndex = currentSession.games.findIndex(
        (g) => g.id === String(over.id),
      );
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        saveSession({
          ...currentSession,
          games: arrayMove(currentSession.games, oldIndex, newIndex),
        });
      }
    }
  }

  const activeDragPlayer = activeDragPlayerId
    ? playersMap[activeDragPlayerId]
    : null;

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

      {/* Generate button */}
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleGenerate}>
          {hasLineups ? <RefreshCwIcon /> : <ZapIcon />}
          {hasLineups ? 'Fill remaining slots' : 'Generate lineups'}
        </Button>
        {hasLineups && (
          <span className="text-xs text-muted-foreground">
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
            summaries={summaries}
            assignedPlayerIds={assignedPlayerIds}
          />
        </div>

        {/* Games grid */}
        <div className="flex-1 min-w-0">
          <SortableContext
            items={currentSession.games.map((g) => g.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentSession.games.map((game: GameLineup, i: number) => (
                <GameBox
                  key={game.id}
                  game={game}
                  gameNumber={i + 1}
                  players={playersMap}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>

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

      {/* Drag overlay — avatar shown under cursor while dragging an attendee */}
      <DragOverlay dropAnimation={null}>
        {activeDragPlayer ? (
          <PlayerAvatar player={activeDragPlayer} size="md" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

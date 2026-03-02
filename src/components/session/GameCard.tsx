import { PencilIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GameLineup, Player, Position } from '@/types';

const POSITION_LABELS: Record<Position, string> = {
  setter: 'Setter',
  opposite: 'Opposite',
  power: 'Power',
  middle: 'Middle',
  libero: 'Libero',
};

const DISPLAY_ORDER: Position[] = [
  'setter',
  'opposite',
  'power',
  'middle',
  'libero',
];

/**
 * Returns the players assigned to a position, with override taking precedence
 * over generated assignments. Override always collapses to a single player;
 * generated assignments may contain multiple sharing players.
 */
function getPlayersAtPosition(
  game: GameLineup,
  position: Position,
): { playerId: string; isOverride: boolean }[] {
  const override = game.overrides.find((o) => o.position === position);
  if (override) {
    return [{ playerId: override.playerId, isOverride: true }];
  }
  return game.assignments
    .filter((a) => a.position === position)
    .map((a) => ({ playerId: a.playerId, isOverride: false }));
}

interface GameCardProps {
  game: GameLineup;
  gameNumber: number;
  attendees: string[];
  players: Record<string, Player>;
  onUpdateGame: (updated: GameLineup) => void;
}

export function GameCard({
  game,
  gameNumber,
  attendees,
  players,
  onUpdateGame,
}: GameCardProps) {
  const [overridePosition, setOverridePosition] = useState<Position | null>(
    null,
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const positionsToShow = DISPLAY_ORDER.filter(
    (p) => p !== 'libero' || game.hasLibero,
  );

  function openOverride(position: Position) {
    const current = getPlayersAtPosition(game, position);
    setOverridePosition(position);
    setSelectedPlayerId(current[0]?.playerId ?? null);
  }

  function handleApply() {
    if (!overridePosition || !selectedPlayerId) return;
    const filtered = game.overrides.filter(
      (o) => o.position !== overridePosition,
    );
    onUpdateGame({
      ...game,
      overrides: [
        ...filtered,
        { playerId: selectedPlayerId, position: overridePosition },
      ],
    });
    setOverridePosition(null);
    setSelectedPlayerId(null);
  }

  function handleClearOverride(position: Position) {
    onUpdateGame({
      ...game,
      overrides: game.overrides.filter((o) => o.position !== position),
    });
  }

  function handleClose() {
    setOverridePosition(null);
    setSelectedPlayerId(null);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <h3 className="text-sm font-semibold">Game {gameNumber}</h3>
        {game.hasLibero && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Libero
          </span>
        )}
        {game.overrides.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {game.overrides.length} override
            {game.overrides.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Position rows */}
      <ul className="divide-y divide-border">
        {positionsToShow.map((position) => {
          const entries = getPlayersAtPosition(game, position);
          const hasOverride = game.overrides.some(
            (o) => o.position === position,
          );
          return (
            <li key={position} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">
                {POSITION_LABELS[position]}
              </span>
              <div className="flex flex-1 flex-wrap gap-x-2 gap-y-0.5">
                {entries.length > 0 ? (
                  entries.map(({ playerId, isOverride }) => (
                    <span
                      key={playerId}
                      className={`text-sm font-medium ${isOverride ? 'text-primary' : ''}`}
                    >
                      {players[playerId]?.name ?? '?'}
                    </span>
                  ))
                ) : (
                  <span className="text-sm italic text-muted-foreground">
                    —
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5">
                {hasOverride && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleClearOverride(position)}
                    aria-label={`Clear ${POSITION_LABELS[position]} override`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XIcon />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openOverride(position)}
                  aria-label={`Override ${POSITION_LABELS[position]}`}
                >
                  <PencilIcon />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Override dialog */}
      <Dialog
        open={overridePosition !== null}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-xs" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              Override{' '}
              {overridePosition ? POSITION_LABELS[overridePosition] : ''}
            </DialogTitle>
          </DialogHeader>
          <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-md border border-border">
            {attendees.map((playerId) => {
              const isSelected = selectedPlayerId === playerId;
              return (
                <li key={playerId}>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayerId(playerId)}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {players[playerId]?.name ?? playerId}
                  </button>
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={!selectedPlayerId}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

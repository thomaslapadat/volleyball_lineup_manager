import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon } from 'lucide-react';
import { PositionCircle } from '@/components/session/PositionCircle';
import type { GameLineup, Player, Position } from '@/types';

/**
 * Court layout — 2 rows × 3 cols:
 *   Front row: middle1 | power1  | setter
 *   Back row:  opposite| power2  | middle2
 */
const LAYOUT: [Position, Position, Position][] = [
  ['middle1', 'power1', 'setter'],
  ['opposite', 'power2', 'middle2'],
];

interface GameBoxProps {
  game: GameLineup;
  gameNumber: number;
  players: Record<string, Player>;
  onToggleLock: (position: Position) => void;
}

export function GameBox({
  game,
  gameNumber,
  players,
  onToggleLock,
}: GameBoxProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.id, data: { type: 'game' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function assignmentAt(position: Position) {
    return game.assignments.find((a) => a.position === position);
  }

  function playerAt(position: Position): Player | undefined {
    const a = assignmentAt(position);
    return a ? players[a.playerId] : undefined;
  }

  function isLockedAt(position: Position): boolean {
    return assignmentAt(position)?.isLocked === true;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder Game ${gameNumber}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">Game {gameNumber}</span>
      </div>

      {/* Position grid */}
      <div className="px-6 py-5 space-y-5">
        {LAYOUT.map((row, rowIdx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable layout rows
          <div key={rowIdx} className="flex justify-center gap-6">
            {row.map((position) => (
              <PositionCircle
                key={position}
                position={position}
                gameId={game.id}
                player={playerAt(position)}
                isLocked={isLockedAt(position)}
                onToggleLock={() => onToggleLock(position)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

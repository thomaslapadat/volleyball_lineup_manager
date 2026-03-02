import { useDroppable } from '@dnd-kit/core';
import { PlayerAvatar } from '@/components/session/PlayerAvatar';
import type { Player, Position } from '@/types';

const POSITION_LABEL: Record<Position, string> = {
  setter: 'SE',
  opposite: 'OP',
  power1: 'P1',
  power2: 'P2',
  middle1: 'M1',
  middle2: 'M2',
  libero: 'LB',
};

interface PositionCircleProps {
  position: Position;
  gameId: string;
  player: Player | undefined;
}

export function PositionCircle({
  position,
  gameId,
  player,
}: PositionCircleProps) {
  const id = `slot-${gameId}-${position}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'slot', gameId, position },
  });

  return (
    <div className="relative inline-flex">
      {/* Primary position circle */}
      <div
        ref={setNodeRef}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          player
            ? ''
            : isOver
              ? 'border-2 border-primary border-dashed bg-primary/10'
              : 'border-2 border-dashed border-border bg-muted/30'
        } ${isOver && player ? 'ring-2 ring-primary ring-offset-1' : ''}`}
        style={player ? { backgroundColor: player.color } : undefined}
      >
        {player ? (
          <PlayerAvatar player={player} size="sm" />
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground">
            {POSITION_LABEL[position]}
          </span>
        )}
      </div>

      {/* Libero overlay — half-size circle in the bottom-right corner */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background bg-muted" />
    </div>
  );
}

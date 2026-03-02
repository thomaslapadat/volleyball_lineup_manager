import { useDraggable, useDroppable } from '@dnd-kit/core';
import { LockIcon, UserIcon } from 'lucide-react';
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
  isLocked: boolean;
  onToggleLock: () => void;
}

export function PositionCircle({
  position,
  gameId,
  player,
  isLocked,
  onToggleLock,
}: PositionCircleProps) {
  const dropId = `slot-${gameId}-${position}`;
  const dragId = `position-${gameId}-${position}`;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { type: 'slot', gameId, position },
  });

  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: {
      type: 'position',
      gameId,
      fromPosition: position,
      playerId: player?.id,
    },
    disabled: !player || isLocked,
  });

  // Merge both refs onto the same circle element
  const mergedRef = (node: HTMLButtonElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  // Only highlight as a drop target when not locked
  const showAsDropTarget = isOver && !isLocked;

  // When this circle's player is actively being dragged, show the empty slot
  const showEmpty = isDragging || !player;

  return (
    <div className="relative inline-flex">
      {/* Main position circle — both drag source and drop target */}
      <button
        type="button"
        ref={mergedRef}
        style={!showEmpty && player ? { backgroundColor: player.color } : {}}
        className={[
          'w-[72px] h-[72px] rounded-full flex items-center justify-center transition-colors select-none bg-transparent p-0 border-0',
          // Empty / dragging state
          showEmpty
            ? showAsDropTarget
              ? 'border-2 border-primary border-dashed bg-primary/10'
              : 'border-2 border-dashed border-border bg-muted/30'
            : '',
          // Drop highlight on filled circles
          showAsDropTarget && !showEmpty
            ? 'ring-2 ring-primary ring-offset-1'
            : '',
          // Lock: partial desaturation — keeps colour visible but muted
          isLocked ? 'saturate-[30%] brightness-90' : '',
          // Drag cursor when draggable
          player && !isLocked ? 'cursor-grab active:cursor-grabbing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDoubleClick={player ? onToggleLock : undefined}
        {...attributes}
        {...(player && !isLocked ? listeners : {})}
      >
        {showEmpty ? (
          <UserIcon
            className="h-8 w-8 text-muted-foreground"
            strokeWidth={1.5}
          />
        ) : player ? (
          <PlayerAvatar player={player} size="lg" />
        ) : null}
      </button>

      {/* Position label badge — top-right corner */}
      <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm pointer-events-none">
        <span className="text-[9px] font-bold text-foreground leading-none">
          {POSITION_LABEL[position]}
        </span>
      </div>

      {/* Lock badge — top-left corner */}
      {isLocked && (
        <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm pointer-events-none">
          <LockIcon className="h-3.5 w-3.5 text-foreground" strokeWidth={3} />
        </div>
      )}

      {/* Libero overlay — bottom-right corner */}
      <div className="absolute -bottom-1 -right-1 w-[38px] h-[38px] rounded-full border-2 border-background bg-muted" />
    </div>
  );
}

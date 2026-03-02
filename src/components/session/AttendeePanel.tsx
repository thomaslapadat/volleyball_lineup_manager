import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PlayerAvatar } from '@/components/session/PlayerAvatar';
import type { Player } from '@/types';

const GENDER_LABEL: Record<Player['gender'], string> = {
  female: 'F',
  male: 'M',
  other: 'O',
};

interface DraggableAvatarProps {
  player: Player;
}

function DraggableAvatar({ player }: DraggableAvatarProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `attendee-${player.id}`,
      data: { type: 'attendee', playerId: player.id },
    });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className="shrink-0 cursor-grab p-0 bg-transparent border-0 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <PlayerAvatar player={player} size="md" />
    </button>
  );
}

interface AttendeeRowProps {
  player: Player;
}

function AttendeeRow({ player }: AttendeeRowProps) {
  return (
    <li className="flex items-center gap-2.5 px-3 py-2">
      <DraggableAvatar player={player} />
      <span className="flex-1 min-w-0 text-sm font-medium truncate">
        {player.name}
      </span>
      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
        {GENDER_LABEL[player.gender]}
      </span>
    </li>
  );
}

interface AttendeePanelProps {
  attendees: string[];
  players: Record<string, Player>;
}

export function AttendeePanel({ attendees, players }: AttendeePanelProps) {
  const sorted = [...attendees].sort((a, b) => {
    const nameA = players[a]?.name ?? '';
    const nameB = players[b]?.name ?? '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="flex flex-col">
      <h2 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
        Players ({attendees.length})
      </h2>
      <ul className="divide-y divide-border">
        {sorted.map((playerId) => {
          const player = players[playerId];
          if (!player) return null;
          return <AttendeeRow key={playerId} player={player} />;
        })}
      </ul>
    </div>
  );
}

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PlayerAvatar } from '@/components/session/PlayerAvatar';
import type { Player, PlaytimeSummary } from '@/types';

const GENDER_LABEL: Record<Player['gender'], string> = {
  female: 'F',
  male: 'M',
  other: 'O',
};

interface AttendeeRowProps {
  player: Player;
  summary: PlaytimeSummary | undefined;
  isAssigned: boolean;
}

function AttendeeRow({ player, summary, isAssigned }: AttendeeRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `attendee-${player.id}`,
      data: { type: 'attendee', playerId: player.id },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const playtimePercent =
    summary && summary.gamesAttended > 0
      ? Math.round((summary.gamesPlayed / summary.gamesAttended) * 100)
      : 0;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 px-3 py-2 cursor-grab active:cursor-grabbing transition-opacity ${
        isAssigned ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <PlayerAvatar player={player} size="md" />
      <span className="flex-1 min-w-0 text-sm font-medium truncate">
        {player.name}
      </span>
      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
        {GENDER_LABEL[player.gender]}
      </span>
      <span className="shrink-0 w-9 text-right text-xs tabular-nums text-muted-foreground">
        {playtimePercent}%
      </span>
    </li>
  );
}

interface AttendeePanelProps {
  attendees: string[];
  players: Record<string, Player>;
  summaries: PlaytimeSummary[];
  assignedPlayerIds: Set<string>;
}

export function AttendeePanel({
  attendees,
  players,
  summaries,
  assignedPlayerIds,
}: AttendeePanelProps) {
  const summaryMap = new Map(summaries.map((s) => [s.playerId, s]));

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
          return (
            <AttendeeRow
              key={playerId}
              player={player}
              summary={summaryMap.get(playerId)}
              isAssigned={assignedPlayerIds.has(playerId)}
            />
          );
        })}
      </ul>
    </div>
  );
}

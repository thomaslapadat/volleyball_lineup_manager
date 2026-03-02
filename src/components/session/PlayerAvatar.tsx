import type { Player } from '@/types';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-9 h-9 text-xs',
} as const;

interface PlayerAvatarProps {
  player: Player;
  size?: keyof typeof SIZE_CLASSES;
}

export function PlayerAvatar({ player, size = 'md' }: PlayerAvatarProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} shrink-0 rounded-full flex items-center justify-center font-semibold text-white select-none`}
      style={{ backgroundColor: player.color ?? '#6366f1' }}
      title={player.name}
    >
      {getInitials(player.name)}
    </div>
  );
}

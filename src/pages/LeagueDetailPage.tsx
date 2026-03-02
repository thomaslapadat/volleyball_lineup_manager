import { ArrowLeftIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AddRosterMemberDialog } from '@/components/leagues/AddRosterMemberDialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import type { Position } from '@/types';

const POSITION_LABELS: Record<Position, string> = {
  setter: 'Set',
  opposite: 'Opp',
  power: 'Pow',
  middle: 'Mid',
  libero: 'Lib',
};

const ALL_POSITIONS: Position[] = [
  'setter',
  'opposite',
  'power',
  'middle',
  'libero',
];

export function LeagueDetailPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  const league = useAppStore((s) =>
    leagueId ? s.leagues[leagueId] : undefined,
  );
  const playersMap = useAppStore((s) => s.players);
  const updateLeaguePlayer = useAppStore((s) => s.updateLeaguePlayer);
  const removePlayerFromLeague = useAppStore((s) => s.removePlayerFromLeague);

  if (!league) {
    return (
      <div className="mt-8 text-center text-sm text-muted-foreground">
        League not found.
      </div>
    );
  }

  const rosterEntries = Object.values(league.roster);

  function togglePreference(playerId: string, position: Position) {
    const current = league!.roster[playerId].preferences;
    const next = current.includes(position)
      ? current.filter((p) => p !== position)
      : [...current, position];
    updateLeaguePlayer(league!.id, playerId, { preferences: next });
  }

  function toggleLockedIn(playerId: string) {
    const current = league!.roster[playerId].lockedIn;
    updateLeaguePlayer(league!.id, playerId, { lockedIn: !current });
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate('/leagues')}
          aria-label="Back to leagues"
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-2xl font-semibold">{league.name}</h1>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Roster ({rosterEntries.length})
        </h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add player
        </Button>
      </div>

      {rosterEntries.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No players yet. Add players to build your roster.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {rosterEntries.map(({ playerId, preferences, lockedIn }) => {
            const player = playersMap[playerId];
            if (!player) return null;
            return (
              <li
                key={playerId}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="w-32 font-medium text-foreground">
                  {player.name}
                </span>

                <div className="flex flex-1 flex-wrap gap-1">
                  {ALL_POSITIONS.map((pos) => {
                    const active = preferences.includes(pos);
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => togglePreference(playerId, pos)}
                        className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {POSITION_LABELS[pos]}
                      </button>
                    );
                  })}
                </div>

                <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={lockedIn}
                    onChange={() => toggleLockedIn(playerId)}
                    className="accent-primary"
                  />
                  Locked
                </label>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removePlayerFromLeague(league.id, playerId)}
                  aria-label={`Remove ${player.name} from roster`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AddRosterMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        league={league}
      />
    </div>
  );
}

import { ArrowLeftIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import type { GameLineup, Session } from '@/types';

export function SessionSetupPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

  const league = useAppStore((s) =>
    leagueId ? s.leagues[leagueId] : undefined,
  );
  const playersMap = useAppStore((s) => s.players);
  const saveSession = useAppStore((s) => s.saveSession);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [gameCount, setGameCount] = useState(3);
  const [attendees, setAttendees] = useState<Set<string>>(new Set());
  const [liberoPerGame, setLiberoPerGame] = useState<boolean[]>([
    true,
    true,
    true,
  ]);

  // Default all roster players to attending
  useEffect(() => {
    if (league) {
      setAttendees(new Set(Object.keys(league.roster)));
    }
  }, [league]);

  // Sync liberoPerGame array length with gameCount
  useEffect(() => {
    setLiberoPerGame((prev) => {
      if (prev.length === gameCount) return prev;
      const next = [...prev];
      while (next.length < gameCount) next.push(true);
      return next.slice(0, gameCount);
    });
  }, [gameCount]);

  if (!league) {
    return (
      <div className="mt-8 text-center text-sm text-muted-foreground">
        League not found.
      </div>
    );
  }

  const rosterPlayers = Object.keys(league.roster)
    .map((id) => playersMap[id])
    .filter(Boolean);

  function toggleAttendee(playerId: string) {
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  function toggleAllAttendees() {
    if (attendees.size === rosterPlayers.length) {
      setAttendees(new Set());
    } else {
      setAttendees(new Set(rosterPlayers.map((p) => p.id)));
    }
  }

  function toggleLibero(index: number) {
    setLiberoPerGame((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    const games: GameLineup[] = Array.from({ length: gameCount }, (_, i) => ({
      id: crypto.randomUUID(),
      hasLibero: liberoPerGame[i] ?? false,
      assignments: [],
      overrides: [],
    }));
    const session: Session = {
      id,
      leagueId: league.id,
      date,
      attendees: [...attendees],
      games,
    };
    saveSession(session);
    navigate(`/leagues/${league.id}/session/${id}`);
  }

  const allSelected = attendees.size === rosterPlayers.length;

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(`/leagues/${league.id}`)}
          aria-label="Back to league"
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New session</h1>
          <p className="text-sm text-muted-foreground">{league.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-8">
        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="session-date">Date</Label>
          <Input
            id="session-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Game count */}
        <div className="space-y-1.5">
          <Label>Number of games</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setGameCount((n) => Math.max(1, n - 1))}
              aria-label="Decrease"
            >
              <MinusIcon />
            </Button>
            <span className="w-8 text-center font-semibold tabular-nums">
              {gameCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setGameCount((n) => Math.min(10, n + 1))}
              aria-label="Increase"
            >
              <PlusIcon />
            </Button>
          </div>
        </div>

        {/* Attendees */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Attendees ({attendees.size} / {rosterPlayers.length})
            </Label>
            <button
              type="button"
              onClick={toggleAllAttendees}
              className="text-xs text-primary hover:underline"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          {rosterPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No players on this roster yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {rosterPlayers.map((player) => {
                const isAttending = attendees.has(player.id);
                return (
                  <li key={player.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={isAttending}
                        onChange={() => toggleAttendee(player.id)}
                        className="accent-primary"
                      />
                      <span className="flex-1 text-sm font-medium">
                        {player.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Libero per game */}
        <div className="space-y-2">
          <Label>Libero</Label>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {Array.from({ length: gameCount }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable index for game slots
              <li key={i}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={liberoPerGame[i] ?? false}
                    onChange={() => toggleLibero(i)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Game {i + 1}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/leagues/${league.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={attendees.size === 0}>
            Start session
          </Button>
        </div>
      </form>
    </div>
  );
}

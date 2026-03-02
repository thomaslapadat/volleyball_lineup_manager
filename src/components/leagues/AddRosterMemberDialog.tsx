import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/useAppStore';
import type { League } from '@/types';

const GENDER_LABEL = { female: 'F', male: 'M', other: '—' } as const;

interface AddRosterMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league: League;
}

export function AddRosterMemberDialog({
  open,
  onOpenChange,
  league,
}: AddRosterMemberDialogProps) {
  const playersMap = useAppStore((s) => s.players);
  const addPlayerToLeague = useAppStore((s) => s.addPlayerToLeague);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const available = Object.values(playersMap).filter(
    (p) => !(p.id in league.roster),
  );

  function handleAdd() {
    if (!selectedId) return;
    addPlayerToLeague(league.id, selectedId);
    setSelectedId(null);
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) setSelectedId(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add player to roster</DialogTitle>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            All players are already on this roster.
          </p>
        ) : (
          <ul className="max-h-60 overflow-y-auto divide-y divide-border rounded-md border border-border">
            {available.map((player) => {
              const isSelected = selectedId === player.id;
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(player.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{player.name}</span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {GENDER_LABEL[player.gender]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!selectedId || available.length === 0}
          >
            Add to roster
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

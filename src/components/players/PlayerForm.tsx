import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import type { Player } from '@/types';

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player; // undefined = create mode, defined = edit mode
}

export function PlayerForm({ open, onOpenChange, player }: PlayerFormProps) {
  const addPlayer = useAppStore((s) => s.addPlayer);
  const updatePlayer = useAppStore((s) => s.updatePlayer);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Player['gender'] | ''>('');
  const [error, setError] = useState('');

  // Sync form state when the dialog opens or the target player changes
  useEffect(() => {
    if (open) {
      setName(player?.name ?? '');
      setGender(player?.gender ?? '');
      setError('');
    }
  }, [open, player]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required.');
      return;
    }
    if (!gender) {
      setError('Gender is required.');
      return;
    }
    if (player) {
      updatePlayer(player.id, { name: trimmed, gender });
    } else {
      addPlayer(trimmed, gender);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{player ? 'Edit player' : 'Add player'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="player-name">Name</Label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Alex Smith"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="player-gender">Gender</Label>
            <select
              id="player-gender"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as Player['gender'] | '');
                setError('');
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {player ? 'Save changes' : 'Add player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

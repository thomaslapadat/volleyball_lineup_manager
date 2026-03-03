import { AnimatePresence, motion } from 'framer-motion';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/useAppStore';
import type { Player } from '@/types';

const GENDER_LABEL: Record<Player['gender'], string> = {
  female: 'Female',
  male: 'Male',
};

const listVariants = {
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

interface PlayerListProps {
  onEdit: (player: Player) => void;
}

export function PlayerList({ onEdit }: PlayerListProps) {
  const playersMap = useAppStore((s) => s.players);
  const players = Object.values(playersMap);
  const deletePlayer = useAppStore((s) => s.deletePlayer);
  const leaguesMap = useAppStore((s) => s.leagues);
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null);

  if (players.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-muted-foreground">
        No players yet. Add your first player to get started.
      </p>
    );
  }

  const rosterLeagueCount = pendingDelete
    ? Object.values(leaguesMap).filter((l) => pendingDelete.id in l.roster)
        .length
    : 0;

  return (
    <>
      <motion.ul
        className="mt-4 divide-y divide-border rounded-lg border border-border"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence initial={false}>
          {players.map((player) => (
            <motion.li
              key={player.id}
              variants={itemVariants}
              exit="exit"
              layout
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">
                  {player.name}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {GENDER_LABEL[player.gender]}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(player)}
                  aria-label={`Edit ${player.name}`}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPendingDelete(player)}
                  aria-label={`Delete ${player.name}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{pendingDelete?.name}"?</DialogTitle>
            <DialogDescription>
              {rosterLeagueCount > 0
                ? `This will also remove them from ${rosterLeagueCount} league roster${rosterLeagueCount > 1 ? 's' : ''}. `
                : ''}
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deletePlayer(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { PencilIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { League } from '@/types';

const listVariants = {
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

interface LeagueListProps {
  onEdit: (league: League) => void;
}

export function LeagueList({ onEdit }: LeagueListProps) {
  const leaguesMap = useAppStore((s) => s.leagues);
  const leagues = Object.values(leaguesMap);
  const deleteLeague = useAppStore((s) => s.deleteLeague);
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<League | null>(null);

  if (leagues.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-muted-foreground">
        No leagues yet. Add your first league to get started.
      </p>
    );
  }

  const rosterCount = pendingDelete
    ? Object.keys(pendingDelete.roster).length
    : 0;
  const sessionCount = pendingDelete
    ? Object.keys(pendingDelete.sessions).length
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
          {leagues.map((league) => {
            const count = Object.keys(league.roster).length;
            return (
              <motion.li
                key={league.id}
                variants={itemVariants}
                exit="exit"
                layout
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    {league.name}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {count} {count === 1 ? 'player' : 'players'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigate(`/leagues/${league.id}`)}
                    aria-label={`Manage ${league.name} roster`}
                  >
                    <UsersIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(league)}
                    aria-label={`Edit ${league.name}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingDelete(league)}
                    aria-label={`Delete ${league.name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </motion.li>
            );
          })}
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
              This will permanently delete this league
              {rosterCount > 0 &&
                `, its roster of ${rosterCount} player${rosterCount > 1 ? 's' : ''}`}
              {sessionCount > 0 &&
                `, and ${sessionCount} session${sessionCount > 1 ? 's' : ''}`}
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteLeague(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete league
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

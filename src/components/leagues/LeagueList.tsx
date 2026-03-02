import { AnimatePresence, motion } from 'framer-motion';
import { PencilIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

  if (leagues.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-muted-foreground">
        No leagues yet. Add your first league to get started.
      </p>
    );
  }

  return (
    <motion.ul
      className="mt-4 divide-y divide-border rounded-lg border border-border"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence initial={false}>
        {leagues.map((league) => {
          const rosterCount = Object.keys(league.roster).length;
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
                  {rosterCount} {rosterCount === 1 ? 'player' : 'players'}
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
                  onClick={() => deleteLeague(league.id)}
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
  );
}

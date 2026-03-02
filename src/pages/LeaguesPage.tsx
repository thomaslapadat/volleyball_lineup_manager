import { useState } from 'react';
import { LeagueForm } from '@/components/leagues/LeagueForm';
import { LeagueList } from '@/components/leagues/LeagueList';
import { Button } from '@/components/ui/button';
import type { League } from '@/types';

export function LeaguesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | undefined>(
    undefined,
  );

  function openCreate() {
    setEditingLeague(undefined);
    setFormOpen(true);
  }

  function openEdit(league: League) {
    setEditingLeague(league);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingLeague(undefined);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leagues</h1>
        <Button onClick={openCreate}>Add league</Button>
      </div>

      <LeagueList onEdit={openEdit} />

      <LeagueForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        league={editingLeague}
      />
    </div>
  );
}

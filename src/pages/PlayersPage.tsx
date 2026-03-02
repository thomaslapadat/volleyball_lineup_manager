import { useState } from 'react';
import { PlayerForm } from '@/components/players/PlayerForm';
import { PlayerList } from '@/components/players/PlayerList';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types';

export function PlayersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>(
    undefined,
  );

  function openCreate() {
    setEditingPlayer(undefined);
    setFormOpen(true);
  }

  function openEdit(player: Player) {
    setEditingPlayer(player);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingPlayer(undefined);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Players</h1>
        <Button onClick={openCreate}>Add player</Button>
      </div>

      <PlayerList onEdit={openEdit} />

      <PlayerForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        player={editingPlayer}
      />
    </div>
  );
}

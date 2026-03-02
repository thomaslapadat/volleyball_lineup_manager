import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportState, parseImportFile } from '@/lib/importExport';
import { useAppStore } from '@/store/useAppStore';
import type { AppState } from '@/types';

export function Navbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const { players, leagues } = useAppStore.getState();
    exportState({ players, leagues });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-imported if needed
    e.target.value = '';
    if (!file) return;

    parseImportFile(file)
      .then((data) => setPendingImport(data))
      .catch((err: Error) => setImportError(err.message));
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    useAppStore.setState({
      players: pendingImport.players,
      leagues: pendingImport.leagues,
    });
    setPendingImport(null);
  }

  function handleDismissError() {
    setImportError(null);
  }

  return (
    <nav className="border-b border-border bg-background px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="font-semibold text-foreground">
          Volleyball Lineup Manager
        </span>

        <div className="flex items-center gap-6 text-sm">
          <NavLink
            to="/players"
            className={({ isActive }) =>
              isActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }
          >
            Players
          </NavLink>
          <NavLink
            to="/leagues"
            className={({ isActive }) =>
              isActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }
          >
            Leagues
          </NavLink>

          <div className="ml-2 flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Import confirmation dialog */}
      <Dialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import data</DialogTitle>
            <DialogDescription>
              This will overwrite all existing players, leagues, and sessions.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmImport}>
              Overwrite and import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import error dialog */}
      <Dialog
        open={importError !== null}
        onOpenChange={(open) => !open && handleDismissError()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import failed</DialogTitle>
            <DialogDescription>{importError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleDismissError}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

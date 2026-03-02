import type { AppState } from '@/types';

/**
 * Serialises the current app state and triggers a .json file download.
 */
export function exportState(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `volleyball-lineup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a File, parses it as JSON, and validates the top-level shape.
 * Resolves with the parsed AppState or rejects with a user-friendly Error.
 */
export function parseImportFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed: unknown = JSON.parse(e.target?.result as string);

        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('players' in parsed) ||
          !('leagues' in parsed) ||
          typeof (parsed as Record<string, unknown>).players !== 'object' ||
          typeof (parsed as Record<string, unknown>).leagues !== 'object'
        ) {
          reject(
            new Error(
              'Invalid file: expected an object with "players" and "leagues" keys.',
            ),
          );
          return;
        }

        resolve(parsed as AppState);
      } catch {
        reject(
          new Error(
            'Could not parse file. Make sure it is a valid JSON export.',
          ),
        );
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

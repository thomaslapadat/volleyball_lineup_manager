import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LeagueDetailPage } from '@/pages/LeagueDetailPage';
import { LeaguesPage } from '@/pages/LeaguesPage';
import { PlayersPage } from '@/pages/PlayersPage';
import { SessionPage } from '@/pages/SessionPage';
import { SessionSetupPage } from '@/pages/SessionSetupPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/players" replace />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/leagues/:leagueId" element={<LeagueDetailPage />} />
          {/* /new must be before /:sessionId so it isn't captured as a param */}
          <Route
            path="/leagues/:leagueId/session/new"
            element={<SessionSetupPage />}
          />
          <Route
            path="/leagues/:leagueId/session/:sessionId"
            element={<SessionPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

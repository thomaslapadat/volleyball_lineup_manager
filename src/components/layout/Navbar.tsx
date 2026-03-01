import { NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="font-semibold text-foreground">
          Volleyball Lineup Manager
        </span>
        <div className="flex gap-6 text-sm">
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
        </div>
      </div>
    </nav>
  );
}

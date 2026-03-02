# Volleyball Lineup Manager

A single-page web application for managing recreational volleyball league lineups.

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** + **shadcn/ui** (Zinc theme)
- **Zustand** — client-side state, persisted to `localStorage`
- **Framer Motion** — UI animations
- **react-router-dom v7** — client-side routing

## Development

```bash
# Requires Node 22 via fnm — auto-activates from .node-version
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run check` | Biome lint + format check |
| `npm run format` | Auto-fix formatting |
| `npm run type-check` | TypeScript type check |

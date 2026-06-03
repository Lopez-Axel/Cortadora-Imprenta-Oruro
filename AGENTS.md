# AGENTS.md — cortadora-imprenta

## Stack

- **Next.js 16** (App Router, RSC by default) + **React 19**
- **pnpm** (see `pnpm-lock.yaml`; workspace config only allows `msw`, `sharp`, `unrs-resolver` builds)
- **Tailwind CSS 4** (`@tailwindcss/postcss` + `tw-animate-css`)
- **TypeScript 5** (strict mode, `bundler` module resolution)
- **shadcn/ui** (style `base-nova`, icons from `lucide-react`)
- **Zustand** for state, **decimal.js** for all numeric operations

## Commands

```sh
pnpm dev        # dev server at localhost:3000
pnpm build      # production build
pnpm start      # production server
pnpm lint       # ESLint only — no typecheck script exists
```

There is **no test runner** configured. No `format` script (prettier installed but no config file).

## Architecture

Single-page app — only route is `/` (renders `CuttingDashboard`).

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router entry (layout, page, globals.css) |
| `src/components/ui/` | shadcn/ui primitives (button, card, input, select, etc.) |
| `src/components/canvas/` | Konva/`react-konva` canvas for cut visualization |
| `src/components/forms/` | `SheetForm`, `PieceForm` (react-hook-form + zod) |
| `src/components/comparison/` | `StrategyComparison` — side-by-side strategy selector |
| `src/components/metrics/` | `MetricsCard`, `DashboardMetrics` |
| `src/components/layouts/` | `CuttingDashboard` — main orchestrator |
| `src/lib/algorithms/` | Cutting engine: `engine.ts` + strategies (`horizontal`, `vertical`, `mixed`, `maxRects`) |
| `src/lib/store/` | Zustand store (`cutting-store.ts`) |
| `src/lib/hooks/` | `useCuttingEngine` — reactive engine bridge |
| `src/lib/models/` | `types.ts` — all shared types |

## Conventions

- **All dimensions use `Decimal`** from `decimal.js`, never plain `number`. Arithmetic uses `.mul()`, `.div()`, `.add()`, `.sub()`, `.cmp()`, etc.
- **Path alias**: `@/` maps to `src/`. Use `@/lib/...`, `@/components/...`.
- **Interactive components** need `"use client"` directive at top.
- **CSS**: Tailwind v4 `@theme inline` in `globals.css`. Custom utilities defined via `@utility` (`card-hover`, `card-best`, `card-warning`).
- **No Prettier/format check** — just ESLint `pnpm lint`.

## Engine

4 strategies always run: `Horizontal`, `Vertical`, `Mixta`, `MaxRects`. When exactly 1 piece (no `quantity`), 6 extra patterns (A–F) also run. Results sorted by efficiency desc, then waste asc, then pieces placed desc. `pickBest()` uses `piecesPlaced * 1000 + efficiency`.

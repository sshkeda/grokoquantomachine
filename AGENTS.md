# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next 16 app router entry; `page.tsx` is the primary UI, `api/` contains route handlers, and `providers.tsx` wires global context.
- `components/`: Feature UI such as chat list, messages, strategy chart, and supporting dialogs; `components/ui/` holds shared primitives.
- `hooks/`: Custom React hooks (e.g., chat id parsing/state helpers).
- `lib/`: Client utilities and domain helpers.
- `resources/`: Seed or content assets used in the UI.
- Root config: `next.config.ts`, `tsconfig.json`, `biome.json`, `postcss.config.mjs`; Python helpers and smoke tests live in `test_getPrices.py` and `test_searchPosts.py`.

## Build, Test, and Development Commands
- Local dev server with tunnel: `bun run dev` (runs `next dev` and `bun tunnel`).
- Production build: `bun run build` then `bun run start` to serve the optimized output.
- Lint/format TypeScript: `bun run lint` (Biome check) and `bun run format` (Biome write).
- Full static analysis sweep: `bun run check` (Biome + TypeScript + Ruff format/check + type check via `uvx ty`).
- Python smoke scripts: `python test_getPrices.py` and `python test_searchPosts.py` from repo root.

## Coding Style & Naming Conventions
- TypeScript + React 19; prefer functional components and hooks. Use 2-space indentation.
- Components in PascalCase filenames; hooks/use-* in camelCase. Keep colocated styles within the component file; global styles live in `app/globals.css`.
- Use Radix + Tailwind (v4) utilities for layout/spacing; prefer `clsx`/`tailwind-merge` for class composition.
- Run Biome before committing to auto-fix formatting and lint issues.

## Testing Guidelines
- Run `bun run lint` before PRs; `bun run check` for broader validation when touching infra or types.
- Keep UI changes minimally breaking by exercising critical flows in the browser while `bun run dev` runs.
- Python helpers: confirm data-fetch scripts still pass when finance/data code changes.
- Name new test helpers after the feature under test (e.g., `test_strategyExecution.ts` once a TS test harness exists).

## Commit & Pull Request Guidelines
- Recent history favors concise, imperative-style messages (e.g., `refactor use-chat-id hook`); follow that format and keep scope focused.
- For PRs, include: what changed, why, how to test (commands + expected result), and any screenshots for UI-impacting work.
- Link issues when available; request a review when lint/check commands are green and new dependencies/config changes are called out explicitly.

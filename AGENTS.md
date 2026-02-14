# rwr-toolbox Development Guidelines

Regenerated from `docs/` authoritative sources. Last updated: 2026-02-14

## Source of Truth

- Primary authority: `docs/` (Documentation-Driven Development)
- Required reading order for new contributors/agents:
    1. `docs/STATUS.md`
    2. `docs/UI.md`
    3. `docs/PLAN.md` (this file is currently titled `PLAN.APPENDIX`)
    4. `docs/CONSTRUCTION.md`
    5. `docs/AI_BOOTSTRAP_PROMPT.md`

## Project Snapshot

- Product: Desktop toolbox for Running With Rifles players/modders
- App type: Angular + Tauri desktop application (not web/mobile-first)
- Current app version: `0.1.0`
- UI baseline: 800x600 minimum, 3840x2160 maximum supported

## Active Technologies

- Frontend: Angular `20.3.15`, TypeScript `5.8.3`, Angular CLI `20.3.13`
- Desktop/backend: Tauri `2.x`, Rust (edition `2021`)
- Styling/UI: Tailwind CSS `4.1.18`, DaisyUI `5.5.14`
- i18n: Transloco `8.2.0` (runtime i18n only)
- Icons: Lucide Angular `0.562.0` via centralized registry
- Data/parsing: `quick-xml` (Rust), `fast-xml-parser` (TypeScript)
- Persistence/config: `tauri-plugin-store`

## Core Principles (Non-Negotiable)

1. Desktop-first UI design
    - Must remain fully usable at `800x600`
    - Must scale correctly up to `4K` without layout breakage
2. Runtime i18n with Transloco
    - No `@angular/localize` build-time i18n
    - No hardcoded user-facing text in templates/components
3. Theme adaptability
    - Support both DaisyUI light/dark themes
    - Use theme variables for custom colors
4. Signal-based state management
    - Service state uses Angular `signal()`
    - RxJS is for async flows only
    - Avoid BehaviorSubject as primary state source
5. Documentation-driven development
    - Align all implementation decisions with `docs/`
6. Icon management
    - Only `lucide-angular`
    - Register icons in `src/app/shared/icons/index.ts` before use
    - No manual SVG tags in templates/components
7. Tailwind-first styling
    - Prefer Tailwind utilities and DaisyUI semantics
    - Only use custom CSS when utility/component patterns cannot express the requirement

## Project Structure

```text
src/
  app/
    core/
    shared/
    features/
src-tauri/
docs/
```

## Development Commands

Use `pnpm` as the package manager baseline.

```bash
pnpm install
pnpm start          # Angular dev server
pnpm tauri dev      # Tauri desktop development
pnpm build          # Angular production build
pnpm tauri build    # Tauri desktop production build

cargo fmt           # Rust formatting
cargo clippy        # Rust linting
cargo test          # Rust tests
```

## Engineering Standards

- TypeScript
    - Strict mode
    - Prettier formatting
    - No unused imports
- Rust
    - Keep `cargo fmt` clean
    - Keep `cargo clippy` clean (or document intentional warnings)
- i18n
    - New keys must be added in both:
        - `src/assets/i18n/en.json`
        - `src/assets/i18n/zh.json`
    - Use hierarchical key naming (for example: `menu.dashboard`, `common.yes`)

## Architecture Constraints

- Service-layer state should expose signals directly to components (no `toSignal()` bridge for primary state)
- Signal updates must follow immutable update patterns
- Tauri command calls must include explicit error handling
- User-facing error messages should be i18n keys, not hardcoded strings

## Working Protocol

- Define task boundaries clearly (`What` / `Not What`) before implementation
- Deliver small, verifiable increments (MVP first)
- For file overwrite/backup/risky operations, document rollback strategy
- Keep docs updated when project snapshot, architecture guidance, or reusable implementation references change

## Feature Status Snapshot

- Completed: i18n migration, 800x600 layout optimization, servers, settings, dashboard, players, hotkeys
- In progress: data management is partially complete (about 90% per `docs/STATUS.md`)

## Known Documentation Notes

- `docs/PLAN.md` content title uses `PLAN.APPENDIX`; treat this file as the implementation-reference appendix
- Some historical docs still show `npm` command examples; preferred baseline is `pnpm` per `docs/CONSTRUCTION.md`

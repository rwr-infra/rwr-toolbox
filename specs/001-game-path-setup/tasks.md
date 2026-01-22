# Tasks: Game Path Setup

**Input**: Design documents from `specs/001-game-path-setup/`  
**Prerequisites**: `specs/001-game-path-setup/plan.md` (required), `specs/001-game-path-setup/spec.md` (required)

**Tests**: 本任务清单不主动新增测试任务（spec 未要求 TDD）。如需要补测试，可在实现后追加。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format

Every task follows:

(注：上面仅为格式说明，不是任务项。)

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Align terminology and i18n keys for “game install directory” across app in `src/assets/i18n/en.json` and `src/assets/i18n/zh.json`
- [x] T002 [P] Inventory existing path storage APIs and decide single source of truth in `src/app/core/services/settings.service.ts` and `src/app/features/settings/services/directory.service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Define a dedicated game directory field in settings model in `src/app/core/services/settings.service.ts`
- [x] T004 Implement read/write persistence for game directory in `src/app/core/services/settings.service.ts`
- [x] T005 Define game directory validation result shape in `src/app/shared/models/directory.models.ts`
- [x] T006 Implement Tauri command to validate game install directory layout in `src-tauri/src/directories.rs`
- [x] T007 Register new validation command in `src-tauri/src/lib.rs`
- [x] T008 Wire frontend validation call in `src/app/core/services/settings.service.ts`

**Checkpoint**: After Phase 2, the app can store + validate game install directory independently.

---

## Phase 3: User Story 1 - Configure Game Install Directory (Priority: P1) MVP

**Goal**: Users can set/change/clear the game install directory and see a clear validated state.

**Independent Test**: Clear config → set game directory in Settings → see valid state → restart app → still configured.

- [x] T009 [US1] Add Settings UI section for game install directory in `src/app/features/settings/settings.component.html`
- [x] T010 [US1] Add Settings UI logic for selecting/clearing game install directory in `src/app/features/settings/settings.component.ts`
- [x] T011 [US1] Add i18n strings for the new Settings UI in `src/assets/i18n/en.json` and `src/assets/i18n/zh.json`
- [x] T012 [US1] Ensure Settings page displays validation errors consistently with existing scan directories in `src/app/features/settings/settings.component.html`
- [x] T013 [P] [US1] Register any new Lucide icons used by the Settings section in `src/app/shared/icons/index.ts`

---

## Phase 4: User Story 2 - Local Mod Guidance When Game Path Missing (Priority: P2)

**Goal**: Local Mod provides clear guidance when game directory is missing, without confusing redirects.

**Independent Test**: Clear game directory → open Local Mod → see prompt + link to Settings.

- [x] T014 [US2] Update Local Mod path resolution to use game install directory (not first scan directory) in `src/app/features/mods/services/mod.service.ts`
- [x] T015 [US2] Ensure existing Local Mod missing-path prompt is shown for missing game install directory in `src/app/features/mods/install/install.component.html`
- [x] T016 [US2] Harmonize route guard behavior to allow showing prompt (or improve redirect reason) in `src/app/shared/guards/path-detected.guard.ts`

---

## Phase 5: User Story 3 - Dashboard Onboarding Prompt (Priority: P3)

**Goal**: Dashboard guides users to configure the game install directory when missing.

**Independent Test**: Clear game directory → open Dashboard → see CTA → click → go to Settings.

- [x] T017 [US3] Add “game directory missing” status to dashboard state in `src/app/features/dashboard/services/dashboard.service.ts`
- [x] T018 [US3] Add onboarding callout UI to dashboard in `src/app/features/dashboard/dashboard.component.html`
- [x] T019 [US3] Add i18n strings for dashboard onboarding callout in `src/assets/i18n/en.json` and `src/assets/i18n/zh.json`
- [x] T020 [P] [US3] Register any new Lucide icons used by the callout in `src/app/shared/icons/index.ts`

---

## Phase 6: Data Pages - Combined Scanning (Cross-cutting)

**Purpose**: Weapons/Items scan uses combined roots: game install directory (optional) + scan directories, with de-duplication.

- [x] T021 Derive combined scan roots (de-duped) in `src/app/features/settings/services/directory.service.ts`
- [x] T022 Update weapons scan invocation to use combined roots in `src/app/features/data/weapons/services/weapon.service.ts`
- [x] T023 Update items scan invocation to use combined roots in `src/app/features/data/items/services/item.service.ts`
- [x] T024 Ensure de-duplication is enforced at data merge boundaries in `src-tauri/src/weapons.rs` and `src-tauri/src/items.rs`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T025 Remove any legacy gamePath migration remnants and dead code in `src/app/core/services/settings.service.ts`
- [x] T026 Run typechecks: `pnpm -s tsc -p tsconfig.app.json --noEmit` and `cargo check -q` (repo root + `src-tauri/`)
- [x] T027 Validate quickstart manual flow in `specs/001-game-path-setup/quickstart.md`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 blocks all stories.
- US1 depends on Phase 2.
- US2 and US3 depend on Phase 2 and can proceed in parallel after US1 if desired.
- Combined scanning (Phase 6) should be implemented after US1 (needs game directory setting).

## Parallel Opportunities

- [P] tasks: T002, T013, T020 can run in parallel (different files).

## MVP Scope (Recommended)

- Implement through Phase 3 (US1) first. Stop and validate persistence + validation UX before touching Mods/Data/Dashboard.

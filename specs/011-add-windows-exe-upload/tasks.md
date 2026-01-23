---

description: "Task list for Windows single-file EXE artifact upload feature"
---

# Tasks: Windows 单文件 EXE 编译产物上传

**Input**: Design documents from `/specs/011-add-windows-exe-upload/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not applicable for this CI/CD configuration feature. Manual testing will be performed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **GitHub Actions**: `.github/workflows/`
- **Configuration files**: Repository root
- **No source code changes**: This feature only modifies CI/CD configuration

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Review current GitHub Actions workflow in `.github/workflows/release.yml`
- [ ] T002 Verify Tauri 2.x configuration in `src-tauri/tauri.conf.json`
- [ ] T003 [P] Create test tag for workflow validation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Verify GitHub Actions workflow syntax is valid
- [ ] T005 Verify `tauri-apps/tauri-action@v0` version supports `--bundles` parameter
- [ ] T006 Verify repository has write permissions for GitHub Releases

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 流水线自动构建并上传 EXE 文件 (Priority: P1) 🎯 MVP

**Goal**: CI/CD 流水线在发布时自动构建并上传 Windows 单文件 EXE

**Independent Test**: 推送测试标签后，GitHub Release 页面包含 Windows 单文件 EXE 文件

### Tests for User Story 1 (Manual Testing) ⚠️

> **NOTE: This is a CI/CD configuration feature. Manual testing will be performed after implementation.**

- [ ] T007 [US1] Create test tag `v0.1.0-test-exe` to trigger workflow
- [ ] T008 [US1] Monitor GitHub Actions workflow run for Windows platform
- [ ] T009 [US1] Verify GitHub Release contains both setup and EXE files

### Implementation for User Story 1

- [ ] T010 [US1] Modify `.github/workflows/release.yml` to add `--bundles exe,nsis` parameter for Windows platform
  - **File**: `.github/workflows/release.yml`
  - **Change**: Update the `args` parameter in the Windows build step
  - **Before**: `args: ${{ matrix.args }}`
  - **After**: `args: --bundles exe,nsis ${{ matrix.args }}`
- [ ] T011 [US1] Verify workflow YAML syntax is correct
- [ ] T012 [US1] Commit and push workflow changes to feature branch
- [ ] T013 [US1] Create test tag and verify workflow execution
- [ ] T014 [US1] Verify both `rwr-toolbox_{version}_x64-setup.exe` and `rwr-toolbox_{version}_x64.exe` are generated
- [ ] T015 [US1] Verify both files are uploaded to GitHub Release

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 下载便携式 Windows EXE 文件 (Priority: P1)

**Goal**: 用户可以从 GitHub Release 页面下载便携式 EXE 文件，无需安装即可运行

**Independent Test**: 下载 EXE 文件并验证可以独立运行

### Tests for User Story 2 (Manual Testing) ⚠️

> **NOTE: Manual testing will be performed after implementation.**

- [ ] T016 [US2] Download `rwr-toolbox_{version}_x64.exe` from GitHub Release
- [ ] T017 [US2] Run EXE file on Windows system
- [ ] T018 [US2] Verify application launches without installation
- [ ] T019 [US2] Verify application functionality matches setup version

### Implementation for User Story 2

- [ ] T020 [US2] Download generated EXE file from test release
- [ ] T021 [US2] Test EXE file on clean Windows system
- [ ] T022 [US2] Verify all core features work correctly
- [ ] T023 [US2] Document any limitations or requirements (e.g., WebView runtime)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - EXE 文件命名和版本管理 (Priority: P2)

**Goal**: EXE 文件名包含版本号信息，便于识别和管理

**Independent Test**: 检查生成的 EXE 文件名是否包含正确的版本号

### Tests for User Story 3 (Manual Testing) ⚠️

> **NOTE: Manual testing will be performed after implementation.**

- [ ] T024 [US3] Verify EXE file name includes version number (e.g., `rwr-toolbox_0.1.0_x64.exe`)
- [ ] T025 [US3] Verify version number matches `tauri.conf.json` version
- [ ] T026 [US3] Verify file naming is consistent with setup file

### Implementation for User Story 3

- [ ] T027 [US3] Verify `src-tauri/tauri.conf.json` version field is correct
- [ ] T028 [US3] Verify Tauri automatically includes version in file names
- [ ] T029 [US3] Document file naming convention in release notes

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 Update `README.md` to document both setup and EXE download options
- [ ] T031 Update `CHANGELOG.md` to include this feature
- [ ] T032 Add release notes template mentioning both download options
- [ ] T033 [P] Document any known limitations or system requirements
- [ ] T034 [P] Monitor build time metrics to ensure under 150% of original
- [ ] T035 [P] Monitor file size to ensure under 200MB limit
- [ ] T036 Clean up test release and test tags
- [ ] T037 Run `quickstart.md` validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion - Needs EXE file to be generated first
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion - Can be done in parallel with User Story 2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 completion - Cannot test until EXE file is generated
- **User Story 3 (P2)**: Depends on User Story 1 completion - Can be done in parallel with User Story 2

### Within Each User Story

- Manual tests MUST be performed after implementation
- Implementation tasks should be completed in order
- Each story should be validated before moving to next

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- User Story 3 can run in parallel with User Story 2 (both depend on User Story 1)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all Setup tasks together:
Task: "Review current GitHub Actions workflow in .github/workflows/release.yml"
Task: "Verify Tauri 2.x configuration in src-tauri/tauri.conf.json"
Task: "Create test tag for workflow validation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Verify EXE file is generated and uploaded
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Verify EXE generation
3. Add User Story 2 → Test independently → Verify EXE functionality
4. Add User Story 3 → Test independently → Verify file naming
5. Polish → Documentation and cleanup
6. Each story adds value without breaking previous stories

### Sequential Strategy (Recommended for this feature)

Since this is a simple CI/CD configuration change:

1. Complete Setup + Foundational
2. Complete User Story 1 (modify workflow)
3. Complete User Story 2 (test EXE file)
4. Complete User Story 3 (verify file naming)
5. Polish (documentation, cleanup)
6. Merge to master and create production release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Manual testing is required for this CI/CD configuration feature
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- This feature only modifies CI/CD configuration, no application code changes
- All changes are backward compatible with existing setup files

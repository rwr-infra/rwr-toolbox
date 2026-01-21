# Feature Specification: Dashboard & Architectural Refinement

**Feature Branch**: `010-dashboard-refinement`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "Dashboard and Architectural Refinement: 1. Implement mod counting logic. 2. Track actual API ping on Dashboard. 3. Check game path configuration status on Dashboard. 4. Implement actual path detection logic via Tauri backend for guards. 5. Update STATUS.md after completion."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Accurate Dashboard Stats (Priority: P1)

As a user, I want to see correct and live statistics on my dashboard, including the number of installed mods and the API latency, so that I can verify my environment is set up correctly.

**Why this priority**: Correct information builds trust. Currently, the dashboard shows "0" for mods and "null" for ping, which looks incomplete.

**Independent Test**: Open the dashboard. Verify that the "Local Mods" count is non-zero (if mods are installed) and the API Connection shows a numeric ping value (e.g., "45ms").

**Acceptance Scenarios**:

1. **Given** the application is connected to the internet, **When** I view the Dashboard, **Then** the "API Connection" section displays a numeric ping in milliseconds.
2. **Given** one or more valid scan directories are configured, **When** the app scans data, **Then** the "Local Mods" stat card updates with the total count of detected packages across all active directories.

---

### User Story 2 - Robust Path Guarding (Priority: P2)

As a developer, I want to ensure that navigation to data features is guarded by a reliable game path detection mechanism, so that users are redirected to settings only when necessary.

**Why this priority**: Improves application stability and prevents errors in components that depend on valid file paths.

**Independent Test**: Clear all scan directories in Settings. Try to navigate to "/data". Verify you are redirected back to Settings with a clear instruction.

**Acceptance Scenarios**:

1. **Given** no valid scan directories are configured, **When** I attempt to access the Weapons or Items page, **Then** the `path-detected.guard` prevents access and redirects to Settings.

---

### User Story 3 - Maintenance of Status Documentation (Priority: P3)

As a maintainer, I want the project's `STATUS.md` to be updated automatically or after major features, so that I always have an accurate high-level view of the project's progress.

**Why this priority**: Essential for keeping project documentation synchronized with the actual codebase implementation.

**Independent Test**: Read `docs/STATUS.md` and verify it reflects all features completed up to this point, including the latest dashboard and navigation changes.

---

### Edge Cases

- **Offline API**: If the backend cannot reach the RWR API, the dashboard should show "Offline" and "N/A" for ping, without crashing or showing perpetual "loading".
- **Broken Mod Folders**: If a directory contains invalid XML or malformed mod structures, the mod count should only include valid packages.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Dashboard MUST display the total count of mods (packages) from all active scan directories.
- **FR-002**: Dashboard MUST calculate and display the actual latency to the RWR official API.
- **FR-003**: Dashboard MUST reflect whether at least one valid game path is configured in the "System Status" section.
- **FR-004**: The `path-detected.guard` MUST use a Tauri-backed service to verify if the configured directories are currently accessible on disk.
- **FR-005**: `docs/STATUS.md` MUST be updated to mark Dashboard API sync and Mod management refinements as completed.

### Key Entities _(include if feature involves data)_

- **DashboardStats**: Aggregated view of system and game status.
- **SystemStatus**: Detailed health and configuration snapshot.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: "Local Mods" card displays a number >= 0 based on real filesystem scan.
- **SC-002**: API Ping is displayed with < 5s refresh interval on the dashboard.
- **SC-003**: `path-detected.guard` successfully redirects 100% of invalid path attempts to the settings page.

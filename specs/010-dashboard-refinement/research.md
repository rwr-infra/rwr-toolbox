# Research: Dashboard & Architectural Refinement

## Decision: Mod Counting Logic

- **Rationale**: The user wants to see the number of "Local Mods" (packages). `DirectoryService` already calculates `packageCount` during validation/scanning.
- **Implementation**:
    - Aggregating `dir.packageCount` from all entries in `DirectoryService.directoriesSig()`.
    - This avoids a new expensive filesystem traversal.
- **Alternatives**: Manually re-scanning `packages/` folders in `DashboardService`. (Rejected: Redundant work).

## Decision: API Ping Integration

- **Rationale**: Immediate feedback on connectivity to RWR services.
- **Implementation**:
    - Use `PingService` to ping `rwr.runningwithrifles.com`.
    - `DashboardService` will trigger this ping every 10 seconds while the dashboard is active.
- **Alternatives**: Pinging on every navigation. (Rejected: Excessive network usage).

## Decision: Robust Path Verification for Guards

- **Rationale**: Currently, `path-detected.guard` is a placeholder. It should prevent access to data-heavy features if no valid paths are available.
- **Implementation**:
    - Implement a Tauri command `check_path_exists(path: string) -> bool`.
    - The guard will check if `DirectoryService.getValidDirectories().length > 0`.
    - Since `DirectoryService` state is in memory (Signals), we should also verify at least one path still exists on disk during the guard's execution to handle external deletions.
- **Alternatives**: Only checking the Signal state. (Rejected: Doesn't handle cases where a folder was deleted while the app was closed).

## Decision: Syncing STATUS.md

- **Rationale**: Maintain documentation quality.
- **Implementation**: Manual update as the final task of the feature implementation.

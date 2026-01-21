# Research: UI Style Optimization & Performance

## Decision: Unified Control Area Design

### Findings

The current design of `weapons.component.html` and `items.component.html` uses a loose flexbox layout for the top-level controls. While functional, it lacks visual grouping.

**Proposed Solution**:

1.  **Group Query Controls**: Use a single container (possibly a `card` or a specific toolbar `div` with `bg-base-200` or similar) to group Search, Filters, Page Size, and Action buttons (Refresh, Export, etc.).
2.  **Consistent Button Spacing**: Use `gap-2` (8px) for related buttons and `gap-4` (16px) for major sections.
3.  **Advanced Search Integration**: Keep the collapse but ensure it blends well with the primary Control Area.
4.  **Settings Consistency**: Ensure all settings sections use the same card-based structure and spacing.

### Rationale

Grouping related controls reduces cognitive load and mouse travel. Using a background-colored area for filters is a common desktop application pattern that helps distinguish "finding data" from "viewing data".

### Alternatives Considered

- **Floating Toolbar**: Rejected as it might obscure table content on 800x600 resolution.
- **Side Panel Filters**: Rejected as the current horizontal layout is more efficient for the wide table views.

## Resolved Unknowns

- **DaisyUI Components**: Will use `join` for closely related controls (like Search + Icon) and `flex flex-wrap gap-2` for the main toolbar to ensure responsiveness on smaller windows.
- **Spacing**: Tailwind `gap-2` will be the standard for button groups.

## Performance Analysis: Scanning & Responsiveness

### Problem Statement

Users report that the "scanning" loading state blocks the main thread, making navigation (sidebar clicks) unresponsive. This typically occurs during application startup or when adding new game directories.

### Findings

#### 1. Sequential Scanning Bottleneck

`DirectoryService.scanAllDirectories` currently iterates through directories and awaits `scanWeapons` and `scanItems` for each one sequentially.

- **Impact**: Total wait time is the sum of all individual scans. UI updates (signals) are triggered multiple times in rapid succession, causing layout thrashing.

#### 2. Signal Update Frequency

Each `scanWeapons/Items` call with `append: true` performs:

```typescript
this.weapons.set([...this.weapons(), ...weaponsWithSource]);
```

- **Impact**: This creates a new array and triggers all `computed()` signals (like `filteredWeapons`) for EVERY directory. If a user has 10 directories, the 5000+ item list is recreated and filtered 10 times.

#### 3. Synchronous Computation in Signals

`filteredWeapons` and `filteredItems` in the services are `computed` signals that perform search, filter, and sort logic.

- **Impact**: Sorting thousands of objects synchronously on every keystroke or directory update blocks the UI thread.

### Decisions

#### Decision: Parallelized Directory Scanning

**Rationale**: Use `Promise.all` to trigger all directory scans concurrently.
**Implementation**: Fetch all results from the backend first, then perform a single signal update.

#### Decision: Batched Signal Updates

**Rationale**: Instead of appending per-directory, gather all results and update the primary `weapons`/`items` signals exactly once at the end of the batch operation.
**Implementation**: Update `DirectoryService.scanAllDirectories` to aggregate results.

#### Decision: Computed Signal Optimization

**Rationale**: Heavy sorting/filtering should be minimized.
**Implementation**: Ensure that `paginatedWeapons` only slices the already filtered/sorted list. Consider if we can offload the "initial full list" processing.

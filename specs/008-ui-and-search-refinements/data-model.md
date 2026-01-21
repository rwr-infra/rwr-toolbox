# Data Model: UI and Search Refinements

## Entities

### ScanDirectory (UI Context)

Refinement of the existing directory entity to emphasize always-visible status.

| Field        | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| id           | string | Unique identifier                            |
| path         | string | Absolute path to the directory               |
| packageCount | number | Number of packages detected (Always Visible) |
| status       | string | 'valid', 'invalid', 'pending'                |

### SearchState

Managed within `WeaponsComponent` and `ItemsComponent`.

| Field              | Type           | Description                                                   |
| ------------------ | -------------- | ------------------------------------------------------------- |
| searchTerm         | signal<string> | The current user input for search                             |
| highlightedContent | string (HTML)  | The source text with `<span class="highlight">` tags inserted |

## State Transitions

### Settings Update

1. User selects a new Language or Theme.
2. Signal in `SettingsService` updates.
3. Transloco/Theme service reacts immediately (Existing).
4. No intermediary "Save" state.

### Search Interaction

1. User types into the search box.
2. `searchTerm` signal updates.
3. `paginatedData` computed signal recalculates the subset.
4. Component template calls `highlight()` method for each cell.
5. DOM updates with highlighted spans.

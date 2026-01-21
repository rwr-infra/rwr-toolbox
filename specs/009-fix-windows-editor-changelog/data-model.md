# Data Model: Changelog Integration

## Entities

### ChangelogEntry (Frontend Model)

Extracted from the Markdown file for display on the dashboard.

| Field       | Type   | Description                       |
| ----------- | ------ | --------------------------------- |
| version     | string | Semantic version (e.g., "0.1.0")  |
| date        | string | ISO date string or formatted date |
| description | string | Summary of changes                |

## State Transitions

### Changelog Sync Flow

1. **App Init**: `DashboardService` calls `get_changelog` Tauri command.
2. **Backend**: Reads `CHANGELOG.md` from disk.
3. **Frontend**:
    - Parsed for the latest entry.
    - Latest entry pushed to `activitiesSig` signal in `DashboardService`.
    - Full content rendered in `AboutComponent`.

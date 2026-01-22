# Quickstart: Game Path Setup

Created: 2026-01-22

## What this feature adds

- A dedicated setting for “Game Installation Directory”.
- Keeps existing “Scan Directories”.
- Data pages scan from the combined set of directories.
- Dashboard and Local Mod provide guidance when game directory is missing.

## Manual test checklist

1. Start with a clean config (no game directory set).
2. Open Dashboard and confirm it shows a “configure game directory” call-to-action.
3. Navigate to Local Mod:
    - If the app allows entry, verify the in-page prompt is shown.
    - If the app redirects to Settings, verify the redirect reason is clear.
4. Configure a valid game installation directory.
5. Verify the setting persists after restart.
6. Configure one or more scan directories.
7. Open Data -> Weapons / Items and verify:
    - Dataset includes base game content + scan directory content.
    - No obvious duplicates.

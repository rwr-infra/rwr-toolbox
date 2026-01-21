# Quickstart: UI Style & Performance Verification

## Development Setup

1. Ensure you are on the `001-ui-style-optimization` branch.
2. Run `pnpm install` if dependencies changed.

## UI Verification Steps

1. **Start the app**:

    ```bash
    pnpm tauri dev
    ```

2. **Settings Page**:

    - Navigate to Settings.
    - Verify all sections (Language, Theme, Directories) are in consistent cards.
    - Check spacing between action buttons in the Directory list.

3. **Weapons Page**:

    - Navigate to Weapons.
    - Verify the top toolbar is unified and has a background.
    - Resize window to 800px width and ensure no horizontal scrolling occurs in the toolbar.
    - Check gap between Refresh and Mode toggle buttons.

4. **Items Page**:

    - Navigate to Items.
    - Verify it follows the same toolbar pattern as Weapons.

5. **Theme Check**:
    - Toggle between Light and Dark themes in Settings.
    - Verify the toolbar backgrounds adapt correctly.

## Performance Verification Steps

1. **Cold Start Scanning**:

    - Clear all scan directories in Settings.
    - Add 3-5 game directories (including mods if available).
    - Click "Scan All".
    - **Verification**: Try clicking sidebar menu items (Hotkeys, Servers, About) WHILE the scan is in progress.
    - **Expectation**: Navigation should respond immediately (< 100ms lag).

2. **Large Dataset Sorting**:
    - Ensure 2000+ items are loaded.
    - Click a column header to sort.
    - **Expectation**: Table should update without a visible freeze or "Application not responding" dialog.

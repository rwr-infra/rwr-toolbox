# Quickstart: UI and Search Refinements

## Overview

This feature streamlines the Settings UI, enhances the Directory list, adds project info to the About page, and implements search highlighting for Weapons and Items.

## Key Changes

1.  **Settings Layout**: Removed redundant labels and hints from Language and Theme sections.
2.  **Directory Management**: Removed radio buttons from the list; package counts are now always visible.
3.  **About Page**: Added project description and GitHub link.
4.  **Search Highlighting**: Integrated case-insensitive highlighting in Weapons and Items tables.

## Verification Steps

### 1. Settings Verification

- Navigate to **Settings**.
- Confirm Language and Theme inputs are direct and not in a row with a label.
- Verify no "real-time save" hints are visible.
- Add a directory and confirm no radio button appears, but "packages" count is visible.

### 2. About Page Verification

- Navigate to **About**.
- Confirm project description and clickable GitHub link are present.

### 3. Search Highlighting Verification

- Navigate to **Weapons** or **Items**.
- Type a search term (e.g., "rifle").
- Confirm matching text in the table cells is highlighted with a yellow background.
- Change the search term and verify the highlighting updates correctly.

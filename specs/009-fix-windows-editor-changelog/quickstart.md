# Quickstart: Windows Editor & Changelog Integration

## Verification Scenarios

### 1. Windows File Opening

- Run the app on Windows.
- Go to **Data -> Weapons**.
- Click the "Open in Editor" icon on any weapon.
- **Expected**: The file opens in the system's default editor (e.g., VS Code or Notepad).

### 2. Changelog on Dashboard

- Open the **Dashboard**.
- Look at the **Recent Activity** section.
- **Expected**: A "system" type activity showing "Latest Update: v0.1.0" (or current version) with the corresponding date from `CHANGELOG.md`.

### 3. Changelog on About Page

- Navigate to **About**.
- Scroll to the bottom.
- **Expected**: The full content of `CHANGELOG.md` is displayed in a readable format.

### 4. Dashboard Entry Points

- Go to the **Dashboard**.
- Confirm the **Extract** button is gone.
- Confirm a **Local Mods** button is present and navigates to `/mods`.

### 5. Sidebar Navigation

- Check the sidebar menu.
- **Expected**: "Local Mods" appears between "Data" and "Hotkeys" (or according to clarified order).

# Quickstart: Dashboard Refinement Verification

## 1. Dashboard Stats Verification

- **Mod Count**: Add a directory in Settings. Go to Dashboard. Verify "Local Mods" matches the package count shown in Settings.
- **API Ping**: Check the "API Connection" stat. It should show a millisecond value (e.g. 45ms) instead of "Online".

## 2. Path Guard Verification

- Go to Settings. Remove all scan directories.
- Try to click "Weapons" or "Items" in the sidebar.
- **Expected**: You are automatically redirected to Settings.

## 3. Documentation Sync

- Verify `docs/STATUS.md` reflects these changes under the "Dashboard" section.

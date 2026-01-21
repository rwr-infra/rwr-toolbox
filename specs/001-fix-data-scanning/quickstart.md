# Quickstart: Fix Data Scanning Errors and UX Improvements

**Feature**: 001-fix-data-scanning
**Branch**: `001-fix-data-scanning`

## Prerequisites

- Rust edition 2021
- Node.js LTS (v20+)
- pnpm package manager
- Tauri 2.x CLI

## Backend Setup (Rust)

### 1. Add Dependencies

```bash
cd src-tauri

# Add rayon for parallel file scanning
cargo add rayon

# Verify dependencies
cargo check
```

### 2. Build and Test

```bash
# Run tests
cargo test

# Check for issues
cargo clippy

# Build debug binary
cargo build

# Build release binary
cargo build --release
```

### 3. Key Files to Modify

- `src/weapons.rs` - Template resolution fix, parallel scanning
- `src/items.rs` - Template resolution fix, parallel scanning
- `src/directories.rs` - Package count in validation

## Frontend Setup (Angular)

### 1. Install Dependencies

```bash
# From repo root
pnpm install
```

### 2. Development Server

```bash
# Web-only development (no Tauri)
pnpm start

# Full Tauri desktop development
pnpm tauri dev
```

### 3. Key Files to Modify

- `src/app/shared/models/directory.models.ts` - Add active, packageCount fields
- `src/app/shared/icons/index.ts` - Register ToggleLeft and Copy icons
- `src/app/features/settings/services/directory.service.ts` - Active state management
- `src/app/features/settings/settings.component.html` - Toggle UI, package display
- `src/app/features/data/local/local.component.ts` - Auto-scan fix
- `src/app/features/data/weapons/weapons.component.html` - Drawer layout
- `src/app/features/data/items/items.component.html` - Drawer layout
- `src/assets/i18n/en.json` - English translations
- `src/assets/i18n/zh.json` - Chinese translations

## Testing Template Resolution Fix

### Create Test Structure

```bash
# Create test packages directory
mkdir -p /tmp/test_rwr/packages/vanilla/templates
mkdir -p /tmp/test_rwr/packages/vanilla/weapons
mkdir -p /tmp/test_rwr/packages/vanilla/textures
```

### Create Template File

```bash
cat > /tmp/test_rwr/packages/vanilla/templates/base.weapon << 'EOF'
<?xml version="1.0"?>
<weapon name="Base Weapon" class="0">
  <specification retrigger_time="0.1" magazine_size="30" />
</weapon>
EOF
```

### Create Weapon File with Template Reference

```bash
cat > /tmp/test_rwr/packages/vanilla/weapons/ak47.weapon << 'EOF'
<?xml version="1.0"?>
<weapon name="AK-47" file="../templates/base.weapon">
  <tag name="assault" />
  <hud_icon filename="hud_ak47.png" />
  <specification class="1" />
</weapon>
EOF
```

### Run Scan

```bash
# In Tauri dev, add /tmp/test_rwr as scan directory
# Expected: No "No such file or directory" errors
# Expected: AK-47 weapon with attributes from base.weapon
```

## Testing Parallel Scanning

### Performance Test

```bash
# Create many test files
for i in {1..100}; do
  cp /tmp/test_rwr/packages/vanilla/weapons/ak47.weapon \
     /tmp/test_rwr/packages/vanilla/weapons/weapon_$i.weapon
done

# Measure scan time
# Sequential: ~5-10 seconds
# Parallel: ~1-2 seconds (4-core CPU)
```

## Testing Active Directory Management

### Manual Test Steps

1. Add 3 directories in settings
2. Toggle 2 directories to inactive
3. Click "Rescan All"
4. Expected: Only 1 directory scanned
5. Expected: Progress shows "1 of 1 directories"

## Testing Package Count Display

### Validation Test

```bash
# Add directory with known structure
# /path/to/game/packages/
#   ├── vanilla/
#   ├── man_vs_zombies/
#   └── conquest/

# Expected: Settings shows "3 packages"
```

## Common Issues

### Issue: Template Resolution Still Fails

**Symptom**: "No such file or directory" errors persist

**Check**:
1. Verify `resolve_template()` receives `base_dir` parameter
2. Verify `parse_weapon_file()` passes `weapon_path.parent()`
3. Check for absolute paths in `@file` attributes (edge case)

**Fix**:
```rust
// In parse_weapon_file()
let weapon_parent = weapon_path
    .parent()
    .ok_or_else(|| anyhow::anyhow!("Cannot get parent directory"))?;

// Pass to resolve_template()
resolve_template(weapon_parent, &template_file, &mut visited)
```

### Issue: Parallel Scanning Hangs

**Symptom**: Scan starts but never completes

**Cause**: Infinite loop in parallel iteration

**Fix**: Ensure `.collect()` is called to consume iterator

```rust
// WRONG: Lazy iterator, never evaluated
let weapons = WalkDir::new(input_path)
    .into_iter()
    .par_bridge()
    .map(...);

// CORRECT: Consumes iterator
let weapons: Vec<_> = WalkDir::new(input_path)
    .into_iter()
    .par_bridge()
    .map(...)
    .collect();
```

### Issue: Active State Not Persisting

**Symptom**: Toggle reverts after restart

**Check**:
1. Verify `saveScanDirs()` includes `active` field
2. Verify `loadDirectories()` sets `active = true` as default

**Fix**:
```typescript
async saveScanDirs(directories: ScanDirectory[]): Promise<void> {
    const paths = directories.map(d => d.path);
    const states = Object.fromEntries(
        directories.map(d => [d.id, { active: d.active ?? true }])
    );
    await this.store.set('directory_states', states);
    // ...
}
```

## Code Review Checklist

- [ ] `resolve_template()` accepts `base_dir: &Path` parameter
- [ ] `rayon` dependency added to Cargo.toml
- [ ] Parallel scanning uses `.collect()` to consume iterator
- [ ] `ScanDirectory.active` field added to model
- [ ] `ScanDirectory.packageCount` field added to model
- [ ] `ValidationResult.package_count` added to Rust struct
- [ ] `Weapon.template_error` field added to Rust struct
- [ ] `Weapon.templateError` field added to TypeScript model
- [ ] `parse_weapon_file()` catches template errors and continues parsing
- [ ] `hasNoDirectories()` checks scan progress state
- [ ] ToggleLeft and Copy icons registered in `icons/index.ts`
- [ ] Detail drawer action buttons added (weapons + items)
- [ ] Template error warning alert in weapons detail drawer
- [ ] i18n keys added for "packages", "activeDirectory"
- [ ] Drawer image moved to content area (not top)

## Next Steps

After implementation:

1. Run full test suite: `cargo test && pnpm test`
2. Manual testing with real RWR game data
3. Performance benchmarking (before/after parallel)
4. Create pull request with branch `001-fix-data-scanning`

# Quickstart: Windows 单文件 EXE 编译产物上传

**Feature**: 011-add-windows-exe-upload
**Branch**: `011-add-windows-exe-upload`

## Prerequisites

- GitHub repository with existing Tauri 2.x project
- GitHub Actions workflow for releases (`.github/workflows/release.yml`)
- Tauri 2.x CLI
- Git access to push tags

## Implementation Steps

### 1. Modify GitHub Actions Workflow

**File**: `.github/workflows/release.yml`

**Change**: Update the Windows build step to include `--bundles exe` parameter

```yaml
# Find this section in the workflow
- name: Build and publish Tauri app
  uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tagName: ${{ github.ref_name }}
    releaseName: 'Version ${{ github.ref_name }}'
    releaseBody: 'See the assets to download this version and install.'
    releaseDraft: true
    prerelease: ${{ contains(github.ref_name, 'beta') || contains(github.ref_name, 'rc') || contains(github.ref_name, 'test') }}
    uploadUpdaterJson: true
    # MODIFIED: Add --bundles exe,nsis to generate both setup and EXE files
    args: --bundles exe,nsis ${{ matrix.args }}
```

**Note**: The change only affects the Windows platform build step. macOS and Linux builds remain unchanged.

### 2. Verify Configuration

**Check**: Ensure `tauri.conf.json` has the correct version

```json
{
  "productName": "rwr-toolbox",
  "version": "0.1.0",
  "identifier": "com.rwr-toolbox.app",
  ...
}
```

**Note**: The version number will be included in the generated file names.

### 3. Test the Workflow

#### Create Test Tag

```bash
# Create and push a test tag
git tag v0.1.0-test
git push origin v0.1.0-test
```

#### Monitor Build

1. Go to GitHub Actions tab
2. Find the "Release" workflow run
3. Wait for Windows build to complete
4. Check the build logs for any errors

#### Verify Artifacts

1. Go to the Releases page
2. Find the `v0.1.0-test` release
3. Verify both files are present:
   - `rwr-toolbox_0.1.0-test_x64-setup.exe`
   - `rwr-toolbox_0.1.0-test_x64.exe`

### 4. Test the EXE File

#### Download and Run

1. Download `rwr-toolbox_0.1.0-test_x64.exe`
2. Double-click to run
3. Verify the application launches correctly
4. Test core functionality

#### Check File Size

```bash
# On Windows
dir rwr-toolbox_0.1.0-test_x64.exe

# Expected: File size under 200MB
```

### 5. Cleanup Test Release

```bash
# Delete test tag (local and remote)
git tag -d v0.1.0-test
git push origin :refs/tags/v0.1.0-test

# Delete test release from GitHub UI
# 1. Go to Releases page
# 2. Find v0.1.0-test release
# 3. Click "Delete release"
```

## Common Issues

### Issue: Only Setup File Generated

**Symptom**: Only `rwr-toolbox_{version}_x64-setup.exe` is present, no EXE file

**Possible Causes**:
1. `--bundles exe` parameter not added correctly
2. Workflow not re-run after changes
3. Windows build failed (check logs)

**Solutions**:
1. Verify workflow YAML syntax
2. Re-push tag to trigger workflow
3. Check Windows build logs for errors

### Issue: EXE File Too Large (>200MB)

**Symptom**: EXE file exceeds 200MB size limit

**Possible Causes**:
1. WebView runtime embedded
2. Debug build instead of release build
3. Large assets bundled

**Solutions**:
1. Verify release build (not debug)
2. Review bundled assets in `tauri.conf.json`
3. Consider optimization if size is critical

### Issue: EXE File Won't Run

**Symptom**: EXE file shows error when launched

**Possible Causes**:
1. Missing WebView runtime
2. Corrupted download
3. Antivirus blocking

**Solutions**:
1. Install WebView2 runtime (if needed)
2. Re-download the file
3. Add to antivirus whitelist

### Issue: Build Time Increased Significantly

**Symptom**: Windows build takes much longer than before

**Possible Causes**:
1. Additional bundle target adds build time
2. Network issues downloading dependencies

**Solutions**:
1. Expected increase of ~20-30% is normal
2. Monitor build time metrics
3. If >150% increase, investigate further

## Code Review Checklist

- [ ] `.github/workflows/release.yml` modified with `--bundles exe,nsis`
- [ ] Change only affects Windows platform build step
- [ ] Workflow YAML syntax is valid
- [ ] Test tag created and pushed
- [ ] Both setup and EXE files generated
- [ ] EXE file can be run independently
- [ ] EXE file size under 200MB
- [ ] Build time under 150% of original
- [ ] Test release cleaned up

## Rollback Procedure

If issues arise after implementation:

1. **Revert Workflow Changes**:
   ```bash
   git checkout HEAD~1 -- .github/workflows/release.yml
   git commit -m "Rollback: Revert EXE bundle changes"
   git push
   ```

2. **Delete Problematic Release**:
   - Go to GitHub Releases page
   - Delete the release with problematic EXE

3. **Communicate**:
   - Notify users of the rollback
   - Document the issue for future reference

## Next Steps

After successful implementation:

1. Update documentation (README.md, CHANGELOG.md)
2. Announce new EXE download option to users
3. Monitor user feedback and issues
4. Consider additional optimizations if needed

## Production Deployment

1. Merge the feature branch to master
2. Create a production release tag
3. Verify both setup and EXE files are available
4. Update release notes to mention both download options
5. Monitor for user feedback

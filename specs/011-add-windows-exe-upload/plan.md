# Implementation Plan: Windows 单文件 EXE 编译产物上传

**Branch**: `011-add-windows-exe-upload` | **Date**: 2026-01-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-add-windows-exe-upload/spec.md`

## Summary

为项目的 CI/CD 流水线增加 Windows 单文件 EXE 编译产物上传功能，解决目前只有 setup 安装文件的问题。通过修改 GitHub Actions 工作流配置，在 Windows 平台构建时生成并上传单文件 EXE 到 GitHub Release，与现有的 setup 安装文件同时提供。

技术方法：在 `.github/workflows/release.yml` 中为 Windows 平台添加 `--bundles exe` 参数到 `tauri-action`，使其在构建 setup 文件的同时生成单文件 EXE 文件。

## Technical Context

**Language/Version**: TypeScript 5.8.3 (Angular v20.3.15), Rust Edition 2021 (Tauri 2.x)
**Primary Dependencies**: Tauri 2.x, tauri-apps/tauri-action@v0, GitHub Actions
**Storage**: N/A (CI/CD 流水线配置)
**Testing**: GitHub Actions workflow testing, manual testing of generated EXE files
**Target Platform**: Windows 64-bit (CI/CD runner: windows-latest)
**Project Type**: Desktop application (Tauri + Angular)
**Performance Goals**: 构建时间不超过现有 setup 文件构建时间的 150%
**Constraints**: 必须与现有 setup 文件同时提供，EXE 文件大小不超过 200MB
**Scale/Scope**: 仅影响 Windows 平台的 CI/CD 构建流程，不影响其他平台

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Review

✅ **Principle I - Desktop-First UI Design**: Not applicable (CI/CD feature, no UI changes)
✅ **Principle II - Internationalization (i18n)**: Not applicable (CI/CD feature, no UI changes)
✅ **Principle III - Theme Adaptability**: Not applicable (CI/CD feature, no UI changes)
✅ **Principle IV - Signal-Based State Management**: Not applicable (CI/CD feature, no code changes)
✅ **Principle V - Documentation-Driven Development**: Compliant (all changes documented in plan.md and research.md)
✅ **Principle VI - Icon Management**: Not applicable (CI/CD feature, no UI changes)
✅ **Principle VII - Tailwind-First Styling**: Not applicable (CI/CD feature, no UI changes)

### Technical Standards Compliance

✅ **Frontend Stack**: Not applicable (CI/CD feature, no frontend code changes)
✅ **Backend Stack**: Not applicable (CI/CD feature, no backend code changes)
✅ **Code Quality Standards**: Not applicable (CI/CD feature, no code changes)
✅ **Development Commands**: Not applicable (CI/CD feature, no command changes)

### Architecture Constraints Compliance

✅ **Signal-Only State in Services**: Not applicable (CI/CD feature, no code changes)
✅ **Immutable Data Updates**: Not applicable (CI/CD feature, no code changes)
✅ **Component Communication**: Not applicable (CI/CD feature, no code changes)
✅ **Error Handling**: Not applicable (CI/CD feature, no code changes)

### Result

**Status**: ✅ PASSED

No constitution violations detected. This feature is a pure CI/CD configuration change with no impact on application code, UI, or architecture.

## Project Structure

### Documentation (this feature)

```text
specs/011-add-windows-exe-upload/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (research findings)
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (implementation tasks - to be created)
```

### Source Code (repository root)

```text
# Modified files
.github/
└── workflows/
    └── release.yml      # Updated to include --bundles exe for Windows

# No new source files required
# No changes to src/ or src-tauri/ directories
```

**Structure Decision**: This is a CI/CD-only feature that modifies only the GitHub Actions workflow file. No changes to application source code (src/ or src-tauri/) are required. The modification is minimal and focused on adding the `--bundles exe` parameter to the Windows build step in the existing release workflow.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. This section is not applicable.

## Implementation Phases

### Phase 0: Research ✅ COMPLETED

**Status**: Completed
**Output**: [research.md](research.md)

**Completed Tasks**:
- Researched Tauri 2.x Windows single-file EXE generation options
- Investigated GitHub Actions artifact upload mechanisms
- Analyzed EXE file naming conventions
- Evaluated multiple implementation approaches
- Recommended solution: Use `--bundles exe` parameter in tauri-action

### Phase 1: Design

**Status**: In Progress
**Output**: This plan.md file

**Tasks**:
- Define implementation approach based on research findings
- Identify required configuration changes
- Plan testing strategy
- Document acceptance criteria

**Implementation Approach**:

1. **Modify `.github/workflows/release.yml`**:
   - Update the Windows platform build step to include `--bundles exe` parameter
   - Ensure both setup and EXE files are uploaded to GitHub Release
   - Maintain backward compatibility with existing workflow

2. **Configuration Changes**:
   - No changes to `tauri.conf.json` required (using default Tauri 2.x behavior)
   - Version information automatically included in file names

3. **Testing Strategy**:
   - Create a test tag to trigger the workflow
   - Verify that both setup and EXE files are generated
   - Verify that both files are uploaded to GitHub Release
   - Test that the EXE file can be run independently

**Acceptance Criteria**:
- GitHub Release contains both setup and EXE files for Windows
- EXE file name includes version number (e.g., `rwr-toolbox_0.1.0_x64.exe`)
- EXE file can be run without installation
- Build time does not exceed 150% of original setup build time
- EXE file size is under 200MB

### Phase 2: Implementation

**Status**: Pending
**Output**: tasks.md (to be created by `/speckit.tasks` command)

**Planned Tasks** (high-level):
1. Update `.github/workflows/release.yml` to include `--bundles exe` for Windows
2. Create test tag to validate workflow changes
3. Verify GitHub Release contains both setup and EXE files
4. Test EXE file functionality
5. Document any issues or limitations

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| EXE file requires WebView runtime not installed on user system | High | Medium | Document system requirements clearly in release notes |
| EXE file size exceeds 200MB limit | Medium | Low | Monitor file size during testing; if exceeded, consider optimization or alternative packaging |
| Build time increases significantly | Low | Medium | Track build time metrics; if exceeded, consider optimizing build process |
| Generated EXE file does not work independently | High | Low | Thorough testing on clean Windows system before release |

## Dependencies

**External Dependencies**:
- Tauri 2.x (already in use)
- tauri-apps/tauri-action@v0 (already in use)
- GitHub Actions (already in use)

**Internal Dependencies**:
- Existing `.github/workflows/release.yml` workflow
- Existing `src-tauri/tauri.conf.json` configuration

**Blocking Dependencies**: None

## Success Metrics

- **Build Success Rate**: 100% of Windows builds generate both setup and EXE files
- **File Availability**: 100% of GitHub Releases contain both setup and EXE files for Windows
- **File Size**: EXE file size under 200MB
- **Build Time**: Windows build time under 150% of original setup build time
- **User Satisfaction**: Positive feedback on EXE file availability and functionality

## Rollback Plan

If issues arise after implementation:

1. **Immediate Rollback**: Revert `.github/workflows/release.yml` changes
2. **Communication**: Notify users of the rollback via release notes
3. **Investigation**: Analyze root cause of issues
4. **Fix and Retest**: Implement fixes and retest before re-enabling feature

## Timeline Estimate

- **Phase 0 (Research)**: 0.5 days ✅ COMPLETED
- **Phase 1 (Design)**: 0.5 days ✅ COMPLETED
- **Phase 2 (Implementation)**: 1 day
- **Testing and Validation**: 0.5 days

**Total Estimated Time**: 2.5 days

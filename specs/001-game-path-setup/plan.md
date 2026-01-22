# Implementation Plan: Game Path Setup

**Branch**: `001-game-path-setup` | **Date**: 2026-01-22 | **Spec**: `specs/001-game-path-setup/spec.md`
**Input**: Feature specification from `specs/001-game-path-setup/spec.md`

## Summary

引入独立的“游戏安装目录”设置（不替代 scan directories），并让 Data 页（Weapons/Items）按“游戏目录（可选）+ 扫描目录列表”的组合扫描；当游戏目录缺失时，在 Local Mod 与 Dashboard 提供明确引导，避免用户迷路或功能静默失败。

## Technical Context

**Language/Version**: TypeScript 5.8.3 + Rust (edition 2021)  
**Primary Dependencies**: Angular v20.3.15, Transloco, TailwindCSS v4 + DaisyUI v5, Lucide Angular, Tauri 2.x, Tauri plugin-store  
**Storage**: Tauri plugin-store（settings.json）  
**Testing**: `pnpm tsc -p tsconfig.app.json --noEmit`, `cargo check` / `cargo test`  
**Target Platform**: Desktop (Tauri), macOS + Windows（并兼容 Linux）  
**Project Type**: Desktop app (Angular frontend + Tauri Rust backend)  
**Performance Goals**: Data 页在 800×600 下滚动/切换菜单保持流畅；避免离屏资源请求导致卡顿  
**Constraints**: 离线可用（本地文件扫描）；所有 UI 文案必须 i18n；状态管理使用 Signals  
**Scale/Scope**: 单用户桌面工具；目录数量通常 1–N（含游戏目录 + 扫描目录列表）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Desktop-First UI (800×600): 通过（新增引导/提示需保持不遮挡主要操作）
- i18n (Transloco): 通过（新增文案必须补齐 en/zh）
- Theme Adaptability (DaisyUI): 通过（提示/卡片使用 DaisyUI 组件类）
- Signals State Management: 通过（设置与目录状态继续在 service 层用 signals）
- Icon Management (Lucide registry): 通过（Dashboard/Settings 新图标需注册）
- Tailwind-first styling: 通过

Re-check post Phase 1: 无额外架构违例预期。

## Phase 0: Outline & Research

已产出：`specs/001-game-path-setup/research.md`

关键结论：

- 必须把“游戏安装目录”与“扫描目录列表”解耦，避免概念混淆。
- 验证逻辑必须覆盖 macOS .app 结构。
- Data 扫描必须支持组合目录并去重。

## Phase 1: Design & Contracts

已产出：

- `specs/001-game-path-setup/data-model.md`
- `specs/001-game-path-setup/contracts/ui-flows.md`
- `specs/001-game-path-setup/contracts/tauri-commands.md`
- `specs/001-game-path-setup/quickstart.md`

设计要点：

- 新增一个“游戏安装目录”字段进入 AppSettings（settings store），同时保留 scan_directories 列表。
- Dashboard 的“配置引导”与 Local Mod 的“缺失提示”统一用可跳转 Settings 的轻量提示。
- Data 页扫描源计算为去重后的 roots：game install dir（若配置且有效） + active scan dirs。

## Project Structure

### Documentation (this feature)

```text
specs/001-game-path-setup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── tauri-commands.md
│   └── ui-flows.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── mods/
│   │   ├── settings/
│   │   └── data/
│   ├── core/
│   │   └── services/
│   └── shared/
│       ├── guards/
│       └── models/

src-tauri/
└── src/
    ├── lib.rs
    ├── directories.rs
    ├── weapons.rs
    └── items.rs
```

**Structure Decision**: 采用现有 Angular + Tauri 的单仓结构，在 SettingsService/DirectoryService 扩展“游戏安装目录”字段，并在 Dashboard/Local Mod/Data 扫描处接入。

## Complexity Tracking

无（预期不需要引入额外架构层）。

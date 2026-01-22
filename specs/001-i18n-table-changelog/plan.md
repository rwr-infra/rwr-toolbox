# Implementation Plan: I18n Key Cleanup, Sticky Table Header, Changelog

**Branch**: `001-i18n-table-changelog` | **Date**: 2026-01-22 | **Spec**: specs/001-i18n-table-changelog/spec.md
**Input**: Feature specification from `specs/001-i18n-table-changelog/spec.md`

## Summary

本功能包含三部分：

1. 修复首页（Dashboard）存在的翻译 key/缺失翻译导致的“未国际化显示”问题，确保不再向用户展示原始 key。
2. 修复数据页（Items/Weapons）在滚动虚拟列表时表头突然消失的问题，保证表头稳定可见。
3. 新增仓库根目录 `CHANGELOG.md` 作为更新日志单一来源，并在 About 页面展示完整日志，在 Dashboard 展示最近更新摘要。

备注：`setup-plan.sh` 在本仓库会提示 “001 前缀的 specs 目录不唯一”。本项目历史上存在多个 `001-*` 目录，该提示不影响本分支的规划输出。

## Technical Context

**Language/Version**: TypeScript 5.8.3；Rust 2021 (用于 Tauri 侧，但本特性主要在前端)  
**Primary Dependencies**: Angular 20.3.x、@jsverse/transloco、Angular CDK（包含 virtual scroll）、Tailwind CSS、DaisyUI、lucide-angular、marked（用于 Markdown 渲染）  
**Storage**: 文件（`CHANGELOG.md`）+ 现有 i18n JSON（`src/assets/i18n/*.json`）  
**Testing**: Angular 单元测试（Karma/Jasmine）；可通过 `pnpm ng test` 执行（仓库未显式提供 `pnpm test` 脚本）  
**Target Platform**: Tauri 桌面应用 + Web 开发模式（ng serve）  
**Project Type**: 单体前端项目（Angular app）  
**Performance Goals**: 列表滚动保持流畅，滚动过程中表头稳定可见（无闪烁/消失）  
**Constraints**: 必须遵守 Constitution 的 i18n、桌面优先、主题适配、信号状态管理等约束  
**Scale/Scope**: 仅涉及 Dashboard、About、Items、Weapons 四个页面及其相关 i18n 与 changelog 展示

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Desktop-First UI Design：通过（不会引入需要横向滚动的额外结构；表格滚动行为更稳定）
- Internationalization (i18n)：通过（所有新增/调整文本使用 Transloco key；补齐 en/zh 翻译）
- Theme Adaptability：通过（使用 DaisyUI/Tailwind 语义类和变量；不引入硬编码颜色）
- Signal-Based State Management：通过（如需新增状态，遵循 signals；不引入 BehaviorSubject 作为主状态）
- Documentation-Driven Development：通过（规范文档输出到 specs；变更说明来源于 `CHANGELOG.md`）
- Icon Management：通过（沿用 lucide-angular 注册机制，不直接写 SVG）
- Tailwind-First Styling：通过（优先 Tailwind/DaisyUI 类）

结论：无必须豁免的宪法违规项（Complexity Tracking 不需要填写）。

## Project Structure

### Documentation (this feature)

```text
specs/001-i18n-table-changelog/
├── plan.md              # 本文件 (/speckit.plan)
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
├── contracts/           # Phase 1 输出
└── tasks.md             # Phase 2 输出 (/speckit.tasks) - 本命令不生成
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── about/
│   │   └── data/
│   │       ├── items/
│   │       └── weapons/
│   └── shared/
│       └── icons/
└── assets/
    └── i18n/

src-tauri/
└── (Tauri/Rust code)
```

**Structure Decision**: 单体 Angular 项目结构；本特性主要修改 `src/app/features/**` 和 `src/assets/i18n/**`，并在仓库根目录新增 `CHANGELOG.md`。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |

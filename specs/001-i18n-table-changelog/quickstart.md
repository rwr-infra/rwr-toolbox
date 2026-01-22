# Quickstart: I18n Key Cleanup, Sticky Table Header, Changelog

本 quickstart 用于实现阶段快速自测与维护指南。

## 1) 更新 i18n（Dashboard）

- 列出 Dashboard 使用到的所有翻译 key。
- 确保每个 key 同时存在于：
    - `src/assets/i18n/en.json`
    - `src/assets/i18n/zh.json`
- 验收：切换语言后，Dashboard 不出现原始 key 文本。

## 2) 修复 Items/Weapons 表头消失

- 目标：滚动虚拟列表时表头稳定可见、无闪烁。
- 建议实现思路：表头区域与虚拟滚动区域结构解耦，避免 sticky 处于 transform 上下文。
- 验收：
    - 在 Items 与 Weapons 页面分别持续滚动 30 秒，表头不消失。
    - 快速滚动/慢速滚动表现一致。

## 3) 新增并展示 CHANGELOG.md

- 在仓库根目录新增 `CHANGELOG.md`。
- 推荐格式见 `specs/001-i18n-table-changelog/contracts/changelog-format.md`。
- About：展示完整日志。
- Dashboard：展示最近更新摘要。
- 验收：
    - `CHANGELOG.md` 有数据时 About 与 Dashboard 均可读。
    - `CHANGELOG.md` 为空/解析失败时显示空态且页面可用。

## 4) 运行/自测建议

- 本仓库使用 pnpm：
    - `pnpm start`（Web 开发模式）
    - `pnpm tauri dev`（桌面模式）
- 可选：`pnpm ng test` 运行前端单元测试（仓库未提供 `pnpm test` script）。

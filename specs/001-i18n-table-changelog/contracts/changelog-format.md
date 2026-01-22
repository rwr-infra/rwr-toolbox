# Contract: CHANGELOG.md Format

本文件定义 `CHANGELOG.md` 的约定格式，用于 About（完整展示）与 Dashboard（摘要预览）解析与展示。

## Goals

- 人工可编辑（Markdown）
- 可以稳定解析“版本/日期/条目”用于 UI 展示
- 解析失败时可降级为“纯文本展示/空态”，不影响页面可用性

## Recommended Structure (Markdown)

- 顶层标题：`# Changelog`
- 每个版本使用二级标题：
    - `## [<version>] - <YYYY-MM-DD>`
    - 或 `## [Unreleased]`
- 每个版本下可选三级标题作为分组：
    - `### Added`
    - `### Changed`
    - `### Fixed`
    - `### Removed`
- 分组内用无序列表描述条目：
    - `- 修复 xxx`

## Parsing Contract

- 解析器应至少识别：
    - 版本标题（`##`）
    - 分组标题（`###`）
    - 列表项（`-`）
- 如果无法完整解析：
    - About：允许回退为渲染整份 Markdown。
    - Dashboard：允许显示“暂无更新日志/解析失败”的空态。

# Phase 1 Data Model: I18n Key Cleanup, Sticky Table Header, Changelog

本特性主要是 UI 展示与内容来源整理，不涉及持久化数据库。

## Entity: TranslationKey

**Purpose**: 统一管理 UI 文案的 key，确保不同语言下都有对应翻译。

**Fields**:

- `key`: string（层级 dot notation，例如 `dashboard.quickActions`）
- `description`: string（该文案在 UI 的用途说明）
- `languages`: object
    - `en`: string（英文翻译）
    - `zh`: string（中文翻译）

**Validation Rules**:

- 所有 user-facing 文本必须通过 TranslationKey 引用。
- 同一 `key` 必须在英文与中文翻译中都存在。

## Entity: ChangelogDocument

**Purpose**: 从 `CHANGELOG.md` 提供更新日志内容，供 About（完整）与 Dashboard（摘要）展示。

**Fields**:

- `sourcePath`: string（固定为仓库根目录 `CHANGELOG.md`）
- `entries`: ChangelogEntry[]（从文档解析出的条目列表）
- `lastUpdatedAt`: datetime（可选：用于 UI 展示“最后更新时间”）

**Validation Rules**:

- 文档为空/不可解析时，`entries` 为空数组且 UI 显示明确空态。

## Entity: ChangelogEntry

**Purpose**: 表示一次版本或一次发布的更新摘要。

**Fields**（建议从 Markdown 结构推导，最小集合）:

- `version`: string（例如 `0.9.0`，或 `Unreleased`）
- `date`: string（例如 `2026-01-22`，可选）
- `sections`: ChangelogSection[]（例如 Added/Fixed/Changed 等）

**Validation Rules**:

- `version` 必填；`date` 可选。
- `sections` 可为空，但 About 页面仍应可展示 entry 标题。

## Entity: ChangelogSection

**Fields**:

- `title`: string（例如 `Fixed` / `Added`）
- `items`: string[]（每条更新文本）

## Entity: VirtualTableView (Conceptual)

**Purpose**: 描述 Items/Weapons 的“表头区域”和“可滚动数据行区域”之间的结构关系，确保滚动稳定。

**Attributes**:

- `headerArea`: 固定渲染区域（不随数据行滚动，不受 transform 影响）
- `bodyArea`: 可滚动区域（虚拟滚动只作用于数据行）

**Validation Rules**:

- 任何滚动行为不得导致表头消失/闪烁。
- 列宽对齐需保持一致（必要时通过一致的列定义实现）。

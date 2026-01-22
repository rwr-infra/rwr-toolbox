---
description: 'Tasks for implementing i18n fixes, table header fix, and changelog'
---

# Tasks: I18n Key Cleanup, Sticky Table Header, Changelog

**Input**: Design documents from `/Users/zhao/Documents/personal-projects/rwr-toolbox/specs/001-i18n-table-changelog/`
**Prerequisites**: `/Users/zhao/Documents/personal-projects/rwr-toolbox/specs/001-i18n-table-changelog/plan.md`, `/Users/zhao/Documents/personal-projects/rwr-toolbox/specs/001-i18n-table-changelog/spec.md`

**Tests**: 本任务列表不包含自动化测试任务（spec 未要求 TDD/测试优先）。每个 User Story 都包含可独立执行的手工验收步骤。

**组织方式**: 按 User Story 分组，确保每个故事可独立实现与验收。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 先对现有实现做定位，避免重复造轮子/破坏现有行为。

- [x] T001 盘点现有 changelog 读取与展示链路：`src-tauri/src/lib.rs`、`src/app/features/about/about.component.ts`、`src/app/features/about/about.component.html`、`src/app/features/dashboard/services/dashboard.service.ts`、`src/app/features/dashboard/dashboard.component.html`
- [x] T002 盘点表格滚动与表头相关 DOM 结构：`src/app/features/data/items/items.component.html`、`src/app/features/data/weapons/weapons.component.html`
- [x] T003 盘点 Dashboard 现有 i18n key 使用点（模板+服务）：`src/app/features/dashboard/dashboard.component.html`、`src/app/features/dashboard/services/dashboard.service.ts`
- [x] T004 确认 i18n 资源文件存在且可编辑：`src/assets/i18n/en.json`、`src/assets/i18n/zh.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 为后续故事提供共用的基础能力/合规性修正（i18n + 资源打包）。

- [x] T005 将 `CHANGELOG.md` 加入 Tauri 资源打包（确保生产环境可读取）：`src-tauri/tauri.conf.json`
- [x] T006 [P] 新增/补齐 About/Dashboard 会用到的 changelog 文案翻译 key（含英文/中文）：`src/assets/i18n/en.json`、`src/assets/i18n/zh.json`
- [x] T007 [P] 新增/补齐 Dashboard 统计卡片/活动区使用到但可能缺失的翻译 key（含英文/中文）：`src/assets/i18n/en.json`、`src/assets/i18n/zh.json`

**Checkpoint**: 基础合规项就绪（资源可读取 + 关键 i18n key 可用）。

---

## Phase 3: User Story 1 - Data Tables Keep Headers Visible While Scrolling (Priority: P1) 🎯 MVP

**Goal**: Items/Weapons 表格在滚动虚拟列表时，表头稳定可见，不再闪烁/消失。

**Independent Test**: 分别打开 Items 与 Weapons 页面，持续滚动 30 秒（快速/慢速各一次），观察表头始终可见且不闪烁。

### Implementation for User Story 1

- [x] T008 [US1] 重构 Items 表格结构：将表头渲染与虚拟滚动区域解耦，避免 sticky 受 transform 影响：`src/app/features/data/items/items.component.html`
- [x] T009 [US1] 为 Items 表格补齐必要的样式/布局（如列对齐、背景、层级），确保表头与表体列对齐且不抖动：`src/app/features/data/items/items.component.scss`
- [x] T010 [US1] 若 Items 的表头/表体需要共享“可见列”计算，抽取为组件内稳定的可复用绑定（避免滚动时频繁重算导致闪烁）：`src/app/features/data/items/items.component.ts`
- [x] T011 [P] [US1] 重构 Weapons 表格结构：将表头渲染与虚拟滚动区域解耦，避免 sticky 受 transform 影响：`src/app/features/data/weapons/weapons.component.html`
- [x] T012 [P] [US1] 为 Weapons 表格补齐必要的样式/布局（如列对齐、背景、层级），确保表头与表体列对齐且不抖动：`src/app/features/data/weapons/weapons.component.scss`
- [x] T013 [P] [US1] 若 Weapons 的表头/表体需要共享“可见列”计算，抽取为组件内稳定的可复用绑定（避免滚动时频繁重算导致闪烁）：`src/app/features/data/weapons/weapons.component.ts`
- [ ] T014 [US1] 验证切换显示列后表头仍稳定且列对齐（含快速滚动场景）：`src/app/features/data/items/items.component.html`
- [ ] T015 [US1] 验证切换显示列后表头仍稳定且列对齐（含快速滚动场景）：`src/app/features/data/weapons/weapons.component.html`

**Checkpoint**: Items 与 Weapons 页面滚动过程中表头稳定可见。

---

## Phase 4: User Story 2 - Dashboard Shows Fully Localized Text (Priority: P2)

**Goal**: Dashboard 所有可见文案都使用 Transloco，且 en/zh 都有对应翻译；不再展示 raw key 或英文硬编码。

**Independent Test**: 在 Dashboard 页面切换语言（至少 en/zh），确认所有按钮/标题/提示/活动描述都显示为可读文本，且不出现 raw key。

### Implementation for User Story 2

- [x] T016 [US2] 枚举 Dashboard 模板中所有 `t('...')` 的 key，并与 i18n 文件对照补齐：`src/app/features/dashboard/dashboard.component.html`
- [x] T017 [US2] 修复/统一 Dashboard 模板中不符合项目约定且导致缺失翻译的 key（必要时迁移为层级 dot key）：`src/app/features/dashboard/dashboard.component.html`
- [x] T018 [P] [US2] 补齐 Dashboard 相关翻译条目（英文）：`src/assets/i18n/en.json`
- [x] T019 [P] [US2] 补齐 Dashboard 相关翻译条目（中文）：`src/assets/i18n/zh.json`
- [x] T020 [US2] 校验 Dashboard 活动区 changelog 文案 key（例如 latest update / view details 等）在多语言下可正常渲染：`src/app/features/dashboard/services/dashboard.service.ts`

**Checkpoint**: Dashboard 切换语言后无 raw key、无硬编码英文。

---

## Phase 5: User Story 3 - Users Can View Update Log in About and See Latest Updates on Dashboard (Priority: P3)

**Goal**: 新增根目录 `CHANGELOG.md` 作为单一来源；About 展示完整更新日志；Dashboard 能看到“最近更新”摘要（允许复用现有 Recent Activity）。

**Independent Test**: 在 `CHANGELOG.md` 填入至少 2 个版本条目后：

- 打开 About：看到完整日志。
- 打开 Dashboard：看到最近更新摘要（或 Recent Activity 中出现 latest update）。

### Implementation for User Story 3

- [x] T021 [US3] 新增根目录更新日志文件并写入初始内容（符合约定格式）：`CHANGELOG.md`
- [x] T022 [US3] 将 About 页中硬编码的 “Version History” 文案改为 i18n key：`src/app/features/about/about.component.html`
- [x] T023 [US3] 将 About 页加载失败 fallback 文案改为 i18n（不要在组件里硬编码英文 HTML 字符串）：`src/app/features/about/about.component.ts`
- [x] T024 [P] [US3] 补齐 About 页 changelog 相关翻译条目（英文/中文）：`src/assets/i18n/en.json`、`src/assets/i18n/zh.json`
- [x] T025 [US3] 确认 Dashboard “最近更新”来源于 `get_changelog` 且不会重复插入（必要时调整去重逻辑）：`src/app/features/dashboard/services/dashboard.service.ts`
- [x] T026 [US3] 若 Dashboard 需要独立的 “Latest Updates” 预览卡片（不依赖 Recent Activity），新增该展示区并使用 i18n key：`src/app/features/dashboard/dashboard.component.html`

**Checkpoint**: About 可读完整 changelog；Dashboard 可见最近更新摘要；无数据/失败时显示明确空态且不破坏页面。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 收尾与全局一致性检查。

- [x] T027 [P] 全局检查本次新增/修改的用户可见文案均为 i18n key（禁止硬编码英文/中文）：`src/app/features/about/about.component.html`
- [x] T028 [P] 全局检查本次新增/修改的用户可见文案均为 i18n key（禁止硬编码英文/中文）：`src/app/features/dashboard/dashboard.component.html`
- [x] T029 跑一次格式化检查（或按需格式化），避免大 diff：`package.json`
- [ ] T030 按 quickstart 做一次端到端人工验收（覆盖 US1/US2/US3）：`specs/001-i18n-table-changelog/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → 建议先做（避免误改）
- Foundational (Phase 2) → 建议优先完成（资源打包 + i18n 基础 key），然后进入各 User Story
- User Stories:
    - US1 (P1) 可在 Phase 1 后立即开始（与 changelog 关系较弱）
    - US2 (P2) 建议在 Phase 2 的 i18n key 基础补齐后开始
    - US3 (P3) 建议在 Phase 2 的资源打包（T005）后开始
- Polish (Phase 6) → 在完成目标故事后进行

### User Story Dependencies

- US1: 无依赖（仅影响 Items/Weapons 表格）
- US2: 依赖 `src/assets/i18n/en.json`、`src/assets/i18n/zh.json` 的条目补齐
- US3: 依赖 `CHANGELOG.md` 存在；生产场景依赖 `src-tauri/tauri.conf.json` 资源打包

---

## Parallel Opportunities

- Phase 2 的 i18n 补齐（T006/T007）可与表格结构分析并行。
- US1 中 Items 与 Weapons 的实现（T008-T013）可并行（不同目录/文件）。
- US2 中 en/zh 翻译补齐（T018/T019）可并行。
- US3 中 About 与 Dashboard 的展示修正（T022-T026）可部分并行（不同文件）。

---

## Parallel Example: User Story 1

```bash
# 可并行推进（不同文件）：
Task: "[US1] Refactor Items table header/body in src/app/features/data/items/items.component.html"
Task: "[US1] Refactor Weapons table header/body in src/app/features/data/weapons/weapons.component.html"
```

## Parallel Example: User Story 2

```bash
# 可并行推进（不同文件）：
Task: "[US2] Add missing dashboard translations in src/assets/i18n/en.json"
Task: "[US2] Add missing dashboard translations in src/assets/i18n/zh.json"
```

## Parallel Example: User Story 3

```bash
# 可并行推进（不同文件）：
Task: "[US3] Add root changelog file at CHANGELOG.md"
Task: "[US3] i18n-ize About changelog UI in src/app/features/about/about.component.html"
```

---

## Implementation Strategy

### MVP First (US1)

1. 先做 US1（表头不消失）→ 立刻验收滚动稳定性。
2. 然后补 US2（Dashboard i18n）→ 验收语言切换。
3. 最后完成 US3（changelog 单一来源 + About/Dashboard 展示）。

### Incremental Delivery

- 每完成一个 User Story 都要做一次独立验收（见各 story 的 Independent Test）。
- 避免把“i18n 补齐 / UI 调整 / changelog 展示”混在一个巨大提交里；按 story 递增更好回滚。

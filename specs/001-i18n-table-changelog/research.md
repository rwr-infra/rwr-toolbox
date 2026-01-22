# Phase 0 Research: I18n Key Cleanup, Sticky Table Header, Changelog

本文件用于消除规划阶段的不确定性，并给出可执行的设计决策（包含备选方案）。

## Decision 1: Items/Weapons 表头消失修复策略

**Decision**: 将“表头渲染”和“虚拟滚动列表渲染”结构解耦：表头不放在会被 CDK virtual scroll transform 影响的容器中，避免 `position: sticky` 在 transform 上下文中失效或闪烁。

**Rationale**:

- `cdk-virtual-scroll-viewport` 通常通过 transform/translate 来定位可视区域内容；sticky 在包含 transform 的祖先/相关容器中可能表现异常。
- 当前实现把 `<thead>` 放在 viewport 内部，滚动时可能出现表头被遮挡、重绘闪烁、短暂消失。
- 解耦后表头作为固定区域渲染，滚动仅作用于数据行区域，行为更可控、更稳定。

**Alternatives considered**:

- A) 仅通过 CSS 提升 `z-index`/背景色：对“消失”类问题不一定有效，且可能只治标。
- B) 取消虚拟滚动：会明显回退性能优化目标。
- C) 使用非 table 的 div-grid：实现成本高，且会影响现有表格语义与样式。

## Decision 2: Dashboard 翻译缺失/错误 key 的处理策略

**Decision**: 对 Dashboard 使用的所有 i18n key 做一次“引用清单”核对：

- 逐个确认 key 在 `en.json` 与 `zh.json` 均存在。
- 对不符合现有规范（如下划线命名）且导致缺失的 key，统一迁移到项目约定的层级 dot key（同时保留兼容映射的时间窗口视需要而定）。

**Rationale**:

- 宪法要求运行时 i18n 且 en/zh 必须同时补齐。
- Dashboard 是入口页，缺失翻译影响最大。

**Alternatives considered**:

- A) 仅在缺失时显示英文硬编码：违反 i18n 非硬编码原则。
- B) 仅新增缺失 key 不改命名：可行但会延续不一致的 key 规范；后续维护成本更高。

## Decision 3: 更新日志的单一来源与展示方式

**Decision**:

- 在仓库根目录新增 `CHANGELOG.md` 作为单一来源。
- About 页面展示完整 changelog。
- Dashboard 展示最近 N 条（或最近 1-2 个版本）的摘要预览。

**Rationale**:

- 单一来源避免 About/Dashboard 分别维护两份内容。
- Markdown 适合人手编辑与版本控制；项目依赖中已包含 `marked`，可用于渲染。

**Alternatives considered**:

- A) 用 JSON/YAML 结构化存储：解析更简单但编辑体验与生态不如 Markdown。
- B) 仅在 About 展示：Dashboard 无法快速看到“最近更新”。

## Open Questions

- 无（本次计划阶段不保留 NEEDS CLARIFICATION；实现阶段如遇到现有 UI 结构限制，再在 tasks 阶段拆分具体方案）。

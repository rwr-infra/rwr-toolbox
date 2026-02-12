# UI / UX Specification — RWR Toolbox

你是一名资深桌面客户端 UI/UX 设计师，
同时精通 Angular 项目结构、Tailwind CSS v4 以及 DaisyUI v5。

请基于以下技术栈与约束，为一个「桌面客户端 · 游戏工具箱增强应用」
设计 **可直接落地、可被 LLM 稳定实现** 的前端 UI 方案。

---

## 【技术栈（不可偏离）】

- Framework: Angular v20
- Styling: Tailwind CSS v4
- UI Components: DaisyUI v5
- Icons: lucide-angular（集中注册）
- 运行环境：Desktop Application（Tauri，**非 Web / 非 Mobile**）

---

## 【产品定位】

- 工具型桌面客户端，用于管理和增强游戏工具
- 面向核心玩家 / 高级用户 / MOD 使用者
- 长时间运行、高频操作
- 常与游戏同时运行（窗口化 / 多窗口并存）

---

## 【分辨率约束（非常重要）】

- **最小支持分辨率**: 800 × 600
- **默认启动分辨率**: 800 × 600
- **推荐分辨率**: 1280 × 720 或更高
- **最大支持分辨率**: 3840 × 2160 (4K)

### 强制要求

- UI 在 800 × 600 下 **完全可用**
- UI 在 4K (3840 × 2160) 下 **布局正确、元素不拥挤**
- 禁止出现横向滚动条
- 禁止内容被裁剪或溢出窗口
- 各区域允许 **独立纵向滚动**

### 4K 适配策略

- 对于 > 1920 × 1080 的显示器，考虑设置最大宽度约束
- 表格列宽保持合理，避免在大屏幕上过度拉伸
- 字体大小保持可读性（避免使用绝对 px，优先使用 rem/em 或 Tailwind 响应式类）
- 模态框在大屏幕上应有最大宽度限制

---

## 【设计目标】

- 工具感强、工程化、稳定
- 高信息密度但可读性好
- 低视觉噪音，避免花哨
- 操作路径清晰、可预测
- 适合长时间连续使用

---

## 【设计约束（非常重要）】

- 明确是 **desktop-first UI**
- 优先键盘操作、快捷键友好
- 使用功能分区布局（导航区 / 工作区 / 状态区）
- 使用 DaisyUI 现有组件语义：
  `card / menu / tabs / table / drawer / modal / alert`
- 尽量通过 Tailwind utility 组合，而非自定义 CSS
- 动画极少，仅用于状态反馈
- 避免游戏 HUD / 赛博 / 炫酷视觉
- 所有设计必须前端 **可实现**

---

## 【核心功能区域】

1. **左侧导航区**
   - 工具 / 模块列表
   - 固定宽度（约 200px）
   - 文本溢出使用 `truncate`

2. **主工作区**
   - 当前工具配置
   - 参数调整 / 表单 / 表格
   - 独立滚动容器

3. **辅助区**
   - 日志输出
   - 运行状态
   - 错误与调试信息

4. **全局区**
   - 搜索
   - 快捷操作
   - 全局状态指示（连接 / 运行中 / 错误）

---

## 【Desktop Layout Skeleton（强制结构锚点）】

所有 UI 设计与实现 **必须明确对应以下结构层级**，
禁止随意引入新的宏观布局结构。

```txt
AppShellComponent
├─ SidebarNavigationComponent
├─ MainWorkspaceComponent
│   ├─ ToolbarComponent
│   └─ ContentAreaComponent
├─ AuxiliaryPanelComponent
└─ StatusBarComponent
```

> 任何组件在设计说明或实现中，必须标明其归属层级。

---

## 【DaisyUI 组件使用规范】

### 优先使用（白名单）

- Layout：`drawer`, `navbar`, `footer`
- Navigation：`menu`, `tabs`, `breadcrumbs`
- Data Display：`card`, `table`, `badge`
- Feedback：`alert`, `loading`, `tooltip`
- Actions：`btn`, `dropdown`, `modal`

### 禁止行为

- 手写仿 `card / table / menu` 的结构
- 引入非 DaisyUI 的第三方 UI 组件
- 绕过 DaisyUI 语义仅使用裸 div 布局

---

## 【Tailwind / CSS 使用决策顺序（强制）】

在进行样式设计时，必须按以下顺序判断：

1. 是否已有 DaisyUI 组件可以直接表达？
2. 是否可以通过 Tailwind utility 组合实现？
3. 是否可以通过 Angular `@HostBinding` 动态绑定？
4. 是否 **确实无法** 用 Tailwind 表达？

➡️ **只有第 4 点成立时，才允许自定义 CSS。**

禁止：
- 创建重复 Tailwind 功能的自定义 class
- 在 `styles: []` 中写布局 / 间距 / 排版样式

---

## 【国际化要求（i18n）— NON-NEGOTIABLE】

- 语言支持：英文（默认）、中文（可切换）
- 实现方式：Transloco（Angular 运行时 i18n）
- 翻译文件路径：
  - `src/assets/i18n/en.json`
  - `src/assets/i18n/zh.json`

### 强制规则

- **所有用户可见文本必须国际化**
- 禁止模板或 TS 中出现硬编码文本
- 语言切换位于「设置」页面
- 首次启动：检测系统语言并引导确认

### i18n Key 命名规范

- 使用层级点命名法：
  - `app.title`
  - `menu.tools`
  - `status.apiConnected`
  - `error.fileNotFound`

### 防偷懒约束（LLM 必须遵守）

- 每新增一个 key，必须同时提供：
  - 英文文案
  - 中文文案
- 禁止使用占位翻译（如 TODO / 待翻译）
- 禁止复用语义不一致的旧 key

---

## 【Angular 组件拆分建议】

- Container / Presentational 分离
- Container：
  - 负责状态、Signals、服务交互
- Presentational：
  - 仅接收 Input signals
  - 仅触发 Output events
  - 不直接访问 Service

---

## 【组件设计原则（区域级）】

### 左侧导航区

- 使用 `menu`
- 支持键盘上下选择
- 当前项高亮
- 文本超长使用 `truncate`

### 主工作区

- 使用 `card` / `tabs` / `table`
- 表格支持 sticky header
- 表单使用紧凑布局（`text-sm` / `gap-2`）

### 辅助区

- 可折叠 / 可隐藏
- 日志使用等宽字体
- 自动滚动但支持暂停

### 状态区

- 高度固定
- 显示运行状态 / 错误
- 使用 `badge` / `alert`

---

## 【LLM UI Execution Contract（关键）】

当你作为 AI 被要求 **设计或实现 UI** 时，必须遵守以下规则：

### UI 输出范围

- 仅实现当前需求涉及的 UI
- 禁止生成完整应用或未来功能 UI
- 禁止主动扩展产品范围

### UI 粒度

- 以 Angular Component 为最小单元
- 单一职责、可复用、可国际化
- 禁止「万能组件」或「巨型页面」

### 输出目标

你的目标不是“好看”，而是：

> **稳定、可维护、高信息密度、工程友好。**

---

## 【可选：HTML 结构示例（非完整代码）】

```html
<div class="drawer drawer-open h-screen">
  <aside class="w-[200px] menu bg-base-200 shrink-0">
    <!-- Sidebar -->
  </aside>

  <main class="flex flex-col flex-1 overflow-hidden max-w-[2560px]">
    <!-- max-w for 4K: prevent excessive stretching -->
    <header class="navbar bg-base-100">
      <!-- Toolbar -->
    </header>

    <section class="flex-1 overflow-auto p-4">
      <!-- Content -->
    </section>

    <footer class="h-8 bg-base-200 text-xs">
      <!-- Status bar -->
    </footer>
  </main>
</div>
```

---

## 【结语】

本 UI 规范不仅是设计说明，
而是 **AI 与人类共同开发时的可执行 UI 合约**。

任何 UI 实现，
都必须以本文件为最高 UI 权威来源。
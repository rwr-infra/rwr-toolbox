# Research: Game Path Setup

Created: 2026-01-22

## Decision: 单独引入“游戏安装目录”设置（不替代 scan directories）

Rationale:

- Local Mod 依赖“基础游戏安装目录”，但现有实现里 `ModService.getGamePath()` 其实取的是第一个 valid 的 scan directory，这会把“扫描源目录”和“安装目录”混为一谈，导致用户配置含义不清。
- 保留 scan directories 作为“可叠加的数据源列表”（用于 Data 页的聚合扫描）。

Alternatives considered:

- 直接把 scan directories 的第一个条目当作 game path：实现简单，但概念不清、容易配置错误。

## Decision: 设置存储优先使用现有 app_settings（SettingsService）并兼容 DirectoryService 的 scan_directories

Rationale:

- 当前系统有两套持久化：
    - `SettingsService` 使用 plugin-store 的 `app_settings` 维护更完整的 AppSettings（含 scanDirectories 对象、selectedDirectoryId 等）。
    - `DirectoryService` 另存了一个路径列表 `scan_directories`。
- 本 feature 增加的新“游戏安装目录”应进入 AppSettings，避免再引入第三套 store key。
- scan directories 的两套来源需明确优先级与同步策略，避免状态漂移。

Alternatives considered:

- 只使用 scan_directories：会丢失 AppSettings 的附加字段（例如 displayName/status/active），且与已有 SettingsService API 不一致。

## Decision: 游戏安装目录验证需覆盖跨平台目录结构（尤其 macOS .app）

Rationale:

- macOS 下基础资源可能在 `RunningWithRifles.app/Contents/Resources/media/packages`。
- Windows/Linux 常见结构为 `<game>/media/packages`。
- 现有 Data 扫描已具备“多 root packages”解析策略；验证逻辑应复用同一策略，确保“验证通过 == 扫描可用”。

Alternatives considered:

- 仅验证 `<game>/media` 是否存在：macOS .app 场景会误判。

## Decision: Data 扫描源组合为（game install dir 可选）+（scan directories 列表），并对结果去重

Rationale:

- 用户期望 Data 页覆盖基础游戏内容 + 额外目录内容。
- 多目录可能存在重叠内容（例如同一个 package 在多个位置），需要去重避免重复行。

Alternatives considered:

- 简单 concat 不去重：会导致 UI 重复、统计不准确。

## Decision: Dashboard/Local Mod 采用“引导 + 可跳转 Settings”的轻量提示

Rationale:

- Dashboard 当前无 onboarding banner，仅有 Quick Actions。
- Local Mod 目前既有页面内提示，又有路由 guard 直接重定向；需要统一为“用户可理解、可操作”的提示路径。

Alternatives considered:

- 全部改为强制 guard 重定向：会隐藏页面内提示，且用户更难理解缺失原因。

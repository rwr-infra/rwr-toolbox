# Data Model: Game Path Setup

Created: 2026-01-22

## Entities

### Game Installation Directory

Represents: 用户配置的基础游戏安装目录（单个值）。

Key attributes:

- Path (string)
- Validation status (valid/invalid/unknown)
- Last validation message (string, optional)

State transitions:

- Unset -> Set (pending validation)
- Set -> Valid
- Set -> Invalid
- Valid -> Invalid (path becomes unavailable)
- Any -> Unset (user clears)

### Scan Directory

Represents: 用户配置的扫描源目录列表（多个值），用于 Data 页聚合扫描。

Key attributes:

- Path (string)
- Enabled/active (boolean)
- Status (valid/invalid/pending)
- Display name (string)

Relationships:

- Data scan uses: (Game Installation Directory, optional) + (all active scan directories)

## Derived Data

### Combined Scan Roots

Derived from:

- Game Installation Directory (if configured and valid)
- Active Scan Directories (valid)

Rules:

- Must be de-duplicated by canonical path
- Must support cross-platform game content layout (macOS .app + media/packages)

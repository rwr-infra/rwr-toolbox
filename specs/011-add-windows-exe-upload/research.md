# Research: Windows 单文件 EXE 编译产物上传

**Feature**: [spec.md](spec.md)
**Date**: 2026-01-23
**Status**: In Progress

## Research Questions

1. 如何配置 Tauri 2.x 生成 Windows 单文件 EXE？
2. 如何在 GitHub Actions 中上传额外的构建产物？
3. 如何确保 EXE 文件名包含版本号信息？

## Findings

### 1. Tauri 2.x Windows 单文件 EXE 配置

根据 Tauri 2.x 文档，可以通过以下方式配置 Windows 单文件 EXE：

**方法 1: 使用 `bundle` 配置中的 `targets`**

在 `tauri.conf.json` 中，可以指定不同的打包目标：

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "windows": {
      "webviewInstallMode": {
        "type": "embedBootstrapper"
      }
    }
  }
}
```

**方法 2: 使用 `tauri build` 命令参数**

Tauri 2.x 支持通过命令行参数控制打包格式：

```bash
tauri build --bundles nsis,msi
```

但是，Tauri 2.x 默认不直接支持"单文件 EXE"格式。常见的 Windows 打包格式包括：
- `nsis`: NSIS 安装程序（默认）
- `msi`: MSI 安装程序
- `exe`: 可执行文件（需要额外配置）

**方法 3: 使用 `--bundles exe` 参数**

根据 Tauri 文档，可以使用 `--bundles exe` 来生成单文件 EXE：

```bash
tauri build --bundles exe
```

这将生成一个独立的 EXE 文件，不包含安装程序。

### 2. GitHub Actions 上传额外产物

当前工作流使用 `tauri-apps/tauri-action@v0` 来构建和发布应用。这个 action 会自动上传所有生成的产物到 GitHub Release。

但是，如果需要上传额外的产物（如单独的 EXE 文件），可以：

**方法 1: 修改 `tauri-action` 参数**

`tauri-action` 支持自定义打包目标：

```yaml
- name: Build and publish Tauri app
  uses: tauri-apps/tauri-action@v0
  with:
    args: --bundles exe,nsis ${{ matrix.args }}
```

**方法 2: 使用 GitHub Actions 的 `upload-artifact` 和 `gh release upload`**

```yaml
- name: Upload Windows EXE
  if: matrix.platform == 'windows-latest'
  run: |
    gh release upload ${{ github.ref_name }} src-tauri/target/release/bundle/exe/*.exe
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. EXE 文件名包含版本号

Tauri 会自动在产物文件名中包含版本号。版本号来自 `tauri.conf.json` 中的 `version` 字段。

当前配置：
```json
{
  "version": "0.1.0"
}
```

生成的文件名格式：
- `rwr-toolbox_0.1.0_x64-setup.exe` (NSIS 安装程序)
- `rwr-toolbox_0.1.0_x64.exe` (单文件 EXE)

### 4. Tauri 2.x 单文件 EXE 的限制

根据 Tauri 文档和社区讨论：

- Tauri 2.x 默认不支持真正的"单文件 EXE"格式（像 Electron 的 `electron-builder` 那样）
- `--bundles exe` 参数生成的仍然是需要 WebView 运行时的 EXE
- 要实现真正的便携式 EXE，可能需要：
  1. 使用 `webviewInstallMode: { type: "embedBootstrapper" }` 嵌入 WebView
  2. 或者使用第三方工具（如 `Enigma Virtual Box`）打包

### 5. 推荐方案

基于以上研究，推荐以下方案：

**方案 A: 使用 Tauri 的 `--bundles exe` 参数**

优点：
- 原生支持，无需额外工具
- 与现有 CI/CD 流程集成简单

缺点：
- 生成的 EXE 仍然需要 WebView 运行时
- 文件大小可能较大

**方案 B: 使用 `webviewInstallMode: embedBootstrapper`**

优点：
- 嵌入 WebView 运行时
- 更接近真正的便携式 EXE

缺点：
- 文件大小会显著增加
- 构建时间可能更长

**方案 C: 使用第三方打包工具**

优点：
- 可以生成真正的单文件 EXE
- 更好的用户体验

缺点：
- 需要额外的构建步骤
- 增加维护成本

## Recommendations

基于项目需求和可行性，推荐使用 **方案 A** 作为初始实现：

1. 在 GitHub Actions 中为 Windows 平台添加 `--bundles exe` 参数
2. 确保 EXE 文件与 setup 文件同时上传到 GitHub Release
3. 验证生成的 EXE 文件可以独立运行

如果用户反馈 EXE 文件无法独立运行或需要额外的依赖，再考虑方案 B 或方案 C。

## Next Steps

1. 修改 `tauri.conf.json` 配置（如果需要）
2. 更新 `.github/workflows/release.yml` 工作流
3. 测试构建流程
4. 验证生成的 EXE 文件

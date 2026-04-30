# 使用说明

本目录下的 `slides.md` 为 **Slidev** 格式的演示文稿源文件。

## 目录结构

```
slides/
├── slides.md          # 幻灯片主文件（Slidev 入口）
├── README.md          # 本说明文件
└── assets/            # 图片等静态资源
```

## 本地预览

```bash
# 全局安装 Slidev
npm install -g @slidev/cli

# 进入本目录并启动
cd slides
slidev slides.md
```

或直接使用 npx：

```bash
cd slides
npx @slidev/cli slides.md
```

## 导出静态文件 / PDF

```bash
# 导出为 PDF
slidev export slides.md

# 导出为可部署的静态网页
slidev build slides.md
```

## 内容说明

本演示文稿聚焦 **RWR Toolbox 产品功能演示**，面向潜在用户与开源社区贡献者。

- 共 14 页幻灯片
- 涵盖：产品定位、核心痛点、6 大功能模块演示、产品亮点、路线图、贡献指南
- 已去除技术实现细节，专注用户价值与使用场景

## 添加截图

如需在幻灯片中插入功能截图，请将图片放入 `assets/` 目录，并在 `slides.md` 中引用：

```markdown
![Dashboard 预览](./assets/dashboard.png)
```

或使用 Slidev 的 `layout: image-right` 布局：

```yaml
---
layout: image-right
image: ./assets/dashboard.png
---
```

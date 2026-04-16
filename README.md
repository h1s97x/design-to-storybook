# Design-to-Storybook

> One-click from Figma design to production-ready Storybook components

[comment]: <> (项目徽标和状态徽章将在后续添加)

## 概述

Design-to-Storybook 是一个将 Figma 设计稿智能转换为生产级 Storybook 组件的工具。通过深度分析 Figma 设计文件，自动生成：

- React/Vue/Angular 组件代码
- TypeScript 类型定义
- Storybook Story 文件
- CSS/Tailwind 样式
- MDX 文档
- 设计 Token

## 特性

- 多框架支持 (React, Vue, Angular, Web Components)
- 智能 Props 推断
- Variant 组件自动识别
- 设计 Token 提取
- 双向同步 (可选)

## 快速开始

### 安装

```bash
npm install -g @design-to-storybook/cli
```

### 使用

```bash
# 1. 在 Figma 中选择组件，使用插件导出
# 2. 使用 CLI 转换
design-to-storybook convert ./design.json --output ./components

# 3. 在 Storybook 中预览
npm run storybook
```

## 文档

- [项目概述](./docs/01-项目概述.md)
- [技术架构](./docs/02-技术架构.md)
- [核心实现](./docs/03-核心实现.md)
- [开发路线图](./docs/04-开发路线图.md)

## License

MIT

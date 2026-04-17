# Phase 4: 生态建设

> **状态**: ✅ 已完成

## 目标

完善 CLI 工具、创建 VS Code Extension、CI/CD 集成、插件系统和 API 封装。

---

## 完成内容

### 4.1 ✅ CLI 工具完善

- [x] **watch 命令** - 监听文件变化自动转换
  - `src/commands/watch.ts`
  - 支持目录监听
  - 自动重新转换

- [x] **batch 命令** - 批量转换
  - `src/commands/batch.ts`
  - 批量处理多个文件
  - 支持 glob 模式

- [x] **config 命令** - 配置管理
  - `src/commands/config.ts`
  - 初始化配置文件
  - 查看当前配置

- [x] **doctor 命令** - 诊断工具
  - `src/commands/doctor.ts`
  - 检查环境配置
  - 验证依赖安装

### 4.2 ✅ VS Code Extension

- [x] **@design-to-storybook/vscode** 包
- [x] 插件配置 `package.json`
- [x] 扩展入口 `extension.ts`

#### 命令

| 命令 | ID | 功能 |
|------|-----|------|
| `design-to-storybook.convert` | `convert` | 转换当前文件 |
| `design-to-storybook.init` | `init` | 初始化配置 |
| `design-to-storybook.doctor` | `doctor` | 诊断环境 |

#### 功能

- [x] 右键菜单集成
- [x] 状态栏显示
- [x] 输出面板集成

### 4.3 ✅ CI/CD 集成

#### GitHub Actions

- [x] **ci.yml** - 持续集成
  - Node.js 20.x
  - pnpm install
  - pnpm build
  - pnpm test

- [x] **release.yml** - 发布工作流
  - 自动版本发布
  - npm 包发布
  - GitHub Release

- [x] **conversion.yml** - 设计稿转换
  - 定时执行转换
  - PR 评论结果

#### 脚本

- [x] **ci/validate.sh** - 验证脚本
  - 代码格式检查
  - TypeScript 类型检查
  - 构建验证

### 4.4 ✅ 插件系统

- [x] **pluginSystem.ts** - 插件系统核心
  - 插件加载器
  - 生命周期钩子
  - 插件注册

#### 插件 Hooks

| Hook | 时机 | 功能 |
|------|------|------|
| `onDesignReceived` | 收到设计稿 | 预处理设计数据 |
| `onNodeConverted` | 节点转换后 | 自定义节点处理 |
| `onComponentGenerated` | 组件生成后 | 自定义组件代码 |
| `onStoryGenerated` | Story生成后 | 自定义Story代码 |
| `onStyleGenerated` | 样式生成后 | 自定义样式代码 |

#### 示例插件

- [x] **pluginExamples.ts** - 插件示例
  - `analyticsPlugin` - 转换分析
  - `customNamingPlugin` - 自定义命名
  - `accessibilityPlugin` - 无障碍增强
  - `i18nPlugin` - 国际化支持
  - `darkModePlugin` - 暗色模式支持

### 4.5 ✅ API 封装

- [x] **api/converter.ts** - 高层 API
  - `convertDesign()` - 一键转换
  - `generateDocumentation()` - 文档生成
  - `extractDesignInfo()` - 信息提取
  - `batchConvert()` - 批量转换

---

## API 使用示例

```typescript
import { convertDesign, generateDocumentation, batchConvert } from '@design-to-storybook/core';

// 一键转换
const result = convertDesign(figmaJson, {
  framework: 'react',
  typescript: true,
  styleFormat: 'tailwind'
});

// 生成文档
const docs = generateDocumentation('Button', '按钮组件', props, {
  variants,
  tokens,
  framework: 'react'
});

// 批量转换
const results = batchConvert([
  { design: buttonJson, name: 'Button' },
  { design: inputJson, name: 'Input' }
]);
```

---

## 插件使用示例

```typescript
import { createConverter } from '@design-to-storybook/core';
import { analyticsPlugin, accessibilityPlugin } from '@design-to-storybook/core/plugins';

const converter = createConverter({
  plugins: [
    analyticsPlugin(),
    accessibilityPlugin({ level: 'AA' })
  ]
});
```

---

## CLI 命令

```bash
# 转换单个文件
d2s convert input.json -o output/

# 监听模式
d2s watch input.json -o output/

# 批量转换
d2s batch "*.json" -o output/

# 初始化配置
d2s init

# 配置管理
d2s config get
d2s config set framework react

# 诊断
d2s doctor
```

---

## 构建产物

| 包 | 大小 | 说明 |
|----|------|------|
| @design-to-storybook/core | ~80 KB | 核心库 |
| @design-to-storybook/react | 12.31 KB | React 生成器 |
| @design-to-storybook/vue | 8.42 KB | Vue 生成器 |
| @design-to-storybook/angular | 7.96 KB | Angular 生成器 |
| @design-to-storybook/cli | 23.18 KB | 命令行工具 |
| @design-to-storybook/figma-plugin | 9.37 KB | Figma 插件 |
| @design-to-storybook/vscode | - | VS Code 扩展 |

---

## 下一步

Phase 4 已完成！项目进入维护模式。

### 可选功能

- [ ] 单元测试覆盖
- [ ] E2E 测试
- [ ] 更多示例
- [ ] 文档网站
- [ ] npm 发布

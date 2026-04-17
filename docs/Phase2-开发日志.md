# Phase 2: 增强功能开发

> **状态**: ✅ 已完成
> 
> **时间**: 2024-XX

## 目标
增强核心转换能力，支持 Variant 组件、Component Properties 映射、Tailwind CSS 导出、TypeScript 类型推断增强，以及 Vue 3 生成器。

---

## 完成内容

### 2.1 ✅ Variant 组件支持
- [x] variantInferrer.ts - Variant 推断器
  - `inferVariants()` - 从 Component Set 推断所有变体
  - `extractVariantProps()` - 提取变体属性
  - `groupVariantsByProperty()` - 按属性分组变体
  - `generateVariantCombinations()` - 生成变体组合
  - `mapVariantsToArgs()` - 映射变体到 Story Args

### 2.2 ✅ Component Properties 映射
- [x] propertyMapper.ts - 属性映射器
  - `mapBooleanProperty()` - 映射布尔属性
  - `mapTextProperty()` - 映射文本属性
  - `mapInstanceSwapProperty()` - 映射组件替换属性
  - `mapVariantProperty()` - 映射变体属性
  - `mapComponentProperty()` - 映射组件属性

### 2.3 ✅ Tailwind CSS 样式导出
- [x] tailwindConverter.ts - Tailwind 转换器
  - `toTailwindClasses()` - 将 Figma 样式转换为 Tailwind 类名
  - `convertColor()` - 颜色转换
  - `convertShadow()` - 阴影转换
  - `convertBorder()` - 边框转换
  - `convertLayout()` - 布局转换
  - `convertTypography()` - 排版转换
  - `generateTailwindConfig()` - 生成 Tailwind 配置
  - `generateCSSVariables()` - 生成 CSS 变量

### 2.4 ✅ TypeScript 类型推断增强
- [x] typescriptInferrer.ts - TypeScript 推断器
  - `inferType()` - 从 Figma 属性推断 TypeScript 类型
  - `generatePropType()` - 生成 PropType 定义
  - `generateInterface()` - 生成 TypeScript 接口
  - `generateUnionType()` - 生成联合类型
  - `generateEnumType()` - 生成枚举类型
  - `validateTypeScript()` - 验证类型定义

### 2.5 ✅ Vue 3 生成器
- [x] @design-to-storybook/vue - Vue 3 生成器包
  - vueComponentGenerator.ts - Vue 组件生成器
    - `generate()` - 生成 Vue 3 SFC
    - `generateTemplate()` - 生成模板
    - `generateProps()` - 生成 Props 定义
    - `generateStyles()` - 生成样式
    - `wrapSFC()` - 包装成 SFC
  - vueStoryGenerator.ts - Vue Storybook Story 生成器
    - `generate()` - 生成 Storybook Stories
    - `generateDefaultStory()` - 生成默认 Story
    - `generateVariantStories()` - 生成变体 Stories
    - `generateStateStories()` - 生成状态 Stories
    - `generateArgTypes()` - 生成 ArgTypes

---

## 新增文件

```
packages/
├── core/src/
│   ├── inference/
│   │   ├── variantInferrer.ts      # 新增
│   │   ├── propertyMapper.ts        # 新增
│   │   └── typescriptInferrer.ts    # 新增
│   └── converters/
│       └── tailwindConverter.ts     # 新增
│
└── vue/                            # 新增包
    ├── package.json
    ├── tsconfig.json
    ├── tsup.config.ts
    └── src/
        ├── index.ts
        └── generators/
            ├── vueComponentGenerator.ts
            └── vueStoryGenerator.ts
```

---

## 构建产物

| 包 | 产物 | 大小 |
|----|------|------|
| **core** | index.js + index.d.ts | 44.10 KB + 17.18 KB |
| **react** | index.js + index.d.ts | 12.31 KB + 1.23 KB |
| **vue** | index.js + index.mjs + index.d.ts | 8.42 KB + 8.37 KB + 1.34 KB |
| **cli** | index.js | 9.72 KB |
| **figma-plugin** | main.js | 9.37 KB |

---

## API 增强

### @design-to-storybook/core 新增导出

```typescript
// Variant 推断
export { inferVariants, extractVariantProps, groupVariantsByProperty } from './inference/variantInferrer';

// 属性映射
export { mapBooleanProperty, mapTextProperty, mapInstanceSwapProperty, mapVariantProperty } from './inference/propertyMapper';

// TypeScript 推断
export { inferType, generatePropType, generateInterface, generateUnionType } from './inference/typescriptInferrer';

// Tailwind 转换
export { toTailwindClasses, convertColor, generateTailwindConfig, generateCSSVariables } from './converters/tailwindConverter';
```

### @design-to-storybook/vue 新增

```typescript
// 导出
export { VueComponentGenerator } from './generators/vueComponentGenerator';
export { VueStoryGenerator } from './generators/vueStoryGenerator';
```

---

## 示例输出

### Vue 3 组件示例

```vue
<template>
  <div class="button">
    <span class="text">Click me</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary'
  size?: 'small' | 'medium'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium'
})
</script>

<style scoped>
.button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6366f1;
  border-radius: 8px;
}
.text {
  color: #ffffff;
  font-size: 14px;
}
</style>
```

### Tailwind 类名示例

```typescript
// 输入: Figma 样式
// 输出: Tailwind 类名
'flex items-center justify-center bg-indigo-500 text-white rounded-lg px-4 py-2'
```

---

## 下一步 (Phase 3)

- [ ] Angular 生成器
- [ ] 设计 Token 提取
- [ ] MDX 文档生成
- [ ] 交互状态导出
- [ ] 错误处理优化

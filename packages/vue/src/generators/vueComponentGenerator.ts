/**
 * Vue 3 组件生成器
 * 将 Figma 设计转换为 Vue 3 组件
 */

import type { DesignNode, PropDefinition } from '@design-to-storybook/core';
import { extractStyle, inferHTMLTag, generateClassName } from '@design-to-storybook/core';

export interface VueComponentOutput {
  /** Vue SFC 文件内容 */
  sfc: string;
  /** Props 定义 */
  propsDefinition: string;
  /** CSS 类名映射 */
  classMappings: Record<string, string>;
}

export interface GeneratorOptions {
  framework: 'react' | 'vue' | 'angular';
  cssFormat: 'scoped' | 'module' | 'global';
  useTypeScript: boolean;
  addStorybook: boolean;
}

/**
 * Vue 组件生成器
 */
export class VueComponentGenerator {
  private options: GeneratorOptions;

  constructor(options: Partial<GeneratorOptions> = {}) {
    this.options = {
      framework: 'vue',
      cssFormat: options.cssFormat ?? 'scoped',
      useTypeScript: options.useTypeScript ?? true,
      addStorybook: options.addStorybook ?? true,
    };
  }

  /**
   * 生成 Vue 3 SFC
   */
  generate(design: DesignNode, props: PropDefinition[]): VueComponentOutput {
    const componentName = this.toPascalCase(design.name);
    const style = extractStyle(design);
    const className = generateClassName(design.name);
    
    // 生成 template
    const template = this.generateTemplate(design);
    
    // 生成 props 定义
    const propsDefinition = this.generateProps(props);
    
    // 生成样式
    const styles = this.generateStyles(style, className);
    
    // 包装成 SFC
    const sfc = this.wrapSFC(componentName, template, propsDefinition, styles);
    
    return {
      sfc,
      propsDefinition,
      classMappings: { [className]: componentName },
    };
  }

  /**
   * 生成模板
   */
  private generateTemplate(node: DesignNode): string {
    const tag = inferHTMLTag(node);
    const className = generateClassName(node.name);
    const style = extractStyle(node);
    
    // 收集内联样式
    const inlineStyles: string[] = [];
    if (style.opacity !== undefined && style.opacity !== 1) {
      inlineStyles.push(`opacity: ${style.opacity}`);
    }
    
    // 生成子元素
    const children = this.extractChildren(node);
    
    // 构建标签
    const attrs: string[] = [`class="${className}"`];
    
    if (node.type === 'TEXT') {
      // 文本节点：内容作为子元素
      return `<${tag} ${attrs.join(' ')}>${node.name}</${tag}>`;
    } else {
      // 容器节点：可能有子元素
      if (children.length > 0) {
        return `<${tag} ${attrs.join(' ')}>\n  ${children.join('\n  ')}\n</${tag}>`;
      } else {
        return `<${tag} ${attrs.join(' ')} />`;
      }
    }
  }

  /**
   * 提取子元素
   */
  private extractChildren(node: DesignNode): string[] {
    // 对于容器类型节点，提取子元素
    if ('children' in node && Array.isArray(node.children)) {
      return node.children.map((child: DesignNode) => this.generateTemplate(child));
    }
    return [];
  }

  /**
   * 生成 Props 定义
   */
  private generateProps(props: PropDefinition[]): string {
    const propLines: string[] = [];
    
    for (const prop of props) {
      const required = prop.required ? '' : '?';
      const type = this.mapType(prop.type);
      const defaultValue = prop.defaultValue !== undefined 
        ? ` = ${JSON.stringify(prop.defaultValue)}` 
        : '';
      
      if (prop.description) {
        propLines.push(`  // ${prop.description}`);
      }
      propLines.push(`  ${prop.name}${required}: ${type}${defaultValue}`);
    }
    
    return propLines.join('\n');
  }

  /**
   * 类型映射
   */
  private mapType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      'react-node': 'string', // Vue 中使用 v-html 或 slot
      object: 'Record<string, any>',
    };
    return typeMap[type] || 'string';
  }

  /**
   * 生成样式
   */
  private generateStyles(style: any, className: string): string {
    const cssProps: string[] = [];
    
    // 布局样式
    if (style.display) cssProps.push(`  display: ${style.display};`);
    if (style.flexDirection) cssProps.push(`  flex-direction: ${style.flexDirection};`);
    if (style.justifyContent) cssProps.push(`  justify-content: ${style.justifyContent};`);
    if (style.alignItems) cssProps.push(`  align-items: ${style.alignItems};`);
    if (style.gap !== undefined) cssProps.push(`  gap: ${style.gap}px;`);
    if (style.width !== undefined) cssProps.push(`  width: ${style.width}px;`);
    if (style.height !== undefined) cssProps.push(`  height: ${style.height}px;`);
    
    // 颜色样式
    if (style.backgroundColor) cssProps.push(`  background-color: ${style.backgroundColor};`);
    if (style.color) cssProps.push(`  color: ${style.color};`);
    
    // 边框样式
    if (style.borderWidth) cssProps.push(`  border: ${style.borderWidth}px solid ${style.borderColor || '#000'};`);
    if (style.borderRadius !== undefined) cssProps.push(`  border-radius: ${style.borderRadius}px;`);
    
    // 效果样式
    if (style.boxShadow) cssProps.push(`  box-shadow: ${style.boxShadow};`);
    if (style.opacity !== undefined) cssProps.push(`  opacity: ${style.opacity};`);
    
    // 文本样式
    if (style.fontSize !== undefined) cssProps.push(`  font-size: ${style.fontSize}px;`);
    if (style.fontWeight) cssProps.push(`  font-weight: ${style.fontWeight};`);
    if (style.textAlign) cssProps.push(`  text-align: ${style.textAlign};`);
    
    // 间距样式
    if (style.padding) cssProps.push(`  padding: ${style.padding}px;`);
    if (style.margin) cssProps.push(`  margin: ${style.margin}px;`);
    
    // 位置样式
    if (style.position) cssProps.push(`  position: ${style.position};`);
    
    if (cssProps.length === 0) return '';
    
    return `
.${className} {
${cssProps.join('\n')}
}`;
  }

  /**
   * 包装成 SFC
   */
  private wrapSFC(
    _componentName: string,
    template: string,
    propsDefinition: string,
    styles: string
  ): string {
    const scriptAttrs = this.options.useTypeScript ? ' setup lang="ts"' : ' setup';
    
    return `<template>
${template}
</template>

<script${scriptAttrs}>
// Props 定义
interface Props {
${propsDefinition}
}

const props = withDefaults(defineProps<Props>(), {
  // 默认值
});
</script>

<style${this.options.cssFormat === 'scoped' ? ' scoped' : ''}>
${styles}
</style>`;
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }
}

/**
 * TypeScript 类型推断增强器
 * 从 Figma 设计中智能推断 TypeScript 类型定义
 */

import type { PropDefinition, DesignNode } from '../types';

/**
 * 类型推断配置
 */
export interface TypeInferenceConfig {
  /** 是否生成 JSDoc 注释 */
  includeJSDoc?: boolean;
  /** 是否使用联合类型 */
  useUnionTypes?: boolean;
  /** 是否生成 export */
  generateExport?: boolean;
  /** 是否生成 interface (否则生成 type) */
  generateInterface?: boolean;
  /** 组件前缀 */
  componentPrefix?: string;
}

/**
 * 默认配置
 */
export const DEFAULT_TYPE_CONFIG: TypeInferenceConfig = {
  includeJSDoc: true,
  useUnionTypes: true,
  generateExport: true,
  generateInterface: true,
  componentPrefix: '',
};

/**
 * 推断完整的 TypeScript 类型定义
 */
export function inferTypescriptDefinition(
  props: PropDefinition[],
  componentName: string,
  config: Partial<TypeInferenceConfig> = {}
): TypeDefinition {
  const cfg = { ...DEFAULT_TYPE_CONFIG, ...config };

  const lines: string[] = [];
  const exports: string[] = [];

  // 组件 Props 接口
  const propsInterfaceName = `${cfg.componentPrefix}${componentName}Props`;
  
  if (cfg.includeJSDoc) {
    lines.push(`/**`);
    lines.push(` * ${componentName} Component Props`);
    lines.push(` */`);
  }

  if (cfg.generateExport) {
    exports.push(`export`);
  }

  if (cfg.generateInterface) {
    lines.push(`${exports[0]} interface ${propsInterfaceName} {`);
  } else {
    lines.push(`${exports[0]} type ${propsInterfaceName} = {`);
  }

  // Props 属性
  for (const prop of props) {
    const propLine = formatPropLine(prop, cfg);
    lines.push(`  ${propLine}`);
  }

  lines.push('}');

  return {
    name: propsInterfaceName,
    lines,
    exports: exports[0] ? [propsInterfaceName] : [],
  };
}

/**
 * 格式化 Prop 行
 */
function formatPropLine(prop: PropDefinition, config: TypeInferenceConfig): string {
  const parts: string[] = [prop.name];

  // 可选性
  if (!prop.required) {
    parts.push('?');
  }

  parts.push(': ');

  // 类型
  if (prop.enum && prop.enum.length > 0) {
    if (config.useUnionTypes) {
      const enumTypes = prop.enum.map((v) => `'${v}'`).join(' | ');
      parts.push(`(${enumTypes})`);
    } else {
      parts.push(`'${prop.enum.join("' | '")}'`);
    }
  } else {
    parts.push(prop.type);
  }

  // 默认值
  if (prop.defaultValue !== undefined) {
    parts.push(` = ${formatDefaultValue(prop.defaultValue, prop.type)}`);
  }

  parts.push(';');

  return parts.join('');
}

/**
 * 格式化默认值
 */
function formatDefaultValue(value: unknown, type: string): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';

  switch (type) {
    case 'string':
    case 'React.ReactNode':
      return `'${value}'`;
    case 'boolean':
      return String(value);
    case 'number':
      return String(value);
    default:
      return typeof value === 'string' ? `'${value}'` : JSON.stringify(value);
  }
}

/**
 * 从节点树推断类型
 */
export function inferTypesFromNodeTree(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  // 从子节点推断 - 使用类型断言访问 children
  const children = (node as { children?: DesignNode[] }).children;
  if (children) {
    for (const child of children) {
      // 检测是否为可交互元素
      if (isInteractiveElement(child)) {
        const interactiveProps = inferInteractiveProps(child);
        props.push(...interactiveProps);
      }

      // 检测是否为容器
      if (isContainerElement(child)) {
        const containerProps = inferContainerProps(child);
        props.push(...containerProps);
      }
    }
  }

  return props;
}

/**
 * 检测是否为交互元素
 */
function isInteractiveElement(node: DesignNode): boolean {
  const name = node.name.toLowerCase();
  const interactiveKeywords = [
    'button', 'btn', 'link', 'anchor',
    'input', 'checkbox', 'radio', 'toggle',
    'slider', 'dropdown', 'select', 'menu',
    'tab', 'accordion', 'modal', 'dialog',
  ];

  return interactiveKeywords.some((kw) => name.includes(kw));
}

/**
 * 检测是否为容器元素
 */
function isContainerElement(node: DesignNode): boolean {
  const type = node.type;
  return type === 'FRAME' || type === 'COMPONENT' || type === 'COMPONENT_SET' || type === 'INSTANCE';
}

/**
 * 推断交互元素 Props
 */
function inferInteractiveProps(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];
  const name = node.name.toLowerCase();

  // 按钮检测
  if (name.includes('button') || name.includes('btn')) {
    props.push({
      name: 'onClick',
      type: '() => void',
      required: false,
      description: 'Click handler',
    });
  }

  // 输入框检测
  if (name.includes('input') || name.includes('text')) {
    props.push(
      {
        name: 'value',
        type: 'string',
        required: false,
        description: 'Input value',
      },
      {
        name: 'onChange',
        type: '(value: string) => void',
        required: false,
        description: 'Change handler',
      },
      {
        name: 'placeholder',
        type: 'string',
        required: false,
        defaultValue: '',
        description: 'Placeholder text',
      },
      {
        name: 'disabled',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Disabled state',
      }
    );
  }

  return props;
}

/**
 * 推断容器 Props
 */
function inferContainerProps(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  if (node.type === 'FRAME') {
    props.push({
      name: 'children',
      type: 'React.ReactNode',
      required: false,
      description: 'Child elements',
    });

    // 检测是否为卡片
    if (node.name.toLowerCase().includes('card')) {
      props.push(
        {
          name: 'title',
          type: 'string',
          required: false,
          description: 'Card title',
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Card description',
        }
      );
    }
  }

  return props;
}

/**
 * 生成类型定义
 */
export interface TypeDefinition {
  name: string;
  lines: string[];
  exports: string[];
}

/**
 * 生成多个相关类型
 */
export function generateRelatedTypes(
  props: PropDefinition[],
  componentName: string,
  config: Partial<TypeInferenceConfig> = {}
): TypeDefinition[] {
  const definitions: TypeDefinition[] = [];

  // 主 Props 类型
  definitions.push(inferTypescriptDefinition(props, componentName, config));

  // 如果有变体，生成变体联合类型
  const variantProps = props.filter((p) => p.controlType === 'select');
  if (variantProps.length > 0) {
    const variantUnion = generateVariantUnion(variantProps, componentName);
    definitions.push(variantUnion);
  }

  // 生成事件类型
  const eventProps = props.filter((p) => p.name.startsWith('on'));
  if (eventProps.length > 0) {
    const eventType = generateEventTypes(eventProps, componentName);
    definitions.push(eventType);
  }

  return definitions;
}

/**
 * 生成变体联合类型
 */
function generateVariantUnion(
  props: PropDefinition[],
  componentName: string
): TypeDefinition {
  const lines: string[] = [
    '/**',
    ` * ${componentName} Variant Types`,
    ' */',
  ];

  const variants: string[] = [];

  for (const prop of props) {
    if (prop.enum) {
      for (const value of prop.enum) {
        variants.push(`'${value}'`);
      }
    }
  }

  lines.push(`export type ${componentName}Variant = ${[...new Set(variants)].join(' | ')};`);

  return {
    name: `${componentName}Variant`,
    lines,
    exports: [`${componentName}Variant`],
  };
}

/**
 * 生成事件类型
 */
function generateEventTypes(
  props: PropDefinition[],
  componentName: string
): TypeDefinition {
  const lines: string[] = [
    '/**',
    ` * ${componentName} Event Handlers`,
    ' */',
  ];

  for (const prop of props) {
    lines.push(
      `export type ${componentName}on${prop.name.slice(2)}Event = ${prop.type};`
    );
  }

  return {
    name: `${componentName}EventHandlers`,
    lines,
    exports: props.map((p) => `${componentName}on${p.name.slice(2)}Event`),
  };
}

/**
 * 合并多个 Prop 列表
 */
export function mergeProps(
  ...propLists: PropDefinition[][]
): PropDefinition[] {
  const merged = new Map<string, PropDefinition>();

  for (const props of propLists) {
    for (const prop of props) {
      if (!merged.has(prop.name)) {
        merged.set(prop.name, prop);
      }
    }
  }

  return Array.from(merged.values());
}

/**
 * 生成完整的类型文件内容
 */
export function generateTypeFile(
  definitions: TypeDefinition[],
  imports?: string[]
): string {
  const lines: string[] = [];

  // 导入语句
  if (imports) {
    for (const imp of imports) {
      lines.push(imp);
    }
    lines.push('');
  }

  // 类型定义
  for (const def of definitions) {
    lines.push(...def.lines);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成 React 相关导入
 */
export function generateReactImports(): string[] {
  return [
    "import type { FC, ReactNode, MouseEvent, ChangeEvent } from 'react';",
  ];
}

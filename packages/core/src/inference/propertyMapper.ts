/**
 * Component Properties 映射器
 * 将 Figma Component Properties 映射到代码 Props
 */

import type {
  ComponentPropertyDefinition,
  PropDefinition,
} from '../types';

/**
 * 组件属性映射配置
 */
export interface ComponentPropertyMapping {
  /** Figma 属性名 */
  figmaProperty: string;
  /** 生成的 Prop 名 */
  propName: string;
  /** Prop 类型 */
  type: 'string' | 'number' | 'boolean' | 'enum' | 'ReactNode';
  /** 默认值 */
  defaultValue?: string | number | boolean;
  /** 可能的枚举值 */
  enumValues?: string[];
  /** 描述 */
  description?: string;
}

/**
 * 预定义的属性映射规则
 */
export const PRESET_MAPPINGS: Record<string, ComponentPropertyMapping> = {
  variant: {
    figmaProperty: 'variant',
    propName: 'variant',
    type: 'string',
    defaultValue: 'default',
    description: 'Visual style variant',
  },
  size: {
    figmaProperty: 'size',
    propName: 'size',
    type: 'enum',
    enumValues: ['small', 'medium', 'large'],
    defaultValue: 'medium',
    description: 'Component size',
  },
  disabled: {
    figmaProperty: 'disabled',
    propName: 'disabled',
    type: 'boolean',
    defaultValue: false,
    description: 'Disabled state',
  },
  loading: {
    figmaProperty: 'loading',
    propName: 'loading',
    type: 'boolean',
    defaultValue: false,
    description: 'Loading state',
  },
  icon: {
    figmaProperty: 'icon',
    propName: 'icon',
    type: 'ReactNode',
    description: 'Icon component',
  },
  label: {
    figmaProperty: 'label',
    propName: 'label',
    type: 'string',
    defaultValue: '',
    description: 'Label text',
  },
  placeholder: {
    figmaProperty: 'placeholder',
    propName: 'placeholder',
    type: 'string',
    defaultValue: '',
    description: 'Placeholder text',
  },
  type: {
    figmaProperty: 'type',
    propName: 'type',
    type: 'enum',
    enumValues: ['primary', 'secondary', 'tertiary', 'ghost'],
    defaultValue: 'primary',
    description: 'Button or input type',
  },
  status: {
    figmaProperty: 'status',
    propName: 'status',
    type: 'enum',
    enumValues: ['default', 'success', 'warning', 'error'],
    defaultValue: 'default',
    description: 'Status state',
  },
};

/**
 * 从 Figma Component Properties 创建映射
 */
export function createPropertyMappings(
  properties: Record<string, ComponentPropertyDefinition>
): ComponentPropertyMapping[] {
  const mappings: ComponentPropertyMapping[] = [];

  for (const [name, prop] of Object.entries(properties)) {
    // 检查是否有预设映射
    const preset = findPresetMapping(name);
    if (preset) {
      mappings.push({
        ...preset,
        defaultValue: prop.defaultValue ?? preset.defaultValue,
      });
    } else {
      // 自动推断映射
      mappings.push(inferPropertyMapping(name, prop));
    }
  }

  return mappings;
}

/**
 * 查找预设映射
 */
function findPresetMapping(name: string): ComponentPropertyMapping | undefined {
  const normalized = name.toLowerCase();
  
  // 精确匹配
  if (PRESET_MAPPINGS[normalized]) {
    return PRESET_MAPPINGS[normalized];
  }

  // 前缀匹配
  for (const [key, mapping] of Object.entries(PRESET_MAPPINGS)) {
    if (normalized.startsWith(key) || normalized.includes(key)) {
      return {
        ...mapping,
        propName: normalizePropName(name),
      };
    }
  }

  return undefined;
}

/**
 * 推断属性映射
 */
function inferPropertyMapping(
  name: string,
  prop: ComponentPropertyDefinition
): ComponentPropertyMapping {
  const normalizedName = normalizePropName(name);

  switch (prop.type) {
    case 'BOOLEAN':
      return {
        figmaProperty: name,
        propName: normalizedName,
        type: 'boolean',
        defaultValue: prop.defaultValue ?? false,
        description: `From component property: ${name}`,
      };

    case 'TEXT':
      return {
        figmaProperty: name,
        propName: normalizedName,
        type: 'string',
        defaultValue: prop.defaultValue ?? '',
        description: `From component property: ${name}`,
      };

    case 'INSTANCE_SWAP':
      return {
        figmaProperty: name,
        propName: normalizedName,
        type: 'ReactNode',
        description: `Icon or component from: ${name}`,
      };

    case 'VARIANT':
      // 从 variantOptions 解析枚举值
      const values = prop.variantOptions ?? [];
      return {
        figmaProperty: name,
        propName: normalizedName,
        type: values.length > 0 ? 'enum' : 'string',
        defaultValue: prop.defaultValue ?? values[0] ?? 'default',
        enumValues: values.length > 0 ? values : undefined,
        description: `Variant property: ${name}`,
      };
    
    case 'COMPONENT':
      return {
        figmaProperty: name,
        propName: normalizedName,
        type: 'ReactNode',
        description: `Component: ${name}`,
      };

    default:
      return {
        figmaProperty: name,
        propName: normalizedName,
        type: 'string',
        defaultValue: prop.defaultValue ?? '',
        description: `Unknown property type: ${name}`,
      };
  }
}

/**
 * 标准化 Prop 名称
 */
function normalizePropName(name: string): string {
  return name
    .replace(/[_-]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase())
    .replace(/([A-Z])/g, (_, c) => c.toLowerCase());
}

/**
 * 将 Component Property Mapping 转换为 PropDefinition
 */
export function mappingToPropDefinition(
  mapping: ComponentPropertyMapping
): PropDefinition {
  const propDef: PropDefinition = {
    name: mapping.propName,
    type: mapping.type === 'ReactNode' ? 'React.ReactNode' : mapping.type,
    required: false,
    defaultValue: mapping.defaultValue,
    description: mapping.description ?? `From Figma property: ${mapping.figmaProperty}`,
  };

  if (mapping.type === 'enum') {
    propDef.enum = mapping.enumValues;
    propDef.controlType = 'select';
    propDef.options = mapping.enumValues;
  } else if (mapping.type === 'boolean') {
    propDef.controlType = 'boolean';
  } else if (mapping.type === 'string') {
    propDef.controlType = 'text';
  }

  return propDef;
}

/**
 * 从 Figma 属性推断对应的交互状态
 */
export function inferInteractionStates(
  _properties: Record<string, ComponentPropertyDefinition>
): InteractionState[] {
  const states: InteractionState[] = [];

  // Note: ComponentPropertyDefinition 不包含 hover/active 等状态
  // 这些需要从设计稿中手动识别

  return states;
}

/**
 * 交互状态定义
 */
export interface InteractionState {
  name: string;
  description: string;
  propName: string;
  type: 'boolean';
}

/**
 * 批量转换属性映射为 Prop 定义
 */
export function batchMapToPropDefinitions(
  mappings: ComponentPropertyMapping[]
): PropDefinition[] {
  return mappings.map(mappingToPropDefinition);
}

/**
 * Variant 推断器
 * 处理 Figma Component Set 和 Variant 属性
 */

import type {
  DesignNode,
  ComponentPropertyValue,
  PropDefinition,
  VariantMapping,
  StyleDefinition,
  VariantDefinition,
} from '../types';

/**
 * 从 Figma Component Properties 推断 Props
 */
export function inferComponentProperties(
  properties: Record<string, ComponentPropertyValue>
): PropDefinition[] {
  const props: PropDefinition[] = [];

  for (const [name, prop] of Object.entries(properties)) {
    switch (prop.type) {
      case 'BOOLEAN':
        props.push({
          name,
          type: 'boolean',
          required: false,
          defaultValue: prop.value,
          description: `From component property: ${name}`,
          controlType: 'boolean',
        });
        break;

      case 'TEXT':
        props.push({
          name,
          type: 'string',
          required: false,
          defaultValue: prop.value,
          description: `From component property: ${name}`,
          controlType: 'text',
        });
        break;

      case 'INSTANCE_SWAP':
        props.push({
          name,
          type: 'React.ReactNode',
          required: false,
          defaultValue: undefined,
          description: `Icon or component from: ${name}`,
          controlType: 'select',
          options: ['Icon1', 'Icon2', 'Icon3'],
        });
        break;

      case 'VARIANT':
        // Variant 类型的属性会由 extractVariants 处理
        break;

      default:
        props.push({
          name,
          type: 'string',
          required: false,
          defaultValue: '',
          description: `Unknown property type: ${name}`,
          controlType: 'text',
        });
    }
  }

  return props;
}

/**
 * 从 Component Set 中提取所有 Variant
 */
export function extractVariants(
  componentSet: DesignNode
): VariantDefinition[] {
  const children = (componentSet as { children?: DesignNode[] }).children;
  if (!children) return [];

  const variants: VariantDefinition[] = [];

  // Component Set 的 children 是各个 Variant
  for (const variant of children) {
    if (variant.type === 'COMPONENT') {
      const variantMapping: VariantMapping = {};
      const variantProps: Record<string, string> = {};

      // 从 Variant 名称解析 Variant 属性
      // 格式: "Variant=Value,Property=Value"
      if (variant.name.includes('=')) {
        const parts = variant.name.split(',');
        for (const part of parts) {
          const [key, value] = part.split('=').map((s: string) => s.trim());
          if (key && value) {
            variantMapping[key] = value;
            variantProps[key] = value;
          }
        }
      }

      variants.push({
        name: variant.name,
        node: variant,
        variantMapping,
        properties: variantProps,
        styles: extractVariantStyles(variant),
      });
    }
  }

  return variants;
}

/**
 * 提取单个 Variant 的样式
 */
function extractVariantStyles(variant: DesignNode): StyleDefinition {
  const fills = (variant as { fills?: unknown[] }).fills;
  const strokes = (variant as { strokes?: unknown[] }).strokes;
  const effects = (variant as { effects?: unknown[] }).effects;
  const borderRadius = (variant as { borderRadius?: number }).borderRadius;
  const opacity = (variant as { opacity?: number }).opacity;

  return {
    className: '',
    css: {},
    backgroundColor: extractFillColor(fills),
    borderRadius: borderRadius ?? 0,
    borderWidth: extractStrokeWidth(strokes),
    borderColor: extractStrokeColor(strokes),
    boxShadow: extractShadow(effects),
    opacity: opacity ?? 1,
  };
}

function extractFillColor(fills?: unknown[]): string | undefined {
  if (!fills || fills.length === 0) return undefined;
  const solid = fills.find((f: unknown) => (f as { type?: string }).type === 'SOLID') as { color?: { r: number; g: number; b: number; a?: number } } | undefined;
  if (!solid?.color) return undefined;
  const { r, g, b, a = 1 } = solid.color;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function extractStrokeWidth(strokes?: unknown[]): number | undefined {
  if (!strokes || strokes.length === 0) return undefined;
  return (strokes[0] as { strokeWeight?: number }).strokeWeight;
}

function extractStrokeColor(strokes?: unknown[]): string | undefined {
  if (!strokes || strokes.length === 0) return undefined;
  const solid = strokes.find((s: unknown) => (s as { type?: string }).type === 'SOLID') as { color?: { r: number; g: number; b: number; a?: number } } | undefined;
  if (!solid?.color) return undefined;
  const { r, g, b, a = 1 } = solid.color;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function extractShadow(effects?: unknown[]): string | undefined {
  if (!effects) return undefined;
  const shadow = effects.find(
    (e: unknown) => (e as { type?: string }).type === 'DROP_SHADOW' || (e as { type?: string }).type === 'INNER_SHADOW'
  ) as { type?: string; color?: { r: number; g: number; b: number; a?: number }; offset?: { x: number; y: number }; radius?: number } | undefined;
  if (!shadow || !shadow.color) return undefined;

  const offsetX = shadow.offset?.x ?? 0;
  const offsetY = shadow.offset?.y ?? 0;
  const radius = shadow.radius ?? 0;
  const { r, g, b, a = 1 } = shadow.color;
  const type = shadow.type === 'INNER_SHADOW' ? 'inset' : '';

  if (type) {
    return `${type} ${offsetX}px ${offsetY}px ${radius}px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  }
  return `${offsetX}px ${offsetY}px ${radius}px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

/**
 * 分析 Variant 组合，生成 prop 组合
 */
export function analyzeVariantCombinations(
  variants: VariantDefinition[]
): {
  variantProps: string[];
  variantValues: Record<string, string[]>;
} {
  const variantProps = new Set<string>();
  const variantValues: Record<string, Set<string>> = {};

  for (const variant of variants) {
    for (const [prop, value] of Object.entries(variant.variantMapping)) {
      variantProps.add(prop);
      if (!variantValues[prop]) {
        variantValues[prop] = new Set();
      }
      variantValues[prop].add(value);
    }
  }

  return {
    variantProps: Array.from(variantProps),
    variantValues: Object.fromEntries(
      Object.entries(variantValues).map(([k, v]) => [k, Array.from(v)])
    ),
  };
}

/**
 * 推断 Variant 对应的 prop 类型
 */
export function inferVariantPropType(
  propName: string,
  values: string[]
): PropDefinition {
  // 检查是否为布尔类型
  const isBooleanLike = values.every(
    (v) => v.toLowerCase() === 'true' || v.toLowerCase() === 'false'
  );

  if (isBooleanLike) {
    return {
      name: propName,
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: `Variant property: ${propName}`,
      controlType: 'boolean',
    };
  }

  return {
    name: propName,
    type: 'string',
    required: false,
    defaultValue: values[0],
    description: `Variant property: ${propName}`,
    controlType: 'select',
    options: values,
  };
}

/**
 * 从多个 Variant 中推断共享的 Props
 */
export function inferSharedProps(
  variants: VariantDefinition[]
): PropDefinition[] {
  if (variants.length === 0) return [];

  // 收集所有唯一的 prop 名称
  const allProps = new Map<string, Set<string>>();

  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.variantMapping)) {
      if (!allProps.has(key)) {
        allProps.set(key, new Set());
      }
      allProps.get(key)!.add(value);
    }
  }

  // 为每个 prop 生成定义
  const props: PropDefinition[] = [];
  for (const [propName, values] of allProps.entries()) {
    props.push(inferVariantPropType(propName, Array.from(values)));
  }

  return props;
}

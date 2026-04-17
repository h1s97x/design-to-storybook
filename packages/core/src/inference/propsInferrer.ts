/**
 * Props Inferrer - Infers component props from design node metadata
 */

import type {
  DesignNode,
  PropDefinition,
  ComponentPropertyValue,
  FrameNode,
} from '../types/index.js';

function isFrameNode(node: DesignNode): node is FrameNode {
  return node.type === 'FRAME';
}

/**
 * Infer props from a design node
 */
export function inferProps(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  // 1. Extract from Component Properties
  const componentProps = inferFromComponentProperties(node);
  props.push(...componentProps);

  // 2. Extract from Variant properties
  if (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT') {
    const variantProps = inferFromVariantProperties(node);
    props.push(...variantProps);
  }

  // 3. Infer from naming conventions
  const namedProps = inferFromNaming(node.name);
  props.push(...namedProps);

  // 4-5. For frame nodes, infer from interaction states and children
  if (isFrameNode(node)) {
    const interactionProps = inferFromInteractionStates(node);
    props.push(...interactionProps);

    const childrenProp = inferChildrenProp(node);
    if (childrenProp) {
      props.unshift(childrenProp);
    }
  }

  // Deduplicate and validate
  return deduplicateProps(props);
}

/**
 * Infer props from Figma Component Properties
 */
function inferFromComponentProperties(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  // Handle COMPONENT type
  if (node.type === 'COMPONENT' && node.componentProperties) {
    for (const [key, value] of Object.entries(node.componentProperties)) {
      const prop = inferComponentProperty(key, value);
      if (prop) {
        props.push(prop);
      }
    }
  }

  // Handle COMPONENT_SET type
  if (node.type === 'COMPONENT_SET' && 'componentPropertyDefinitions' in node) {
    const definitions = (node as { componentPropertyDefinitions?: Record<string, unknown> }).componentPropertyDefinitions;
    if (definitions) {
      for (const [key, def] of Object.entries(definitions)) {
        const defTyped = def as { type: string; defaultValue?: unknown; variantOptions?: string[] };
        const prop = inferComponentPropertyDefinition(key, defTyped);
        if (prop) {
          props.push(prop);
        }
      }
    }
  }

  return props;
}

/**
 * Infer prop from a component property value
 */
function inferComponentProperty(key: string, value: ComponentPropertyValue): PropDefinition | null {
  const propName = toCamelCase(key);

  switch (value.type) {
    case 'BOOLEAN':
      return {
        name: propName,
        type: 'boolean',
        required: false,
        defaultValue: value.value,
        description: `From Figma component property: ${key}`,
        control: { type: 'boolean' },
      };

    case 'TEXT':
      return {
        name: propName,
        type: 'string',
        required: false,
        defaultValue: value.value,
        description: `From Figma component property: ${key}`,
        control: { type: 'text' },
      };

    case 'VARIANT':
      return {
        name: 'variant',
        type: 'string',
        required: true,
        defaultValue: value.value,
        description: `Component variant: ${key}`,
        control: { type: 'select', options: [value.value] },
        enum: [value.value],
      };

    case 'INSTANCE_SWAP':
      return {
        name: propName,
        type: 'React.ComponentType<any>',
        required: false,
        description: `Instance swap: ${key}`,
        control: { type: 'text' },
      };

    default:
      return null;
  }
}

/**
 * Infer prop from a component property definition
 */
function inferComponentPropertyDefinition(
  key: string,
  def: { type: string; defaultValue?: unknown; variantOptions?: string[] }
): PropDefinition | null {
  const propName = toCamelCase(key);

  switch (def.type) {
    case 'BOOLEAN':
      return {
        name: propName,
        type: 'boolean',
        required: false,
        defaultValue: def.defaultValue as boolean ?? false,
        description: `From Figma component property: ${key}`,
        control: { type: 'boolean' },
      };

    case 'TEXT':
      return {
        name: propName,
        type: 'string',
        required: false,
        defaultValue: def.defaultValue as string ?? '',
        description: `From Figma component property: ${key}`,
        control: { type: 'text' },
      };

    case 'VARIANT': {
      const options = def.variantOptions || [];
      return {
        name: 'variant',
        type: options.map((opt: string) => `'${opt}'`).join(' | ') || 'string',
        required: true,
        defaultValue: (def.defaultValue as string) ?? options[0] ?? 'default',
        description: `Component variant property`,
        control: { type: 'select', options },
        enum: options,
      };
    }

    case 'INSTANCE_SWAP':
      return {
        name: propName,
        type: 'React.ComponentType<any>',
        required: false,
        description: `Instance swap: ${key}`,
        control: { type: 'text' },
      };

    case 'COMPONENT':
      return {
        name: propName,
        type: 'React.ReactNode',
        required: false,
        description: `Component: ${key}`,
        control: { type: 'text' },
      };

    default:
      return null;
  }
}

/**
 * Infer props from variant properties
 */
function inferFromVariantProperties(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  // Check if it's a variant component
  if (node.type === 'COMPONENT' && node.componentProperties) {
    const variantValues = Object.entries(node.componentProperties)
      .filter(([_, value]) => value.type === 'VARIANT')
      .map(([key, value]) => ({
        key,
        value: (value as { value?: string }).value ?? '',
      }));

    if (variantValues.length > 0) {
      props.push({
        name: 'variant',
        type: variantValues.map((v) => `'${v.value}'`).join(' | '),
        required: true,
        defaultValue: variantValues[0]?.value,
        description: 'Component variant',
        control: {
          type: 'select',
          options: variantValues.map((v) => v.value),
        },
        enum: variantValues.map((v) => v.value),
      });
    }
  }

  return props;
}

/**
 * Infer props from naming conventions
 */
function inferFromNaming(name: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const lowerName = name.toLowerCase();

  // Disabled state
  if (lowerName.includes('disabled') || lowerName.includes('inactive')) {
    props.push({
      name: 'disabled',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Disabled state of the component',
      control: { type: 'boolean' },
    });
  }

  // Loading state
  if (lowerName.includes('loading') || lowerName.includes('busy')) {
    props.push({
      name: 'loading',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Loading state of the component',
      control: { type: 'boolean' },
    });
  }

  // Size variants
  if (lowerName.includes('small') || lowerName.includes('sm')) {
    props.push({
      name: 'size',
      type: "'small' | 'medium' | 'large'",
      required: false,
      defaultValue: 'medium',
      description: 'Size variant of the component',
      control: { type: 'select', options: ['small', 'medium', 'large'] },
      enum: ['small', 'medium', 'large'],
    });
  }

  // Icon-related
  if (lowerName.includes('icon')) {
    props.push({
      name: 'icon',
      type: 'React.ReactNode',
      required: false,
      description: 'Icon to display',
      control: { type: 'text' },
    });
  }

  // Button/link actions
  if (lowerName.includes('button') || lowerName.includes('btn')) {
    props.push({
      name: 'onClick',
      type: '() => void',
      required: false,
      description: 'Click handler',
    });
  }

  return props;
}

/**
 * Infer props from interaction states in children
 */
function inferFromInteractionStates(node: FrameNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  if (!node.children || node.children.length === 0) {
    return props;
  }

  // Check for hover state layer
  const hasHoverLayer = node.children.some(
    (child: DesignNode) =>
      child.name.toLowerCase().includes('hover') ||
      child.name.toLowerCase().includes(':hover')
  );
  if (hasHoverLayer) {
    props.push({
      name: 'isHovered',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Hover state',
      control: { type: 'boolean' },
    });
  }

  // Check for focus state layer
  const hasFocusLayer = node.children.some(
    (child: DesignNode) =>
      child.name.toLowerCase().includes('focus') ||
      child.name.toLowerCase().includes(':focus')
  );
  if (hasFocusLayer) {
    props.push({
      name: 'isFocused',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Focus state',
      control: { type: 'boolean' },
    });
  }

  // Check for active state layer
  const hasActiveLayer = node.children.some(
    (child: DesignNode) =>
      child.name.toLowerCase().includes('active') ||
      child.name.toLowerCase().includes(':active') ||
      child.name.toLowerCase().includes('pressed')
  );
  if (hasActiveLayer) {
    props.push({
      name: 'isActive',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Active/pressed state',
      control: { type: 'boolean' },
    });
  }

  return props;
}

/**
 * Infer children prop for container components
 */
function inferChildrenProp(node: FrameNode): PropDefinition | null {
  // Check if the node has children that could be content
  if (!node.children || node.children.length === 0) {
    return null;
  }

  // Check if node name suggests it's a container
  const containerIndicators = [
    'card',
    'container',
    'wrapper',
    'box',
    'panel',
    'modal',
    'dialog',
    'sheet',
    'popover',
    'dropdown',
    'menu',
    'list',
  ];

  const isContainer = containerIndicators.some((indicator) =>
    node.name.toLowerCase().includes(indicator)
  );

  // Also check if there are text children
  const hasTextChildren = node.children.some((child: DesignNode) => child.type === 'TEXT');

  if (isContainer || hasTextChildren) {
    return {
      name: 'children',
      type: 'React.ReactNode',
      required: false,
      description: 'Content to display inside the component',
    };
  }

  return null;
}

/**
 * Convert kebab-case or PascalCase to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (char) => char.toLowerCase());
}

/**
 * Deduplicate props by name, preferring more detailed definitions
 */
function deduplicateProps(props: PropDefinition[]): PropDefinition[] {
  const seen = new Map<string, PropDefinition>();

  for (const prop of props) {
    const existing = seen.get(prop.name);

    if (!existing) {
      seen.set(prop.name, prop);
    } else {
      // Keep the more detailed one
      if (!existing.description && prop.description) {
        seen.set(prop.name, prop);
      }
      if (!existing.enum && prop.enum) {
        seen.set(prop.name, prop);
      }
      if (prop.defaultValue !== undefined && existing.defaultValue === undefined) {
        seen.set(prop.name, prop);
      }
    }
  }

  // Sort: children first, then alphabetically
  return Array.from(seen.values()).sort((a, b) => {
    if (a.name === 'children') return -1;
    if (b.name === 'children') return 1;
    return a.name.localeCompare(b.name);
  });
}

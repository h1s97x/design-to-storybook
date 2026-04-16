/**
 * React Component Generator
 * 
 * Generates React component code from design nodes
 */

import type {
  DesignNode,
  TextNode,
  PropDefinition,
  StyleDefinition,
} from '@design-to-storybook/core';
import { generateClassName, inferHTMLTag } from '@design-to-storybook/core';

export interface ReactGeneratorOptions {
  useStyledComponents: boolean;
  useCSSModules: boolean;
  addJSDoc: boolean;
  generateSubcomponents: boolean;
}

/**
 * Generate a React component from a design node
 */
export function generateReactComponent(
  node: DesignNode,
  options: Partial<ReactGeneratorOptions> = {}
): { code: string; styles: StyleDefinition[] } {
  const opts: ReactGeneratorOptions = {
    useStyledComponents: options.useStyledComponents ?? false,
    useCSSModules: options.useCSSModules ?? false,
    addJSDoc: options.addJSDoc ?? true,
    generateSubcomponents: options.generateSubcomponents ?? true,
  };

  const tag = inferHTMLTag(node);
  const className = generateClassName(node.name);
  const styles: StyleDefinition[] = [];

  // Build component code
  const componentCode = buildComponent(node, tag, className, opts);
  
  // Generate style definition
  styles.push({
    className,
    css: buildCSS(node),
    tailwind: {},
  });

  return {
    code: componentCode,
    styles,
  };
}

/**
 * Build the component JSX and props
 */
function buildComponent(
  node: DesignNode,
  tag: string,
  className: string,
  options: ReactGeneratorOptions
): string {
  const lines: string[] = [];

  // Add JSDoc comment if enabled
  if (options.addJSDoc) {
    lines.push(`/**`);
    lines.push(` * ${node.name} component`);
    lines.push(` * Auto-generated from Figma design`);
    lines.push(` */`);
  }

  // Generate props interface
  const props = inferPropsFromNode(node);
  if (props.length > 0) {
    lines.push(`interface ${node.name}Props {`);
    for (const prop of props) {
      lines.push(`  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`);
    }
    lines.push(`}`);
    lines.push('');
  }

  // Generate component
  lines.push(`export function ${node.name}({`);
  if (props.length > 0) {
    lines.push(...props.map(p => `  ${p.name}`));
  }
  lines.push(`}: ${node.name}Props) {`);
  lines.push(`  return (`);

  // JSX element
  const htmlTag = tag === 'img' ? 'img' : tag;
  const isSelfClosing = ['img', 'input', 'br', 'hr'].includes(htmlTag);
  
  const styleAttr = options.useStyledComponents 
    ? '' 
    : ` className="${className}"`;

  if (isSelfClosing) {
    lines.push(`    <${htmlTag}${styleAttr} />`);
  } else {
    // Check for children
    const childrenContent = inferChildrenContent(node);
    if (childrenContent) {
      lines.push(`    <${htmlTag}${styleAttr}>`);
      lines.push(`      ${childrenContent}`);
      lines.push(`    </${htmlTag}>`);
    } else {
      lines.push(`    <${htmlTag}${styleAttr} />`);
    }
  }

  lines.push(`  );`);
  lines.push(`}`);

  return lines.join('\n');
}

/**
 * Infer props from a design node
 */
function inferPropsFromNode(node: DesignNode): PropDefinition[] {
  const props: PropDefinition[] = [];

  // Check for component properties
  if (node.type === 'COMPONENT' && 'componentProperties' in node) {
    const componentProps = node.componentProperties as Record<string, { type: string; value?: unknown }>;
    for (const [key, value] of Object.entries(componentProps)) {
      props.push({
        name: key,
        type: inferType(value.type),
        required: false,
      });
    }
  }

  // Check for variant properties
  if (node.type === 'COMPONENT_SET' && 'componentPropertyDefinitions' in node) {
    const variantDefs = node.componentPropertyDefinitions as Record<string, { type: string; variantOptions?: string[] }>;
    for (const [key, def] of Object.entries(variantDefs)) {
      if (def.variantOptions) {
        props.push({
          name: key,
          type: def.variantOptions.map(v => `'${v}'`).join(' | ') || 'string',
          required: false,
          enum: def.variantOptions,
        });
      }
    }
  }

  // Infer from naming conventions
  const nameLower = node.name.toLowerCase();
  if (nameLower.includes('disabled')) {
    props.push({ name: 'disabled', type: 'boolean', required: false });
  }
  if (nameLower.includes('loading')) {
    props.push({ name: 'loading', type: 'boolean', required: false });
  }
  if (nameLower.includes('active')) {
    props.push({ name: 'active', type: 'boolean', required: false });
  }
  if (nameLower.includes('selected')) {
    props.push({ name: 'selected', type: 'boolean', required: false });
  }
  if (nameLower.includes('variant')) {
    props.push({ name: 'variant', type: "'primary' | 'secondary' | 'tertiary'", required: false });
  }
  if (nameLower.includes('size')) {
    props.push({ name: 'size', type: "'small' | 'medium' | 'large'", required: false });
  }

  // Check for children (container components)
  if ('children' in node && node.children && node.children.length > 0) {
    const containerIndicators = ['card', 'container', 'box', 'panel', 'modal'];
    if (containerIndicators.some(ind => nameLower.includes(ind))) {
      props.push({ name: 'children', type: 'React.ReactNode', required: false });
    }
  }

  return props;
}

/**
 * Infer TypeScript type from Figma property type
 */
function inferType(figmaType: string): string {
  switch (figmaType.toUpperCase()) {
    case 'BOOLEAN':
      return 'boolean';
    case 'TEXT':
      return 'string';
    case 'VARIANT':
      return 'string';
    case 'INSTANCE_SWAP':
      return 'React.ReactNode';
    default:
      return 'unknown';
  }
}

/**
 * Infer children content from text nodes
 */
function inferChildrenContent(node: DesignNode): string {
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    return textNode.characters || '';
  }

  if ('children' in node && node.children && (node.children as DesignNode[]).length > 0) {
    const children = node.children as DesignNode[];
    // Check for text children
    const textChild = children.find(c => c.type === 'TEXT') as TextNode | undefined;
    if (textChild) {
      return textChild.characters || '';
    }
  }

  return '';
}

/**
 * Build CSS from node styles
 */
function buildCSS(node: DesignNode): Record<string, string> {
  const css: Record<string, string> = {};

  // Dimensions
  if (node.absoluteBoundingBox) {
    css.width = `${node.absoluteBoundingBox.width}px`;
    css.height = `${node.absoluteBoundingBox.height}px`;
  }

  // Opacity
  if ('opacity' in node && node.opacity !== undefined) {
    css.opacity = String(node.opacity);
  }

  return css;
}

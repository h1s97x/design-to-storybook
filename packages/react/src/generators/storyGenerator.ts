/**
 * Storybook Story Generator
 * 
 * Generates Storybook story files from design nodes
 */

import type {
  DesignNode,
  PropDefinition,
  GeneratedStory,
  StoryFile,
  GeneratedComponent,
} from '@design-to-storybook/core';

export interface StoryGeneratorOptions {
  titlePrefix?: string;
  includeControls?: boolean;
}

/**
 * Generate Storybook stories from a design node
 */
export function generateStory(
  component: GeneratedComponent,
  node: DesignNode,
  options: StoryGeneratorOptions = {}
): StoryFile {
  const title = generateTitle(node, options.titlePrefix);
  const meta = generateMeta(component, title);
  const stories = generateStories(component, node, options);

  return {
    title,
    component: component.name,
    imports: generateImports(component),
    defaultExport: {
      component: component.name,
      parameters: {
        layout: 'centered',
        docs: {
          description: {
            component: `Auto-generated from Figma: ${node.name}`,
          },
        },
      },
    },
    meta,
    stories,
  };
}

/**
 * Generate the complete story file content
 */
export function generateStoryFile(
  component: GeneratedComponent,
  node: DesignNode,
  options: StoryGeneratorOptions = {}
): string {
  const storyFile = generateStory(component, node, options);

  // Build the file content
  const lines: string[] = [];

  // Imports
  lines.push(...storyFile.imports);
  lines.push('');

  // Default export with meta
  lines.push('const meta: Meta<typeof ' + storyFile.component + '> = {');
  lines.push(`  title: '${storyFile.title}',`);
  lines.push(`  component: ${storyFile.component},`);

  if (storyFile.meta.parameters) {
    lines.push('  parameters: {');
    if (storyFile.meta.parameters.layout) {
      lines.push(`    layout: '${storyFile.meta.parameters.layout}',`);
    }
    if (storyFile.meta.parameters.docs) {
      lines.push('    docs: {');
      lines.push('      description: {');
      lines.push(`        component: '${(storyFile.meta.parameters.docs as any).description?.component || ''}',`);
      lines.push('      },');
      lines.push('    },');
    }
    lines.push('  },');
  }

  // Arg types
  if (storyFile.meta.argTypes && Object.keys(storyFile.meta.argTypes).length > 0) {
    lines.push('  argTypes: {');
    for (const [name, argType] of Object.entries(storyFile.meta.argTypes)) {
      lines.push(`    ${name}: {`);
      if (argType.description) {
        lines.push(`      description: '${argType.description}',`);
      }
      if (argType.control) {
        lines.push('      control: {');
        lines.push(`        type: '${argType.control.type}',`);
        if (argType.control.options) {
          lines.push(`        options: ${JSON.stringify(argType.control.options)},`);
        }
        lines.push('      },');
      }
      lines.push('    },');
    }
    lines.push('  },');
  }

  lines.push('};');
  lines.push('');
  lines.push('export default meta;');
  lines.push('type Story = StoryObj<typeof ' + storyFile.component + '>;');
  lines.push('');

  // Stories
  for (const story of storyFile.stories) {
    lines.push(`export const ${story.name}: Story = {`);
    lines.push('  args: {');
    for (const [key, value] of Object.entries(story.args)) {
      if (typeof value === 'string') {
        lines.push(`    ${key}: '${value}',`);
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`    ${key}: ${JSON.stringify(value)},`);
      } else {
        lines.push(`    ${key}: ${value},`);
      }
    }
    lines.push('  },');
    lines.push('};');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate import statements
 */
function generateImports(component: GeneratedComponent): string[] {
  const imports = [
    "import type { Meta, StoryObj } from '@storybook/react';",
    `import { ${component.name} } from './${component.name}';`,
  ];

  return imports;
}

/**
 * Generate story title
 */
function generateTitle(node: DesignNode, prefix?: string): string {
  // Convert name to Storybook title format
  const parts = node.name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  const title = parts.join('/');

  return prefix ? `${prefix}/${title}` : `Components/${title}`;
}

/**
 * Generate metadata
 */
function generateMeta(
  component: GeneratedComponent,
  title: string
): StoryFile['meta'] {
  return {
    title,
    component: component.name,
    parameters: {
      layout: 'centered',
      docs: {
        description: {
          component: `Auto-generated from Figma design`,
        },
      },
    },
    argTypes: component.props.reduce((acc, prop) => {
      acc[prop.name] = prop;
      return acc;
    }, {} as Record<string, PropDefinition>),
  };
}

/**
 * Generate stories
 */
function generateStories(
  component: GeneratedComponent,
  node: DesignNode,
  _options: StoryGeneratorOptions
): GeneratedStory[] {
  const stories: GeneratedStory[] = [];

  // Default story with basic args
  stories.push({
    name: 'Default',
    args: getDefaultArgs(component.props),
  });

  // Variant stories
  if (node.type === 'COMPONENT_SET' && node.children) {
    for (const child of node.children) {
      const variantArgs = inferArgsFromNode(child, component.props);
      stories.push({
        name: toStoryName(child.name),
        args: variantArgs,
      });
    }
  }

  // Size variants
  const sizeProp = component.props.find((p) => p.name === 'size');
  if (sizeProp?.enum) {
    for (const size of sizeProp.enum) {
      if (size !== 'medium') {
        // Skip 'medium' as it's already in Default
        const args = { ...getDefaultArgs(component.props), size };
        stories.push({
          name: toStoryName(size),
          args,
        });
      }
    }
  }

  // State stories
  const disabledProp = component.props.find((p) => p.name === 'disabled');
  if (disabledProp) {
    stories.push({
      name: 'Disabled',
      args: { ...getDefaultArgs(component.props), disabled: true },
    });
  }

  const loadingProp = component.props.find((p) => p.name === 'loading');
  if (loadingProp) {
    stories.push({
      name: 'Loading',
      args: { ...getDefaultArgs(component.props), loading: true },
    });
  }

  return stories;
}

/**
 * Get default args for a story
 */
function getDefaultArgs(props: PropDefinition[]): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  for (const prop of props) {
    if (prop.name === 'children') {
      args.children = 'Button';
      continue;
    }

    if (prop.defaultValue !== undefined) {
      args[prop.name] = prop.defaultValue;
    } else if (prop.enum && prop.enum.length > 0) {
      args[prop.name] = prop.enum[0];
    } else if (prop.type === 'boolean') {
      args[prop.name] = false;
    } else if (prop.type === 'string') {
      args[prop.name] = prop.name === 'variant' ? 'primary' : '';
    }
  }

  return args;
}

/**
 * Infer args from a variant node
 */
function inferArgsFromNode(
  node: DesignNode,
  props: PropDefinition[]
): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  // Extract variant value from name
  const nameParts = node.name.split('/');
  if (nameParts.length > 1) {
    const variant = nameParts[nameParts.length - 1];
    args.variant = variant;
  }

  // Extract from component properties
  if (node.type === 'COMPONENT' && node.componentProperties) {
    for (const [key, value] of Object.entries(node.componentProperties)) {
      if (value.type === 'TEXT') {
        args[key] = value.value;
      } else if (value.type === 'BOOLEAN') {
        args[key] = value.value;
      } else if (value.type === 'VARIANT') {
        args.variant = value.value;
      }
    }
  }

  // Add default values for missing props
  for (const prop of props) {
    if (args[prop.name] === undefined) {
      if (prop.defaultValue !== undefined) {
        args[prop.name] = prop.defaultValue;
      } else if (prop.name === 'children') {
        args.children = 'Button';
      }
    }
  }

  return args;
}

/**
 * Convert name to valid Storybook story name
 */
function toStoryName(name: string): string {
  return name
    .split(/[-_\s/]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

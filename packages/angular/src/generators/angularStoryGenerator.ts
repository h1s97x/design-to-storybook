/**
 * Angular Story Generator
 * Generates Storybook stories for Angular components
 */

import type { PropDefinition } from '@design-to-storybook/core';

export interface AngularStoryOutput {
  storyFile: string;
  meta: string;
}

interface VariantInfo {
  name: string;
  props: Record<string, unknown>;
}

/**
 * Angular Story Generator
 * Generates Storybook CSF3 stories for Angular components
 */
export class AngularStoryGenerator {
  
  /**
   * Generate stories
   */
  generate(
    componentName: string,
    componentPath: string,
    props: PropDefinition[],
    variants?: VariantInfo[]
  ): AngularStoryOutput {
    const kebabName = this.toKebabCase(componentName);
    const meta = this.generateMeta(componentName, componentPath);
    const defaultStory = this.generateDefaultStory(kebabName, props);
    const variantStories = this.generateVariantStories(variants || []);
    const argTypes = this.generateArgTypes(props);
    
    const storyFile = `${meta}

${defaultStory}
${variantStories}

export const argTypes = ${argTypes};
`;
    
    return {
      storyFile,
      meta,
    };
  }
  
  /**
   * Generate meta information
   */
  private generateMeta(componentName: string, componentPath: string): string {
    return `import type { Meta, StoryObj } from '@storybook/angular';
import { ${componentName} } from '${componentPath}';

const meta: Meta<${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  argTypes: {},
};
export default meta;`;
  }
  
  /**
   * Generate default story
   */
  private generateDefaultStory(_kebabName: string, props: PropDefinition[]): string {
    const args = this.generateArgs(props);
    
    return `
export const Default: StoryObj<typeof meta.component> = {
  args: {${args}
  },
};
`;
  }
  
  /**
   * Generate variant stories
   */
  private generateVariantStories(variants: VariantInfo[]): string {
    if (variants.length === 0) return '';
    
    return variants
      .map(v => `
export const ${this.toStoryName(v.name)}: StoryObj<typeof meta.component> = {
  name: '${v.name}',
  args: {${this.generateArgsFromObject(v.props)}
  },
};`)
      .join('\n');
  }
  
  /**
   * Generate args string
   */
  private generateArgs(props: PropDefinition[]): string {
    if (props.length === 0) return '';
    
    return '\n' + props
      .filter(p => p.defaultValue !== undefined)
      .map(p => `    ${p.name}: ${this.formatValue(p.defaultValue)},`)
      .join('\n') + '\n  ';
  }
  
  /**
   * Generate args from object
   */
  private generateArgsFromObject(args: Record<string, unknown>): string {
    if (Object.keys(args).length === 0) return '';
    
    return '\n' + Object.entries(args)
      .map(([k, v]) => `    ${k}: ${this.formatValue(v)},`)
      .join('\n') + '\n  ';
  }
  
  /**
   * Generate argTypes
   */
  private generateArgTypes(props: PropDefinition[]): string {
    if (props.length === 0) return '{}';
    
    const entries = props.map(p => {
      const control = this.getControlType(p);
      return `    ${p.name}: { control: '${control}'${p.options && p.options.length > 0 ? `, options: [${p.options.map(o => `'${o}'`).join(', ')}]` : ''} },`;
    }).join('\n');
    
    return `{\n${entries}\n}`;
  }
  
  /**
   * Convert name to kebab-case
   */
  private toKebabCase(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
  
  /**
   * Convert name to story name
   */
  private toStoryName(name: string): string {
    return name
      .split(/[-\s]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }
  
  /**
   * Get control type for prop
   */
  private getControlType(prop: PropDefinition): string {
    if (prop.type === 'boolean') return 'boolean';
    if (prop.type === 'number') return 'number';
    if (prop.options && prop.options.length > 0) return 'select';
    if (prop.type === 'icon') return 'select';
    return 'text';
  }
  
  /**
   * Format value for TypeScript
   */
  private formatValue(value: unknown): string {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === null || value === undefined) return 'undefined';
    return String(value);
  }
}

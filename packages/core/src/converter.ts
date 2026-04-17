/**
 * Design Converter Class
 * 
 * Main entry point for converting designs
 */

import type {
  PropDefinition,
  DesignNode,
  ExtractedFill,
  ExtractedStroke,
  ExtractedEffect
} from './types';

import {
  extractStyle,
  inferProps
} from './index';

export interface DesignConverterOptions {
  framework?: 'react' | 'vue' | 'angular';
  typescript?: boolean;
  styleFormat?: 'css' | 'scss' | 'tailwind';
  componentName?: string;
}

/**
 * Main converter class
 */
export class DesignConverter {
  private options: Required<DesignConverterOptions>;

  constructor(options: DesignConverterOptions = {}) {
    this.options = {
      framework: options.framework || 'react',
      typescript: options.typescript ?? true,
      styleFormat: options.styleFormat || 'css',
      componentName: options.componentName || 'Component'
    };
  }

  /**
   * Convert a design to component
   */
  convert(design: unknown): {
    component: string;
    story: string;
    styles: string;
    types: string;
  } {
    const designNode = design as DesignNode;
    
    // Extract information
    const extractedStyle = extractStyle(designNode);
    const props = inferProps(designNode);

    // Generate CSS from extracted style
    const css = this.generateCSSFromExtracted(extractedStyle);

    return {
      component: this.generateComponent(props),
      story: this.generateStory(props),
      styles: css,
      types: this.generateTypes(props)
    };
  }

  /**
   * Generate CSS from extracted style
   */
  private generateCSSFromExtracted(style: {
    fill?: ExtractedFill;
    stroke?: ExtractedStroke;
    effects: ExtractedEffect[];
    opacity?: number;
    cornerRadius?: number;
  }): string {
    const lines: string[] = [];
    
    if (style.fill?.color) {
      const c = style.fill.color;
      const r = Math.round(c.r * 255);
      const g = Math.round(c.g * 255);
      const b = Math.round(c.b * 255);
      const a = c.a ?? 1;
      lines.push(`  background-color: rgba(${r}, ${g}, ${b}, ${a});`);
    }
    if (style.stroke?.color && style.stroke?.width) {
      lines.push(`  border: ${style.stroke.width}px solid ${style.stroke.color};`);
    }
    if (style.cornerRadius) {
      lines.push(`  border-radius: ${style.cornerRadius}px;`);
    }
    if (style.effects && style.effects.length > 0) {
      lines.push(`  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);`);
    }
    if (style.opacity !== undefined) {
      lines.push(`  opacity: ${style.opacity};`);
    }
    
    return `.${this.options.componentName.toLowerCase()} {\n${lines.join('\n')}\n}`;
  }

  /**
   * Generate component code
   */
  private generateComponent(props: PropDefinition[]): string {
    const componentCode = `
import React from 'react';
${this.options.styleFormat === 'css' ? `import './${this.options.componentName}.css';` : ''}

export interface ${this.options.componentName}Props {
${props.map(p => `  ${p.name}?: ${p.type};`).join('\n')}
}

export const ${this.options.componentName}: React.FC<${this.options.componentName}Props> = ({
${props.map(p => `  ${p.name},`).join('\n')}
}) => {
  return (
    <div className="${this.options.componentName.toLowerCase()}">
      {/* Component content */}
    </div>
  );
};
`;

    return componentCode;
  }

  /**
   * Generate story code
   */
  private generateStory(props: PropDefinition[]): string {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${this.options.componentName} } from './${this.options.componentName}';

const meta: Meta<typeof ${this.options.componentName}> = {
  title: 'Components/${this.options.componentName}',
  component: ${this.options.componentName},
};

export default meta;
type Story = StoryObj<typeof ${this.options.componentName}>;

export const Default: Story = {
  args: {
${props.slice(0, 3).map(p => `    ${p.name}: ${JSON.stringify(p.defaultValue) || 'undefined'},`).join('\n')}
  },
};
`;
  }

  /**
   * Generate TypeScript types
   */
  private generateTypes(props: PropDefinition[]): string {
    return `export interface ${this.options.componentName}Props {
${props.map(p => `  /** ${p.description || ''} */\n  ${p.name}?: ${p.type};`).join('\n')}
}
`;
  }
}

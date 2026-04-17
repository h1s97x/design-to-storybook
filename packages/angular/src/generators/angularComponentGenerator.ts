/**
 * Angular Component Generator
 * Generates Angular components from Figma designs
 */

import type { PropDefinition } from '@design-to-storybook/core';

// Type exports
export interface AngularComponentOutput {
  component: string;
  module: string;
  types: string;
}

// Design node type - simplified for Angular
export interface DesignNode {
  id: string;
  name: string;
  type: string;
  children?: DesignNode[];
  characters?: string;
  style?: {
    backgroundColor?: string;
    borderRadius?: number;
    padding?: string;
    width?: number;
    height?: number;
  };
}

/**
 * Angular Component Generator
 * Converts Figma designs to Angular standalone components
 */
export class AngularComponentGenerator {
  
  /**
   * Generate Angular component from design
   */
  generate(design: DesignNode, props: PropDefinition[]): AngularComponentOutput {
    const componentName = this.toComponentName(design.name);
    const template = this.generateTemplate(design);
    const styles = this.generateStyles(design);
    const className = this.toClassName(design.name);
    
    return {
      component: this.generateComponent(componentName, className, template, styles, props),
      module: this.generateModule(componentName),
      types: this.generateTypes(props),
    };
  }
  
  /**
   * Generate component template
   */
  private generateTemplate(design: DesignNode): string {
    const tag = this.getHtmlTag(design);
    const className = this.toKebabCase(design.name);
    const children = design.children?.map(c => this.generateTemplate(c)).join('\n') || '';
    
    if (design.type === 'TEXT' && design.characters) {
      return `<span class="${className}">${design.characters}</span>`;
    }
    
    if (children) {
      return `<${tag} class="${className}">\n  ${children}\n</${tag}>`;
    }
    
    return `<${tag} class="${className}"></${tag}>`;
  }
  
  /**
   * Generate component styles
   */
  private generateStyles(design: DesignNode): string {
    if (!design.style) return '';
    
    const { backgroundColor, borderRadius, padding, width, height } = design.style;
    const styles: string[] = [];
    
    if (backgroundColor) styles.push(`background-color: ${backgroundColor};`);
    if (borderRadius) styles.push(`border-radius: ${borderRadius}px;`);
    if (padding) styles.push(`padding: ${padding};`);
    if (width) styles.push(`width: ${width}px;`);
    if (height) styles.push(`height: ${height}px;`);
    
    return styles.join('\n  ');
  }
  
  /**
   * Generate full component file
   */
  private generateComponent(
    name: string,
    _className: string,
    template: string,
    styles: string,
    props: PropDefinition[]
  ): string {
    const inputs = props
      .filter(p => p.required)
      .map(p => `  @Input() ${p.name}: ${this.toType(p)} = ${this.getDefault(p)};`)
      .join('\n');
    
    return `import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-${this.toKebabCase(name)}',
  standalone: true,
  imports: [CommonModule],
  template: \`
${template}
  \`,
  styles: [\`
${styles}
  \`]
})
export class ${name}Component {
${inputs}
}
`;
  }
  
  /**
   * Generate Angular module
   */
  private generateModule(name: string): string {
    return `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ${name}Component } from './${this.toKebabCase(name)}.component';

@NgModule({
  declarations: [${name}Component],
  imports: [CommonModule],
  exports: [${name}Component]
})
export class ${name}Module { }
`;
  }
  
  /**
   * Generate type definitions
   */
  private generateTypes(props: PropDefinition[]): string {
    if (props.length === 0) return '';
    
    const typeFields = props.map(p => `  ${p.name}?: ${this.toType(p)};`).join('\n');
    return `export interface ${this.toComponentName('Component')}Props {\n${typeFields}\n}`;
  }
  
  /**
   * Convert name to component name
   */
  private toComponentName(name: string): string {
    return name
      .split(/[-\s]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('') + 'Component';
  }
  
  /**
   * Convert name to class name
   */
  private toClassName(name: string): string {
    return name
      .split(/[-\s]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
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
   * Get HTML tag for node type
   */
  private getHtmlTag(design: DesignNode): string {
    const tagMap: Record<string, string> = {
      'FRAME': 'div',
      'GROUP': 'div',
      'COMPONENT': 'div',
      'RECTANGLE': 'div',
      'ELLIPSE': 'div',
      'TEXT': 'span',
      'VECTOR': 'svg',
      'LINE': 'hr',
      'INSTANCE': 'div',
    };
    return tagMap[design.type] || 'div';
  }
  
  /**
   * Convert type to TypeScript type
   */
  private toType(prop: PropDefinition): string {
    if (prop.type === 'boolean') return 'boolean';
    if (prop.type === 'number') return 'number';
    if (prop.type === 'string') return 'string';
    if (prop.options && prop.options.length > 0) {
      return prop.options.map(o => `'${o}'`).join(' | ');
    }
    return 'string';
  }
  
  /**
   * Get default value for prop
   */
  private getDefault(prop: PropDefinition): string {
    if (prop.defaultValue !== undefined) {
      if (typeof prop.defaultValue === 'string') return `'${prop.defaultValue}'`;
      if (typeof prop.defaultValue === 'boolean') return String(prop.defaultValue);
      return String(prop.defaultValue);
    }
    if (prop.type === 'boolean') return 'false';
    if (prop.type === 'number') return '0';
    return "''";
  }
}

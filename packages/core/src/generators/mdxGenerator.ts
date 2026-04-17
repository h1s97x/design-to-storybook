import type { PropDefinition, DesignToken, VariantDefinition } from '../types/index.js';

/**
 * MDX Documentation Generator
 * Generates MDX documentation files for Storybook
 */
export class MDXGenerator {
  
  /**
   * Generate MDX documentation
   */
  generate(options: MDXGeneratorOptions): string {
    const sections: string[] = [];
    
    // Frontmatter
    sections.push(this.generateFrontmatter(options));
    
    // Overview
    sections.push(this.generateOverview(options));
    
    // Import
    sections.push(this.generateImport(options));
    
    // Usage
    sections.push(this.generateUsage(options));
    
    // Props
    sections.push(this.generateProps(options.props));
    
    // Variants
    if (options.variants && options.variants.length > 0) {
      sections.push(this.generateVariants(options.variants));
    }
    
    // Examples
    sections.push(this.generateExamples(options));
    
    // Design Tokens
    if (options.tokens && options.tokens.length > 0) {
      sections.push(this.generateDesignTokens(options.tokens));
    }
    
    // Best Practices
    sections.push(this.generateBestPractices(options));
    
    // Accessibility
    sections.push(this.generateAccessibility(options));
    
    return sections.filter(Boolean).join('\n\n---\n\n');
  }
  
  /**
   * Generate frontmatter
   */
  private generateFrontmatter(options: MDXGeneratorOptions): string {
    return `---
title: ${options.componentName}
description: ${options.description || `Documentation for ${options.componentName} component`}
${options.tags ? `tags: [${options.tags.map(t => `'${t}'`).join(', ')}]` : ''}
${options.status ? `status: ${options.status}` : ''}
---
`;
  }
  
  /**
   * Generate overview section
   */
  private generateOverview(options: MDXGeneratorOptions): string {
    return `## Overview

${options.overview || `${options.componentName} is a reusable UI component that provides ${options.description || 'specific functionality'}.`}`;
  }
  
  /**
   * Generate import section
   */
  private generateImport(options: MDXGeneratorOptions): string {
    const frameworkImports: Record<string, string> = {
      react: `import { ${options.componentName} } from '@/components/${options.componentName}';`,
      vue: `import { ${options.componentName} } from '@/components/${options.componentName}.vue';`,
      angular: `import { ${options.componentName}Component } from './${options.componentName}.component';`
    };
    
    const importStatement = frameworkImports[options.framework] || frameworkImports.react;
    
    return `## Import

\`\`\`${options.framework}
${importStatement}
\`\`\``;
  }
  
  /**
   * Generate usage section
   */
  private generateUsage(options: MDXGeneratorOptions): string {
    const exampleCode = this.generateExampleCode(options);
    
    return `## Usage

\`\`\`${options.framework}
${exampleCode}
\`\`\``;
  }
  
  /**
   * Generate example code
   */
  private generateExampleCode(options: MDXGeneratorOptions): string {
    const defaultProps = options.props
      .filter(p => p.defaultValue !== undefined)
      .map(p => `  ${p.name}="${p.defaultValue}"`)
      .join('\n');
    
    if (options.framework === 'react') {
      return `<${options.componentName}${defaultProps ? `\n${defaultProps}\n` : ''}>
  {children}
</${options.componentName}>`;
    }
    
    if (options.framework === 'vue') {
      return `<${options.componentName}${defaultProps ? `\n  ${defaultProps}\n` : ''}>
  <template #default>${'{'}slot}</template>
</${options.componentName}>`;
    }
    
    if (options.framework === 'angular') {
      const selector = 'd2s-' + options.componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
      return `<${selector}${defaultProps ? '\n  ' + defaultProps.replace(/=/g, ':').replace(/"/g, '\'') + '\n' : ''}>
</${selector}>`;
    }
    
    return `<${options.componentName}></${options.componentName}>`;
  }
  
  /**
   * Generate props documentation
   */
  private generateProps(props: PropDefinition[]): string {
    if (props.length === 0) {
      return `## Props

This component does not accept any props.`;
    }
    
    const rows = props.map(prop => {
      const type = prop.options ? prop.options.map(o => `\`${o}\``).join(' | ') : `\`${prop.type}\``;
      const defaultVal = prop.defaultValue !== undefined ? `\`${prop.defaultValue}\`` : '-';
      const required = prop.required ? 'Yes' : 'No';
      const description = prop.description || '-';
      
      return `| \`${prop.name}\` | ${type} | ${defaultVal} | ${required} | ${description} |`;
    }).join('\n');
    
    return `## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
${rows}`;
  }
  
  /**
   * Generate variants section
   */
  private generateVariants(variants: VariantDefinition[]): string {
    const variantDescriptions = variants.map(v => {
      const props = Object.entries(v.properties)
        .map(([k, v]) => `\`${k}: ${v}\``)
        .join(', ');
      return `- **${v.name}**: ${props}`;
    }).join('\n');
    
    return `## Variants

${variants.map(v => `### ${v.name}`).join('\n\n')}

${variantDescriptions}`;
  }
  
  /**
   * Generate examples section
   */
  private generateExamples(options: MDXGeneratorOptions): string {
    const examples: string[] = ['## Examples'];
    
    // Basic example
    examples.push(`### Basic

<Canvas>
  <Story name="Basic">
    {() => ({
${this.generateStoryExample(options, 'Basic')}
    })}
  </Story>
</Canvas>`);
    
    // With props
    if (options.props.length > 0) {
      examples.push(`### With Props

<Canvas>
  <Story name="WithProps">
    {() => ({
${this.generateStoryExample(options, 'WithProps', true)}
    })}
  </Story>
</Canvas>`);
    }
    
    return examples.join('\n\n');
  }
  
  /**
   * Generate story example code
   */
  private generateStoryExample(options: MDXGeneratorOptions, _storyName: string, withProps: boolean = false): string {
    if (options.framework === 'react') {
      const propsStr = withProps && options.props.length > 0
        ? `      props: {\n${options.props.slice(0, 2).map(p => `        ${p.name}: ${this.formatDefaultValue(p)},`).join('\n')}\n      },`
        : '';
      
      return `      component: ${options.componentName},
${propsStr}
      template: \`
        <${options.componentName}>
          {children}
        </${options.componentName}>
      \`,`;
    }
    
    return `      component: ${options.componentName},`;
  }
  
  /**
   * Format default value for template
   */
  private formatDefaultValue(prop: PropDefinition): string {
    if (prop.type === 'string') return `'${prop.defaultValue || ''}'`;
    if (prop.type === 'boolean') return String(prop.defaultValue || false);
    if (prop.type === 'number') return String(prop.defaultValue || 0);
    return 'null';
  }
  
  /**
   * Generate design tokens section
   */
  private generateDesignTokens(tokens: DesignToken[]): string {
    const colorTokens = tokens.filter(t => t.type === 'color');
    const spacingTokens = tokens.filter(t => t.type === 'spacing');
    const typographyTokens = tokens.filter(t => t.type === 'typography');
    const shadowTokens = tokens.filter(t => t.type === 'shadow');
    
    const sections: string[] = ['## Design Tokens'];
    
    if (colorTokens.length > 0) {
      sections.push(`### Colors

| Token | Value |
|-------|-------|
${colorTokens.map(t => `| \`--${t.name}\` | <ColorSwatch color="${t.value}" /> |`).join('\n')}`);
    }
    
    if (spacingTokens.length > 0) {
      sections.push(`### Spacing

| Token | Value |
|-------|-------|
${spacingTokens.map(t => `| \`--${t.name}\` | ${t.value}px |`).join('\n')}`);
    }
    
    if (typographyTokens.length > 0) {
      sections.push(`### Typography

| Token | Font | Size | Weight |
|-------|------|------|--------|
${typographyTokens.map(t => {
  const { fontFamily, fontSize, fontWeight } = t.value;
  return `| \`--${t.name}\` | ${fontFamily} | ${fontSize}px | ${fontWeight} |`;
}).join('\n')}`);
    }
    
    if (shadowTokens.length > 0) {
      sections.push(`### Shadows

| Token | Value |
|-------|-------|
${shadowTokens.map(t => `| \`--${t.name}\` | ${t.value} |`).join('\n')}`);
    }
    
    return sections.join('\n\n');
  }
  
  /**
   * Generate best practices section
   */
  private generateBestPractices(_options: MDXGeneratorOptions): string {
    const dos = [
      'Use semantic HTML elements where possible',
      'Provide accessible labels and ARIA attributes',
      'Follow the established naming conventions',
      'Test with various content lengths'
    ];
    
    const donts = [
      'Do not use inline styles when design tokens are available',
      'Do not hardcode colors or spacing values',
      'Do not skip accessibility testing'
    ];
    
    return `## Best Practices

### Do's

${dos.map(d => `- ${d}`).join('\n')}

### Don'ts

${donts.map(d => `- ${d}`).join('\n')}`;
  }
  
  /**
   * Generate accessibility section
   */
  private generateAccessibility(_options: MDXGeneratorOptions): string {
    return `## Accessibility

- Ensure proper color contrast ratios
- Add \`aria-label\` or \`aria-describedby\` when needed
- Support keyboard navigation
- Test with screen readers`;
  }
}

export interface MDXGeneratorOptions {
  componentName: string;
  framework: 'react' | 'vue' | 'angular';
  description?: string;
  overview?: string;
  tags?: string[];
  status?: string;
  props: PropDefinition[];
  variants?: VariantDefinition[];
  tokens?: DesignToken[];
}

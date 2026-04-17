import type { DesignNode, DesignToken, ColorToken, TypographyToken, SpacingToken, ShadowToken, BorderToken } from '../types/index.js';

/**
 * Design Token Extractor
 * Extracts design tokens from Figma design nodes
 */
export class TokenExtractor {
  private colorTokens: Map<string, ColorToken> = new Map();
  private typographyTokens: Map<string, TypographyToken> = new Map();
  private spacingTokens: Map<string, SpacingToken> = new Map();
  private shadowTokens: Map<string, ShadowToken> = new Map();
  private borderTokens: Map<string, BorderToken> = new Map();
  
  /**
   * Extract all design tokens from design nodes
   */
  extract(nodes: DesignNode[]): DesignToken[] {
    this.reset();
    
    for (const node of nodes) {
      this.extractFromNode(node as unknown as Record<string, unknown>);
    }
    
    return this.getAllTokens();
  }
  
  /**
   * Extract tokens from a single node (using generic object to access dynamic properties)
   */
  private extractFromNode(node: Record<string, unknown>): void {
    const styles = node.styles as Record<string, unknown> | undefined;
    const nodeName = (node.name as string) || 'unnamed';
    
    // Extract color tokens
    if (styles?.backgroundColor) {
      this.extractColorToken(String(styles.backgroundColor), nodeName);
    }
    
    if (styles?.color) {
      this.extractColorToken(String(styles.color), `${nodeName}-text`);
    }
    
    if (styles?.borderColor) {
      this.extractColorToken(String(styles.borderColor), `${nodeName}-border`);
    }
    
    // Extract typography tokens
    if (node.type === 'TEXT' && styles) {
      this.extractTypographyToken(nodeName, styles);
    }
    
    // Extract spacing tokens
    if (node.width !== undefined) {
      this.extractSpacingToken('width', Number(node.width));
    }
    if (node.height !== undefined) {
      this.extractSpacingToken('height', Number(node.height));
    }
    
    // Extract shadow tokens
    if (styles?.boxShadow) {
      this.extractShadowToken(String(styles.boxShadow), nodeName);
    }
    
    // Extract border tokens
    if (styles?.borderRadius !== undefined) {
      this.extractBorderToken(Number(styles.borderRadius), nodeName);
    }
    
    // Recursively process children
    const children = node.children as Record<string, unknown>[] | undefined;
    if (children) {
      for (const child of children) {
        this.extractFromNode(child);
      }
    }
  }
  
  /**
   * Extract color token
   */
  private extractColorToken(color: string, baseName: string): void {
    if (this.colorTokens.has(color)) return;
    
    const token: ColorToken = {
      name: this.toTokenName(baseName),
      type: 'color',
      value: color,
      description: `Color token for ${baseName}`
    };
    
    this.colorTokens.set(color, token);
  }
  
  /**
   * Extract typography token
   */
  private extractTypographyToken(nodeName: string, styles: Record<string, unknown>): void {
    const key = JSON.stringify({
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing
    });
    
    if (this.typographyTokens.has(key)) return;
    
    const token: TypographyToken = {
      name: this.toTokenName(nodeName),
      type: 'typography',
      value: {
        fontFamily: (styles.fontFamily as string) || 'inherit',
        fontSize: Number(styles.fontSize) || 16,
        fontWeight: Number(styles.fontWeight) || 400,
        lineHeight: Number(styles.lineHeight) || 1.5,
        letterSpacing: Number(styles.letterSpacing) || 0
      },
      description: `Typography for ${nodeName}`
    };
    
    this.typographyTokens.set(key, token);
  }
  
  /**
   * Extract spacing token
   */
  private extractSpacingToken(dimension: string, value: number): void {
    const normalizedValue = this.normalizeSpacing(value);
    const key = `${dimension}-${normalizedValue}`;
    
    if (this.spacingTokens.has(key)) return;
    
    const token: SpacingToken = {
      name: `spacing-${dimension}-${normalizedValue}`,
      type: 'spacing',
      value: normalizedValue,
      description: `Spacing token for ${dimension}`
    };
    
    this.spacingTokens.set(key, token);
  }
  
  /**
   * Extract shadow token
   */
  private extractShadowToken(shadow: string, baseName: string): void {
    if (this.shadowTokens.has(shadow)) return;
    
    const token: ShadowToken = {
      name: this.toTokenName(`${baseName}-shadow`),
      type: 'shadow',
      value: shadow,
      description: `Shadow token for ${baseName}`
    };
    
    this.shadowTokens.set(shadow, token);
  }
  
  /**
   * Extract border token
   */
  private extractBorderToken(value: number, baseName: string): void {
    const key = `radius-${value}`;
    
    if (this.borderTokens.has(key)) return;
    
    const token: BorderToken = {
      name: `border-radius-${value}`,
      type: 'border',
      value: `${value}px`,
      description: `Border radius token for ${baseName}`
    };
    
    this.borderTokens.set(key, token);
  }
  
  /**
   * Normalize spacing to common values
   */
  private normalizeSpacing(value: number): number {
    const commonValues = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96];
    
    for (const common of commonValues) {
      if (Math.abs(value - common) <= 1) {
        return common;
      }
    }
    
    return Math.round(value / 4) * 4;
  }
  
  /**
   * Convert name to token name format
   */
  private toTokenName(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();
  }
  
  /**
   * Get all extracted tokens
   */
  private getAllTokens(): DesignToken[] {
    return [
      ...Array.from(this.colorTokens.values()),
      ...Array.from(this.typographyTokens.values()),
      ...Array.from(this.spacingTokens.values()),
      ...Array.from(this.shadowTokens.values()),
      ...Array.from(this.borderTokens.values())
    ];
  }
  
  /**
   * Reset all tokens
   */
  private reset(): void {
    this.colorTokens.clear();
    this.typographyTokens.clear();
    this.spacingTokens.clear();
    this.shadowTokens.clear();
    this.borderTokens.clear();
  }
  
  /**
   * Generate Style Dictionary format
   */
  generateStyleDictionaryFormat(tokens: DesignToken[]): Record<string, unknown> {
    const result: Record<string, unknown> = {
      color: {},
      typography: {},
      spacing: {},
      shadow: {},
      border: {}
    };
    
    for (const token of tokens) {
      switch (token.type) {
        case 'color':
          (result.color as Record<string, unknown>)[token.name] = token.value;
          break;
        case 'typography':
          (result.typography as Record<string, unknown>)[token.name] = token.value;
          break;
        case 'spacing':
          (result.spacing as Record<string, unknown>)[token.name] = token.value;
          break;
        case 'shadow':
          (result.shadow as Record<string, unknown>)[token.name] = token.value;
          break;
        case 'border':
          (result.border as Record<string, unknown>)[token.name] = token.value;
          break;
      }
    }
    
    return result;
  }
  
  /**
   * Generate CSS Variables format
   */
  generateCSSVariables(tokens: DesignToken[]): string {
    const lines: string[] = [':root {'];
    
    for (const token of tokens) {
      const varName = `--${token.name}`;
      
      switch (token.type) {
        case 'color':
          lines.push(`  ${varName}: ${token.value};`);
          break;
        case 'typography': {
          const typo = token.value;
          lines.push(`  ${varName}-font-family: ${typo.fontFamily};`);
          lines.push(`  ${varName}-font-size: ${typo.fontSize}px;`);
          lines.push(`  ${varName}-font-weight: ${typo.fontWeight};`);
          lines.push(`  ${varName}-line-height: ${typo.lineHeight};`);
          break;
        }
        case 'spacing':
          lines.push(`  ${varName}: ${token.value}px;`);
          break;
        case 'shadow':
          lines.push(`  ${varName}: ${token.value};`);
          break;
        case 'border':
          lines.push(`  ${varName}: ${token.value};`);
          break;
      }
    }
    
    lines.push('}');
    return lines.join('\n');
  }
}

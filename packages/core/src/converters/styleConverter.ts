/**
 * Style Converter - Converts Figma styles to CSS/Tailwind
 */

import type {
  DesignNode,
  StyleDefinition,
  DesignTokens,
} from '../types/index.js';
import {
  extractStyle,
  rgbaToCSS,
  rgbaToHex,
  gradientToCSS,
  shadowsToCSS,
} from '../extractors/styleExtractor.js';

export interface StyleConverterOptions {
  format: 'css' | 'tailwind';
  classPrefix?: string;
  extractTokens: boolean;
}

/**
 * Convert a design node's styles to CSS/Tailwind
 */
export function convertStyles(
  node: DesignNode,
  options: Partial<StyleConverterOptions> = {}
): StyleDefinition {
  const opts: StyleConverterOptions = {
    format: options.format || 'css',
    classPrefix: options.classPrefix || '',
    extractTokens: options.extractTokens ?? true,
  };

  const extractedStyle = extractStyle(node);
  const className = generateClassName(node.name, opts.classPrefix);

  const css: Record<string, string> = {};
  const tailwind: Record<string, string> = {};

  // Position and size
  if (node.absoluteBoundingBox) {
    css.width = `${node.absoluteBoundingBox.width}px`;
    css.height = `${node.absoluteBoundingBox.height}px`;
  }

  // Background
  if (extractedStyle.fill) {
    if (extractedStyle.fill.type === 'solid' && extractedStyle.fill.color) {
      css.backgroundColor = rgbaToCSS(extractedStyle.fill.color);
    } else if (extractedStyle.fill.type === 'gradient' && extractedStyle.fill.gradient) {
      css.background = gradientToCSS(extractedStyle.fill.gradient);
    }
  }

  // Border radius
  if (extractedStyle.cornerRadius && extractedStyle.cornerRadius > 0) {
    css.borderRadius = `${extractedStyle.cornerRadius}px`;
  }

  // Border
  if (extractedStyle.stroke) {
    css.border = `${extractedStyle.stroke.width}px solid ${extractedStyle.stroke.color ? rgbaToCSS(extractedStyle.stroke.color) : 'transparent'}`;
  }

  // Box shadow
  const shadows = extractedStyle.effects
    .filter((e) => e.type === 'dropShadow' || e.type === 'innerShadow')
    .map((e) => ({
      color: e.color ?? { r: 0, g: 0, b: 0, a: 0.15 },
      offset: e.offset ?? { x: 0, y: 4 },
      blur: e.blur ?? 8,
      spread: e.spread ?? 0,
      inset: e.type === 'innerShadow',
    }));
  
  if (shadows.length > 0) {
    css.boxShadow = shadowsToCSS(shadows);
  }

  // Opacity
  if (extractedStyle.opacity !== undefined) {
    css.opacity = String(extractedStyle.opacity);
  }

  // Tailwind equivalents (simplified)
  if (css.borderRadius && parseFloat(css.borderRadius) >= 8) {
    tailwind.borderRadius = 'rounded-lg';
  } else if (css.borderRadius && parseFloat(css.borderRadius) >= 4) {
    tailwind.borderRadius = 'rounded-md';
  } else if (css.borderRadius && parseFloat(css.borderRadius) > 0) {
    tailwind.borderRadius = 'rounded-sm';
  }

  return {
    className,
    css,
    tailwind,
  };
}

/**
 * Generate CSS class name from Figma node name
 */
function generateClassName(name: string, prefix?: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return prefix ? `${prefix}-${cleaned}` : cleaned;
}

/**
 * Extract design tokens from a set of nodes
 */
export function extractDesignTokens(nodes: DesignNode[]): DesignTokens {
  const tokens: DesignTokens = {
    colors: [],
    typography: [],
    spacing: [],
    borderRadius: [],
    shadows: [],
  };

  // Extract colors
  for (const node of nodes) {
    const style = extractStyle(node);
    if (style.fill?.type === 'solid' && style.fill.color) {
      const hex = rgbaToHex(style.fill.color);
      tokens.colors.push({
        name: `color-${tokens.colors.length + 1}`,
        value: hex,
        description: `Extracted from ${node.name}`,
      });
    }

    // Extract from text nodes
    if (node.type === 'TEXT') {
      const textStyle = node.style;
      tokens.typography.push({
        name: `font-${textStyle.fontFamily.toLowerCase().replace(/\s+/g, '-')}-${textStyle.fontSize}`,
        fontFamily: textStyle.fontFamily,
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
        lineHeight: textStyle.lineHeightPx ?? textStyle.fontSize * 1.5,
        letterSpacing: textStyle.letterSpacing,
        description: `Typography from ${node.name}`,
      });
    }
  }

  // Extract spacing from padding
  const spacingSet = new Set<number>();
  for (const node of nodes) {
    if ('paddingLeft' in node && node.paddingLeft !== undefined) {
      spacingSet.add(node.paddingLeft);
    }
    if ('paddingRight' in node && node.paddingRight !== undefined) {
      spacingSet.add(node.paddingRight);
    }
  }
  for (const spacing of spacingSet) {
    tokens.spacing.push({
      name: `spacing-${spacing}`,
      value: spacing,
      description: `Extracted spacing value`,
    });
  }

  return tokens;
}

/**
 * Convert design tokens to CSS variables
 */
export function tokensToCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [':root {'];

  // Colors
  for (const token of tokens.colors) {
    lines.push(`  --${token.name}: ${token.value};`);
  }

  // Typography
  for (const token of tokens.typography) {
    lines.push(`  --font-${token.name}: ${token.fontFamily};`);
    lines.push(`  --font-size-${token.name}: ${token.fontSize}px;`);
  }

  // Spacing
  for (const token of tokens.spacing) {
    lines.push(`  --${token.name}: ${token.value}px;`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Convert design tokens to Tailwind config
 */
export function tokensToTailwindConfig(tokens: DesignTokens): Record<string, unknown> {
  const colors: Record<string, string> = {};
  for (const token of tokens.colors) {
    colors[token.name] = token.value;
  }

  return {
    theme: {
      extend: {
        colors,
      },
    },
  };
}

/**
 * Generate CSS string from style definition
 */
export function stylesToCSS(
  style: StyleDefinition,
  selector?: string
): string {
  const lines: string[] = [];

  if (selector) {
    lines.push(`${selector} {`);
  }

  for (const [property, value] of Object.entries(style.css)) {
    lines.push(`  ${property}: ${value};`);
  }

  if (selector) {
    lines.push('}');
  }

  return lines.join('\n');
}

/**
 * API Layer
 * 
 * High-level API for common use cases
 */

import type {
  DesignNode,
  PropDefinition,
  VariantDefinition,
  DesignToken
} from '../types';

import {
  inferProps,
  extractDesignTokens
} from '../index';

import { MDXGenerator } from '../generators/mdxGenerator';
import { DesignConverter } from '../converter';

/**
 * High-level convert function
 */
export function convertDesign(design: unknown, options?: {
  framework?: 'react' | 'vue' | 'angular';
  typescript?: boolean;
  styleFormat?: 'css' | 'scss' | 'tailwind';
  componentName?: string;
}): {
  component: string;
  story: string;
  styles: string;
  types: string;
  documentation?: string;
} {
  const converter = new DesignConverter(options);
  return converter.convert(design);
}

/**
 * Generate documentation for a component
 */
export function generateDocumentation(
  componentName: string,
  description: string,
  props: PropDefinition[],
  options?: {
    variants?: VariantDefinition[];
    tokens?: DesignToken[];
    framework?: 'react' | 'vue' | 'angular';
  }
): string {
  const mdx = new MDXGenerator();
  return mdx.generate({
    componentName,
    description,
    props,
    variants: options?.variants,
    tokens: options?.tokens,
    framework: options?.framework || 'react'
  });
}

/**
 * Extract all information from a design
 */
export function extractDesignInfo(design: unknown): {
  props: PropDefinition[];
  tokens: ReturnType<typeof extractDesignTokens>;
} {
  const designNode = design as DesignNode;
  
  return {
    props: inferProps(designNode),
    tokens: extractDesignTokens([designNode])
  };
}

/**
 * Batch convert multiple designs
 */
export function batchConvert(
  designs: Array<{ design: unknown; name: string; options?: Parameters<typeof convertDesign>[1] }>
): Map<string, {
  component: string;
  story: string;
  styles: string;
  types: string;
}> {
  const results = new Map();
  
  for (const { design, name, options } of designs) {
    const converter = new DesignConverter({
      ...options,
      componentName: name
    });
    results.set(name, converter.convert(design));
  }
  
  return results;
}

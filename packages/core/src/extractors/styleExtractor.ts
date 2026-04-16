/**
 * Style Extractor - Extracts style information from Figma nodes
 */

import type {
  Paint,
  RGBA,
  ExtractedFill,
  ExtractedStroke,
  ExtractedEffect,
  DesignNode,
  FrameNode,
  Gradient,
  GradientStop,
} from '../types/index.js';

/**
 * Extract fill information from Figma fills
 */
export function extractFills(paints: readonly Paint[] | undefined): ExtractedFill | undefined {
  if (!paints || paints.length === 0) {
    return undefined;
  }

  const solidPaint = paints.find((p) => p.type === 'SOLID');
  if (solidPaint && solidPaint.type === 'SOLID') {
    return {
      type: 'solid',
      color: solidPaint.color,
      opacity: solidPaint.opacity,
    };
  }

  const gradientPaint = paints.find(
    (p) => p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL'
  );
  if (gradientPaint) {
    return {
      type: 'gradient',
      gradient: gradientPaint as unknown as Gradient,
      opacity: 'opacity' in gradientPaint ? (gradientPaint.opacity as number | undefined) : undefined,
    };
  }

  return undefined;
}

/**
 * Normalize Figma color to RGBA (0-255 scale)
 */
export function normalizeColor(color: { r: number; g: number; b: number; a?: number }): RGBA {
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
    a: color.a ?? 1,
  };
}

/**
 * Extract stroke information from Figma strokes
 */
export function extractStrokes(paints: readonly unknown[] | undefined): ExtractedStroke | undefined {
  if (!paints || paints.length === 0) {
    return undefined;
  }

  const solidStroke = paints.find((p) => (p as { type: string }).type === 'SOLID');
  if (solidStroke && (solidStroke as { type: string }).type === 'SOLID') {
    return {
      type: 'solid',
      color: (solidStroke as { color: RGBA }).color,
      width: 1,
    };
  }

  return undefined;
}

/**
 * Extract effects (shadows, blurs) from Figma effects
 */
export function extractEffects(effects: readonly unknown[] | undefined): ExtractedEffect[] {
  if (!effects || effects.length === 0) {
    return [];
  }

  const extractedEffects: ExtractedEffect[] = [];

  for (const effect of effects) {
    const e = effect as { type: string; visible?: boolean; [key: string]: unknown };
    if (e.visible === false) continue;

    if (e.type === 'DROP_SHADOW') {
      const shadow = e as { type: 'DROP_SHADOW'; color: RGBA; offset: { x: number; y: number }; radius: number; spread?: number; visible?: boolean };
      extractedEffects.push({
        type: 'dropShadow',
        color: shadow.color,
        offset: shadow.offset,
        blur: shadow.radius,
        spread: shadow.spread ?? 0,
      });
    } else if (e.type === 'INNER_SHADOW') {
      const shadow = e as { type: 'INNER_SHADOW'; color: RGBA; offset: { x: number; y: number }; radius: number; spread?: number; visible?: boolean };
      extractedEffects.push({
        type: 'innerShadow',
        color: shadow.color,
        offset: shadow.offset,
        blur: shadow.radius,
        spread: shadow.spread ?? 0,
      });
    } else if (e.type === 'BLUR') {
      const blur = e as { type: 'BLUR'; radius: number; visible?: boolean };
      extractedEffects.push({
        type: 'blur',
        blur: blur.radius,
      });
    }
  }

  return extractedEffects;
}

/**
 * RGBA to CSS string
 */
export function rgbaToCSS(color: RGBA): string {
  if (color.a === 1 || color.a === undefined) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

/**
 * RGBA to Hex string
 */
export function rgbaToHex(color: RGBA): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  if (color.a === 1 || color.a === undefined) {
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}${toHex(Math.round(color.a * 255))}`;
}

/**
 * Convert gradient to CSS
 */
export function gradientToCSS(gradient: Gradient): string {
  if (gradient.type === 'GRADIENT_LINEAR') {
    const stops = gradient.stops
      .map((stop: GradientStop) => `${rgbaToCSS(stop.color)} ${stop.position * 100}%`)
      .join(', ');
    const angle = gradient.angle ?? 0;
    return `linear-gradient(${angle}deg, ${stops})`;
  }

  if (gradient.type === 'GRADIENT_RADIAL') {
    const stops = gradient.stops
      .map((stop: GradientStop) => `${rgbaToCSS(stop.color)} ${stop.position * 100}%`)
      .join(', ');
    return `radial-gradient(${stops})`;
  }

  return '';
}

/**
 * Convert shadows to CSS
 */
export function shadowsToCSS(shadows: { color: RGBA; offset?: { x: number; y: number }; blur?: number; spread?: number; inset?: boolean }[]): string {
  return shadows
    .map((shadow) => {
      const color = rgbaToCSS(shadow.color);
      const offsetX = shadow.offset?.x ?? 0;
      const offsetY = shadow.offset?.y ?? 0;
      const blur = shadow.blur ?? 0;
      const spread = shadow.spread ?? 0;
      if (shadow.inset) {
        return `inset ${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
      }
      return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
    })
    .join(', ');
}

/**
 * Extract complete style from a Figma node
 */
export function extractStyle(node: DesignNode): { fill?: ExtractedFill; stroke?: ExtractedStroke; effects: ExtractedEffect[]; opacity?: number; cornerRadius?: number } {
  const frameNode = node as FrameNode;
  
  const result: { fill?: ExtractedFill; stroke?: ExtractedStroke; effects: ExtractedEffect[]; opacity?: number; cornerRadius?: number } = {
    effects: [],
  };

  // Extract fills
  if (frameNode.fills) {
    const fill = extractFills(frameNode.fills);
    if (fill) {
      result.fill = fill;
    }
  }

  // Extract corner radius
  if ('cornerRadius' in frameNode && frameNode.cornerRadius) {
    result.cornerRadius = frameNode.cornerRadius;
  }

  // Extract strokes
  if (frameNode.strokes && frameNode.strokes.length > 0) {
    const stroke = extractStrokes(frameNode.strokes as unknown as readonly unknown[]);
    if (stroke) {
      stroke.width = frameNode.strokeWeight ?? 1;
      result.stroke = stroke;
    }
  }

  // Extract effects (shadows)
  if (frameNode.effects) {
    result.effects = extractEffects(frameNode.effects as unknown as readonly unknown[]);
  }

  // Extract opacity
  if ('opacity' in frameNode && frameNode.opacity !== undefined) {
    result.opacity = frameNode.opacity;
  }

  return result;
}

/**
 * Convert extracted styles to CSS string
 */
export function stylesToCSS(styles: { fill?: ExtractedFill; stroke?: ExtractedStroke; effects: ExtractedEffect[]; opacity?: number; cornerRadius?: number }, width?: number, height?: number): string {
  const css: string[] = [];

  if (styles.fill) {
    if (styles.fill.type === 'solid' && styles.fill.color) {
      css.push(`background-color: ${rgbaToCSS(styles.fill.color)};`);
    } else if (styles.fill.type === 'gradient' && styles.fill.gradient) {
      css.push(`background: ${gradientToCSS(styles.fill.gradient)};`);
    }
  }

  if (styles.cornerRadius && styles.cornerRadius > 0) {
    css.push(`border-radius: ${styles.cornerRadius}px;`);
  }

  if (styles.stroke) {
    css.push(`border: ${styles.stroke.width}px solid ${styles.stroke.color ? rgbaToCSS(styles.stroke.color) : 'transparent'};`);
  }

  const shadows = styles.effects
    .filter((e) => e.type === 'dropShadow' || e.type === 'innerShadow')
    .map((e) => ({
      color: e.color!,
      offset: e.offset,
      blur: e.blur,
      spread: e.spread,
      inset: e.type === 'innerShadow',
    }));
  
  if (shadows.length > 0) {
    css.push(`box-shadow: ${shadowsToCSS(shadows)};`);
  }

  if (width !== undefined) {
    css.push(`width: ${width}px;`);
  }

  if (height !== undefined) {
    css.push(`height: ${height}px;`);
  }

  if (styles.opacity !== undefined) {
    css.push(`opacity: ${styles.opacity};`);
  }

  return css.join('\n  ');
}

/**
 * Generate CSS class from Figma node
 */
export function generateClassName(nodeName: string): string {
  return nodeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Infer HTML tag from Figma node type and name
 */
export function inferHTMLTag(node: { type: string; name: string }): string {
  const type = node.type.toUpperCase();
  const name = node.name.toLowerCase();

  // Text should be rendered as span or p
  if (type === 'TEXT') {
    return 'span';
  }

  // Button detection
  if (name.includes('button') || name.includes('btn')) {
    return 'button';
  }

  // Input detection
  if (name.includes('input') || name.includes('textfield') || name.includes('text-field')) {
    return 'input';
  }

  // Link detection
  if (name.includes('link') || name.includes('anchor')) {
    return 'a';
  }

  // Image detection
  if (name.includes('image') || name.includes('photo') || name.includes('picture') || name.includes('img')) {
    return 'img';
  }

  // List detection
  if (name.includes('list') || name.includes('ul') || name.includes('ol')) {
    return 'ul';
  }

  // List item detection
  if (name.includes('item') || name.includes('li')) {
    return 'li';
  }

  // Default to div for frames and other containers
  return 'div';
}

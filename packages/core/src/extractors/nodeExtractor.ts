/**
 * Node Extractor - Extracts design nodes from Figma selection
 * 
 * This module provides utilities for extracting and transforming
 * design nodes from Figma API responses.
 */

import type {
  DesignNode,
  FrameNode,
  TextNode,
  Rectangle,
  RGBA,
} from '../types/index.js';

/**
 * Create a basic FrameNode from raw Figma data
 */
export function createFrameNode(
  id: string,
  name: string,
  width: number,
  height: number
): FrameNode {
  return {
    id,
    name,
    type: 'FRAME',
    visible: true,
    locked: false,
    absoluteBoundingBox: { x: 0, y: 0, width, height },
    clipsContent: false,
    isMask: false,
    fills: [],
    strokes: [],
    effects: [],
  };
}

/**
 * Create a basic TextNode from raw Figma data
 */
export function createTextNode(
  id: string,
  name: string,
  characters: string
): TextNode {
  return {
    id,
    name,
    type: 'TEXT',
    visible: true,
    locked: false,
    absoluteBoundingBox: null,
    clipsContent: false,
    isMask: false,
    fills: [],
    strokes: [],
    effects: [],
    characters,
    style: {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: 16,
      letterSpacing: 0,
      textCase: 'ORIGINAL',
      textDecoration: 'NONE',
    },
  };
}

/**
 * Validate if an object is a valid DesignNode
 */
export function isDesignNode(obj: unknown): obj is DesignNode {
  if (!obj || typeof obj !== 'object') return false;
  const node = obj as Record<string, unknown>;
  return (
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    typeof node.type === 'string'
  );
}

/**
 * Get node bounds
 */
export function getNodeBounds(node: DesignNode): Rectangle | null {
  return node.absoluteBoundingBox ?? null;
}

/**
 * Get primary fill color
 */
export function getPrimaryFill(node: DesignNode): RGBA | null {
  if ('fills' in node && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      return fill.color;
    }
  }
  return null;
}

/**
 * Get node opacity
 */
export function getNodeOpacity(node: DesignNode): number {
  if ('opacity' in node && typeof node.opacity === 'number') {
    return node.opacity;
  }
  return 1;
}

/**
 * Count descendants of a node
 */
export function countDescendants(node: DesignNode): number {
  let count = 0;
  if ('children' in node && node.children) {
    for (const child of node.children) {
      count += 1 + countDescendants(child);
    }
  }
  return count;
}

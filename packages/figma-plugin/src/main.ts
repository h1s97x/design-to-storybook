/**
 * Design-to-Storybook Figma Plugin
 * 
 * Main entry point for the Figma plugin
 */

// Show the plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: 'Design-to-Storybook',
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'export':
      await handleExport();
      break;
    case 'select':
      handleSelection();
      break;
    case 'copy-json':
      await handleCopyJSON();
      break;
  }
};

/**
 * Handle export request from UI
 */
async function handleExport() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No components selected. Please select at least one component.',
    });
    return;
  }

  try {
    const exportData = await extractExportData(selection);
    
    figma.ui.postMessage({
      type: 'export-complete',
      data: exportData,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Export failed',
    });
  }
}

/**
 * Handle selection update request
 */
function handleSelection() {
  const selection = figma.currentPage.selection;
  
  const selectionInfo = {
    count: selection.length,
    names: selection.map((node) => node.name),
    types: selection.map((node) => node.type),
  };

  figma.ui.postMessage({
    type: 'selection-update',
    data: selectionInfo,
  });
}

/**
 * Handle copy JSON to clipboard
 */
async function handleCopyJSON() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No components selected',
    });
    return;
  }

  try {
    const exportData = await extractExportData(selection);
    const json = JSON.stringify(exportData, null, 2);
    
    await figma.clipboard.copy(json);
    
    figma.ui.postMessage({
      type: 'copy-complete',
      message: 'JSON copied to clipboard!',
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Copy failed',
    });
  }
}

/**
 * Extract export data from selection
 */
async function extractExportData(selection: readonly SceneNode[]) {
  const nodes: any[] = [];

  for (const node of selection) {
    const extractedNode = await extractNode(node);
    nodes.push(extractedNode);
  }

  // Get file info
  const fileName = figma.root.name;
  const fileKey = figma.fileKey || 'unknown';

  // Extract design tokens
  const tokens = await extractDesignTokens(selection);

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    source: {
      fileKey,
      fileName,
    },
    nodes,
    styles: tokens,
    assets: {
      images: [],
      icons: [],
    },
  };
}

/**
 * Extract a single node's data
 */
async function extractNode(node: SceneNode): Promise<any> {
  const base: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
  };

  // Bounding box
  if (node.absoluteBoundingBox) {
    base.absoluteBoundingBox = {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }

  // Fills
  if ('fills' in node && node.fills !== figma.mixed) {
    base.fills = extractFills(node.fills);
  }

  // Strokes
  if ('strokes' in node && node.strokes !== figma.mixed) {
    base.strokes = extractStrokes(node.strokes);
    if ('strokeWeight' in node) {
      base.strokeWeight = node.strokeWeight;
    }
  }

  // Effects
  if ('effects' in node) {
    base.effects = extractEffects(node.effects);
  }

  // Corner radius
  if ('cornerRadius' in node && node.cornerRadius !== undefined) {
    base.cornerRadius = node.cornerRadius;
  }

  // Opacity
  if ('opacity' in node && node.opacity !== undefined) {
    base.opacity = node.opacity;
  }

  // Layout properties
  if ('layoutMode' in node) {
    base.layoutMode = node.layoutMode;
    base.layoutAlign = node.layoutAlign;
    base.layoutGrow = node.layoutGrow;
  }

  if ('paddingLeft' in node) {
    base.paddingLeft = node.paddingLeft;
    base.paddingRight = node.paddingRight;
    base.paddingTop = node.paddingTop;
    base.paddingBottom = node.paddingBottom;
    base.itemSpacing = node.itemSpacing;
  }

  // Text properties
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    base.characters = textNode.characters;
    base.style = {
      fontFamily: textNode.style.fontFamily,
      fontWeight: textNode.style.fontWeight,
      fontSize: textNode.style.fontSize,
      letterSpacing: textNode.style.letterSpacing,
      lineHeightPx: textNode.style.lineHeightPx,
      textCase: textNode.style.textCase,
      textDecoration: textNode.style.textDecoration,
    };
    base.textAlignHorizontal = textNode.textAlignHorizontal;
    base.textAlignVertical = textNode.textAlignVertical;
  }

  // Component properties
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE') {
    if ('componentProperties' in node) {
      base.componentProperties = node.componentProperties;
    }
    if (node.type === 'COMPONENT_SET' && 'componentPropertyDefinitions' in node) {
      base.componentPropertyDefinitions = (node as any).componentPropertyDefinitions;
    }
    if (node.type === 'INSTANCE' && 'componentId' in node) {
      base.componentId = (node as any).componentId;
    }
  }

  // Children
  if ('children' in node) {
    base.children = [];
    for (const child of node.children) {
      const extractedChild = await extractNode(child);
      base.children.push(extractedChild);
    }
  }

  return base;
}

/**
 * Extract fills from node
 */
function extractFills(fills: readonly Paint[]): any[] {
  return fills.map((fill) => {
    if (fill.type === 'SOLID') {
      return {
        type: 'SOLID',
        color: {
          r: fill.color.r,
          g: fill.color.g,
          b: fill.color.b,
          a: fill.opacity ?? 1,
        },
        opacity: fill.opacity,
      };
    }
    return { type: fill.type };
  });
}

/**
 * Extract strokes from node
 */
function extractStrokes(strokes: readonly Paint[]): any[] {
  return strokes.map((stroke) => {
    if (stroke.type === 'SOLID') {
      return {
        type: 'SOLID',
        color: {
          r: stroke.color.r,
          g: stroke.color.g,
          b: stroke.color.b,
          a: stroke.opacity ?? 1,
        },
        opacity: stroke.opacity,
      };
    }
    return { type: stroke.type };
  });
}

/**
 * Extract effects from node
 */
function extractEffects(effects: readonly Effect[]): any[] {
  return effects.map((effect) => {
    switch (effect.type) {
      case 'DROP_SHADOW':
        return {
          type: 'DROP_SHADOW',
          color: {
            r: effect.color.r,
            g: effect.color.g,
            b: effect.color.b,
            a: effect.color.a,
          },
          offset: effect.offset,
          radius: effect.radius,
          spread: effect.spread,
          visible: effect.visible,
        };
      case 'INNER_SHADOW':
        return {
          type: 'INNER_SHADOW',
          color: {
            r: effect.color.r,
            g: effect.color.g,
            b: effect.color.b,
            a: effect.color.a,
          },
          offset: effect.offset,
          radius: effect.radius,
          visible: effect.visible,
        };
      case 'BLUR':
        return {
          type: 'BLUR',
          radius: effect.radius,
          visible: effect.visible,
        };
      default:
        return { type: 'UNKNOWN' };
    }
  });
}

/**
 * Extract design tokens from selection
 */
async function extractDesignTokens(selection: readonly SceneNode[]) {
  const colors: any[] = [];
  const typography: any[] = [];
  const spacing: any[] = [];

  const seenColors = new Set<string>();

  for (const node of selection) {
    // Extract colors
    if ('fills' in node && node.fills !== figma.mixed) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID') {
          const key = `${fill.color.r}-${fill.color.g}-${fill.color.b}`;
          if (!seenColors.has(key)) {
            seenColors.add(key);
            colors.push({
              name: generateColorName(fill.color),
              value: rgbToHex(fill.color),
            });
          }
        }
      }
    }

    // Extract typography
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      typography.push({
        name: `text-${textNode.style.fontSize}`,
        fontFamily: textNode.style.fontFamily,
        fontSize: textNode.style.fontSize,
        fontWeight: textNode.style.fontWeight,
        lineHeight: textNode.style.lineHeightPx || textNode.style.fontSize * 1.5,
      });
    }

    // Extract spacing
    if (node.absoluteBoundingBox) {
      spacing.push({
        name: `space-${Math.round(node.absoluteBoundingBox.width)}`,
        value: node.absoluteBoundingBox.width,
      });
      spacing.push({
        name: `space-${Math.round(node.absoluteBoundingBox.height)}`,
        value: node.absoluteBoundingBox.height,
      });
    }
  }

  return { colors, typography, spacing };
}

/**
 * Generate a color name from RGB values
 */
function generateColorName(color: { r: number; g: number; b: number }): string {
  const { r, g, b } = color;
  
  // Check if grayscale
  if (Math.abs(r - g) < 0.1 && Math.abs(g - b) < 0.1) {
    const value = Math.round((r + g + b) / 3 * 255);
    if (value < 64) return 'gray-900';
    if (value < 128) return 'gray-700';
    if (value < 192) return 'gray-400';
    return 'gray-100';
  }

  // Determine hue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max !== min) {
    const d = max - min;
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }

  const lightness = (r + g + b) / 3;
  let baseName: string;
  
  if (h < 15 || h >= 345) baseName = 'red';
  else if (h < 45) baseName = 'orange';
  else if (h < 75) baseName = 'yellow';
  else if (h < 150) baseName = 'green';
  else if (h < 210) baseName = 'cyan';
  else if (h < 270) baseName = 'blue';
  else if (h < 315) baseName = 'purple';
  else baseName = 'pink';

  const level = lightness < 0.3 ? '-900' : lightness < 0.5 ? '-700' : lightness < 0.7 ? '-500' : '-300';
  return `${baseName}${level}`;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(color: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

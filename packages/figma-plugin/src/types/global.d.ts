// Global declarations for Figma Plugin
declare const figma: {
  showUI: (html: string, options?: { visible?: boolean; width?: number; height?: number }) => void;
  ui: {
    onmessage: (callback: (msg: unknown) => void) => void;
    postMessage: (msg: unknown) => void;
  };
  currentPage: {
    selection: FigmaSceneNode[];
  };
  createFrame: () => FigmaFrameNode;
  createText: () => FigmaTextNode;
  createRectangle: () => FigmaRectangleNode;
  createEllipse: () => FigmaEllipseNode;
  createVector: () => FigmaVectorNode;
  createComponent: () => FigmaComponentNode;
  group: (nodes: FigmaSceneNode[], parent: FigmaPageNode | FigmaFrameNode) => FigmaGroupNode;
};

declare const __html__: string;

interface FigmaSceneNode {
  id: string;
  name: string;
  type: string;
  parent?: FigmaSceneNode;
  children?: FigmaSceneNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  effects?: FigmaEffect[];
}

interface FigmaFrameNode extends FigmaSceneNode {
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
}

interface FigmaTextNode extends FigmaSceneNode {
  characters: string;
  fontSize: number;
  fontName: { family: string; style: string };
  letterSpacing: number;
  lineHeightPx: number;
  lineHeightPercent: number;
}

type FigmaRectangleNode = FigmaSceneNode;
type FigmaEllipseNode = FigmaSceneNode;
type FigmaVectorNode = FigmaSceneNode;
type FigmaComponentNode = FigmaSceneNode;
type FigmaGroupNode = FigmaSceneNode;
type FigmaPageNode = FigmaSceneNode;

interface FigmaPaint {
  type: string;
  color?: { r: number; g: number; b: number };
  opacity?: number;
}

interface FigmaEffect {
  type: string;
  color?: { r: number; g: number; b: number };
  offset?: { x: number; y: number };
  spread?: number;
  radius?: number;
}

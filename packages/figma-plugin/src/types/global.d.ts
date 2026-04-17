// Global declarations for Figma Plugin
declare const figma: FigmaAPI;
declare const __html__: string;

interface FigmaAPI {
  showUI: (html: string, options?: FigmaUIOptions) => void;
  ui: FigmaUI;
  currentPage: FigmaPage;
  clipboard: string;
  root: FigmaDocument;
  fileKey: string;
  createFrame: () => FigmaFrameNode;
  createText: () => FigmaTextNode;
  createRectangle: () => FigmaRectangleNode;
  createEllipse: () => FigmaEllipseNode;
  createVector: () => FigmaVectorNode;
  createComponent: () => FigmaComponentNode;
  group: (nodes: FigmaSceneNode[], parent: FigmaPageNode | FigmaFrameNode) => FigmaGroupNode;
}

interface FigmaUIOptions {
  visible?: boolean;
  width?: number;
  height?: number;
  title?: string;
}

interface FigmaUI {
  onmessage: (callback: FigmaMessageHandler) => void;
  postMessage: (msg: unknown) => void;
}

type FigmaMessageHandler = (msg: FigmaMessage) => void;

interface FigmaMessage {
  type: string;
  data?: unknown;
}

interface FigmaDocument {
  children: FigmaPageNode[];
}

interface FigmaPage {
  selection: FigmaSceneNode[];
  name: string;
  children: FigmaSceneNode[];
}

type FigmaSceneNode = FigmaFrameNode | FigmaTextNode | FigmaRectangleNode | FigmaEllipseNode | FigmaVectorNode | FigmaComponentNode | FigmaGroupNode;

interface FigmaBaseNode {
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
  blendedUnder?: boolean;
}

interface FigmaFrameNode extends FigmaBaseNode {
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

interface FigmaTextNode extends FigmaBaseNode {
  characters: string;
  fontSize: number;
  fontName: FigmaFontName;
  letterSpacing: number;
  lineHeightPx: number;
  lineHeightPercent: number;
  textStyleId?: string;
}

type FigmaRectangleNode = FigmaBaseNode;
type FigmaEllipseNode = FigmaBaseNode;
type FigmaVectorNode = FigmaBaseNode;
type FigmaComponentNode = FigmaBaseNode;
type FigmaGroupNode = FigmaBaseNode;
type FigmaPageNode = FigmaBaseNode;

interface FigmaPaint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaRGB;
}

interface FigmaRGB {
  r: number;
  g: number;
  b: number;
}

interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaRGB;
  offset?: FigmaVector;
  spread?: number;
  radius?: number;
}

interface FigmaVector {
  x: number;
  y: number;
}

interface FigmaFontName {
  family: string;
  style: string;
}

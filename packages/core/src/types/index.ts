/**
 * Core type definitions for Design-to-Storybook
 */

// ============================================
// Figma Node Types
// ============================================

export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'BOOLEAN_OPERATION'
  | 'VECTOR'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'RECTANGLE'
  | 'TEXT'
  | 'STICKY'
  | 'WIDGET'
  | 'SECTION'
  | 'FRAME_RETAINER'
  | 'EMBED'
  | 'LINK_UNFURL'
  | 'FORM'
  | 'INLINE_COMPONENT'
  | 'METADATA'
  | 'MEDIA';

export type BlendMode =
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

// ============================================
// Geometry Types
// ============================================

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// Color Types
// ============================================

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GradientStop {
  position: number;
  color: RGBA;
}

export interface Gradient {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  stops: GradientStop[];
  angle?: number;
}

// ============================================
// Paint & Effect Types
// ============================================

export interface SolidPaint {
  type: 'SOLID';
  color: RGBA;
  opacity?: number;
}

export interface ImagePaint {
  type: 'IMAGE';
  imageHash: string;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  filters?: {
    exposure?: number;
    contrast?: number;
  };
}

export interface LinearGradientPaint {
  type: 'GRADIENT_LINEAR';
  gradientStops: GradientStop[];
  gradientTransform?: [[number, number, number], [number, number, number]];
}

export interface RadialGradientPaint {
  type: 'GRADIENT_RADIAL';
  gradientStops: GradientStop[];
  gradientTransform?: [[number, number, number], [number, number, number]];
}

export type Paint = SolidPaint | ImagePaint | LinearGradientPaint | RadialGradientPaint;

export interface StrokePaint {
  type: 'SOLID' | 'IMAGE' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  color?: RGBA;
  opacity?: number;
}

export interface DropShadowEffect {
  type: 'DROP_SHADOW';
  color: RGBA;
  offset: Vector2;
  radius: number;
  spread?: number;
  visible: boolean;
}

export interface InnerShadowEffect {
  type: 'INNER_SHADOW';
  color: RGBA;
  offset: Vector2;
  radius: number;
  visible: boolean;
}

export interface BlurEffect {
  type: 'BLUR';
  radius: number;
  visible: boolean;
}

export type Effect = DropShadowEffect | InnerShadowEffect | BlurEffect;

// ============================================
// Layout Types
// ============================================

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';
export type LayoutAlign = 'MIN' | 'MAX' | 'CENTER' | 'STRETCH' | 'BASELINE';
export type LayoutJustify = 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';

export type CounterAxisSizingMode = 'FIXED' | 'AUTO';
export type PrimaryAxisSizingMode = 'FIXED' | 'AUTO';

export interface LayoutGrid {
  pattern: 'COLUMNS' | 'ROWS' | 'GRID';
  sectionSize?: number;
  gutterSize?: number;
  alignment: 'MIN' | 'MAX' | 'CENTER' | 'STRETCH';
  count?: number;
}

// ============================================
// Typography Types
// ============================================

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';

export type TextDecoration = 'NONE' | 'STRIKETHROUGH' | 'UNDERLINE';

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: FontWeight;
  fontSize: number;
  letterSpacing: number;
  lineHeightPx?: number;
  lineHeightUnit?: 'PIXELS' | 'PERCENT' | 'AUTO';
  lineHeightPercent?: number;
  textCase: TextCase;
  textDecoration: TextDecoration;
}

// ============================================
// Component Types
// ============================================

export type ComponentPropertyType = 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT' | 'COMPONENT';

export interface ComponentPropertyDefinition {
  type: ComponentPropertyType;
  defaultValue?: unknown;
  variantOptions?: string[];
  preferredValues?: unknown[];
  preferredVariantId?: string;
}

export type ComponentPropertyValue =
  | { type: 'BOOLEAN'; value: boolean }
  | { type: 'TEXT'; value: string }
  | { type: 'INSTANCE_SWAP'; value: string }
  | { type: 'VARIANT'; value: string }
  | { type: 'COMPONENT'; value: string };

// ============================================
// Design Node
// ============================================

export interface BaseNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible: boolean;
  locked: boolean;
}

export interface SceneNode extends BaseNode {
  absoluteBoundingBox: Rectangle | null;
  absoluteRenderBounds?: Rectangle | null;
  clipsContent: boolean;
  fillGeometry?: string[];
  strokeGeometry?: string[];
  isMask: boolean;
  fills: Paint[];
  strokes: StrokePaint[];
  strokeWeight?: number;
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_TRIANGLES' | 'DIAMOND' | 'LINE_ARROW' | 'TRIANGLE_FILLED';
  strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
  strokeDashes?: number[];
  effects: Effect[];
  opacity?: number;
  background?: Paint[];
  backgroundColor?: RGBA;
}

export interface FrameNode extends SceneNode {
  type: 'FRAME';
  cornerRadius?: number;
  cornerSmoothing?: number;
  rectangleCornerRadii?: [number, number, number, number];
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutMode?: LayoutMode;
  layoutAlign?: LayoutAlign;
  layoutGrow?: number;
  primaryAxisSizingMode?: PrimaryAxisSizingMode;
  counterAxisSizingMode?: CounterAxisSizingMode;
  layoutGrids?: LayoutGrid[];
  gridStyleId?: string;
  children?: DesignNode[];
}

export interface TextNode extends SceneNode {
  type: 'TEXT';
  characters: string;
  style: TypeStyle;
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  paragraphIndent?: number;
  paragraphSpacing?: number;
  autoRename?: boolean;
}

export interface VectorNode extends SceneNode {
  type: 'VECTOR' | 'BOOLEAN_OPERATION' | 'STAR' | 'LINE' | 'ELLIPSE';
}

export interface RectangleNode extends SceneNode {
  type: 'RECTANGLE';
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
}

export interface ComponentNode extends SceneNode {
  type: 'COMPONENT';
  name: string;
  componentProperties: Record<string, ComponentPropertyValue>;
}

export interface ComponentSetNode extends SceneNode {
  type: 'COMPONENT_SET';
  name: string;
  componentPropertyDefinitions: Record<string, ComponentPropertyDefinition>;
  defaultProps: Record<string, unknown>;
  children?: ComponentNode[];
}

export interface InstanceNode extends SceneNode {
  type: 'INSTANCE';
  name: string;
  componentId: string;
  overrides?: Record<string, unknown>[];
}

export type DesignNode = FrameNode | TextNode | VectorNode | RectangleNode | ComponentNode | ComponentSetNode | InstanceNode;

// ============================================
// Extracted Data
// ============================================

export interface ExtractedFill {
  type: 'solid' | 'gradient' | 'image';
  color?: RGBA;
  gradient?: Gradient;
  opacity?: number;
}

export interface ExtractedStroke {
  type: 'solid';
  color?: RGBA;
  width: number;
  dashArray?: number[];
}

export interface ExtractedEffect {
  type: 'dropShadow' | 'innerShadow' | 'blur';
  color?: RGBA;
  offset?: Vector2;
  blur?: number;
  spread?: number;
}

export interface ExtractedStyle {
  fill?: ExtractedFill;
  stroke?: ExtractedStroke;
  effects: ExtractedEffect[];
  opacity?: number;
  cornerRadius?: number;
}

// ============================================
// Generated Code Types
// ============================================

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  control?: {
    type: 'text' | 'boolean' | 'number' | 'select' | 'radio' | 'check' | 'range';
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
  };
  controlType?: 'text' | 'boolean' | 'number' | 'select' | 'radio' | 'check' | 'range';
  options?: string[];
  enum?: string[];
}

// Variant mapping for Component Sets
export interface VariantMapping {
  [propertyName: string]: string;
}

// Component Property (alias for internal use)
export type ComponentProperty = ComponentPropertyValue;

// Extended StyleDefinition with all style properties
export interface StyleDefinition {
  className: string;
  css: Record<string, string>;
  tailwind?: Record<string, string>;
  // Extended properties
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  boxShadow?: string;
  opacity?: number;
  width?: number;
  height?: number;
  display?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export interface GeneratedComponent {
  name: string;
  code: string;
  language: 'tsx' | 'vue' | 'angular';
  props: PropDefinition[];
  styles: StyleDefinition[];
  children?: GeneratedComponent[];
}

export interface GeneratedStory {
  name: string;
  args: Record<string, unknown>;
  argTypes?: Record<string, PropDefinition>;
}

export interface StoryFile {
  title: string;
  component: string;
  imports: string[];
  defaultExport: {
    component: string;
    parameters?: Record<string, unknown>;
    decorators?: unknown[];
  };
  meta: {
    title: string;
    component: string;
    parameters?: Record<string, unknown>;
    argTypes?: Record<string, PropDefinition>;
  };
  stories: GeneratedStory[];
}

// ============================================
// Design Token Types
// ============================================

export interface ColorToken {
  name: string;
  value: string;
  description?: string;
}

export interface SpacingToken {
  name: string;
  value: number;
  description?: string;
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  description?: string;
}

export interface DesignTokens {
  colors: ColorToken[];
  spacing: SpacingToken[];
  typography: TypographyToken[];
  borderRadius: { name: string; value: number }[];
  shadows: { name: string; value: string }[];
}

// ============================================
// Conversion Options
// ============================================

export interface ConversionOptions {
  framework: 'react' | 'vue' | 'angular';
  styleFormat: 'css' | 'tailwind' | 'styled';
  includeStories: boolean;
  includeDocs: boolean;
  extractTokens: boolean;
  outputDir: string;
  componentPrefix?: string;
}

export interface ConversionResult {
  components: GeneratedComponent[];
  stories: StoryFile[];
  tokens: DesignTokens;
  errors: ConversionError[];
}

export interface ConversionError {
  nodeId: string;
  nodeName: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================
// Plugin Export Format
// ============================================

export interface PluginExport {
  version: '1.0';
  generatedAt: string;
  source: {
    fileKey: string;
    nodeId: string;
    fileName: string;
  };
  nodes: DesignNode[];
  styles: {
    colors: ColorToken[];
    typography: TypographyToken[];
    spacing: SpacingToken[];
  };
  assets: {
    images: { name: string; url: string }[];
    icons: { name: string; svg: string }[];
  };
}

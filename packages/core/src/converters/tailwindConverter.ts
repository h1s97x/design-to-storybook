/**
 * Tailwind CSS 转换器
 * 将 Figma 样式转换为 Tailwind CSS 类名
 */

import type { StyleDefinition, DesignTokens } from '../types';

/**
 * Tailwind 配置预设
 */
export interface TailwindPreset {
  /** 颜色映射 */
  colors?: Record<string, string>;
  /** 字体映射 */
  fonts?: Record<string, string>;
  /** 间距映射 */
  spacing?: Record<string, string>;
  /** 圆角映射 */
  borderRadius?: Record<string, string>;
  /** 阴影映射 */
  shadows?: Record<string, string>;
}

/**
 * 默认 Tailwind 预设
 */
export const DEFAULT_TAILWIND_PRESET: TailwindPreset = {
  borderRadius: {
    '0': 'rounded-none',
    '2': 'rounded-sm',
    '4': 'rounded',
    '8': 'rounded-md',
    '12': 'rounded-lg',
    '16': 'rounded-xl',
    '24': 'rounded-2xl',
    '9999': 'rounded-full',
  },
  shadows: {
    'none': 'shadow-none',
    'xs': 'shadow-xs',
    'sm': 'shadow-sm',
    'DEFAULT': 'shadow',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl',
    '2xl': 'shadow-2xl',
  },
};

/**
 * 将 Figma 颜色转换为 Tailwind 类名
 */
export function convertToTailwindColor(
  color: string,
  tokens?: DesignTokens
): string {
  // 检查是否是透明色
  if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return 'bg-transparent';
  }

  // 尝试匹配 design tokens - DesignTokens.colors 是 ColorToken[]
  if (tokens?.colors && Array.isArray(tokens.colors)) {
    for (const colorToken of tokens.colors) {
      if (colorToken.value === color || normalizeColor(colorToken.value) === normalizeColor(color)) {
        return `bg-${colorToken.name}`;
      }
    }
  }

  // 从颜色值推断
  const parsed = parseColor(color);
  if (!parsed) return 'bg-gray-500';

  const { r, g, b, a } = parsed;

  // 完全不透明
  if (a === 1) {
    // 尝试灰色系列
    if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10) {
      const gray = Math.round((r + g + b) / 3);
      const grayLevel = Math.round(gray / 32); // 0-7 对应 gray-50 到 gray-950
      const tailwindGray = Math.min(7, Math.max(0, grayLevel)) * 100 + 50;
      if (tailwindGray === 50 || tailwindGray === 100 || tailwindGray === 200 || 
          tailwindGray === 300 || tailwindGray === 400 || tailwindGray === 500 || 
          tailwindGray === 600 || tailwindGray === 700 || tailwindGray === 800 || 
          tailwindGray === 900) {
        return `bg-gray-${tailwindGray / 100}`;
      }
    }

    // 尝试常见颜色
    const colorName = findCommonColor(r, g, b);
    if (colorName) return `bg-${colorName}-500`;

    // 回退到任意值
    return `bg-[${color}]`;
  }

  // 半透明颜色使用 arbitrary value
  return `bg-[${color}]`;
}

/**
 * 将 Figma 圆角转换为 Tailwind 类名
 */
export function convertToTailwindRadius(radius: number): string {
  const roundedMap: Record<number, string> = {
    0: 'rounded-none',
    1: 'rounded-sm',
    2: 'rounded-sm',
    4: 'rounded',
    6: 'rounded',
    8: 'rounded-md',
    12: 'rounded-lg',
    16: 'rounded-lg',
    20: 'rounded-xl',
    24: 'rounded-xl',
    9999: 'rounded-full',
  };

  if (roundedMap[radius] !== undefined) {
    return roundedMap[radius];
  }

  // 查找最接近的值
  const keys = Object.keys(roundedMap).map(Number);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - radius) < Math.abs(prev - radius) ? curr : prev
  );

  return roundedMap[closest] || `rounded-[${radius}px]`;
}

/**
 * 将 Figma 阴影转换为 Tailwind 类名
 */
export function convertToTailwindShadow(shadow: string): string {
  const shadowMap: Record<string, string> = {
    'none': 'shadow-none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)': 'shadow-xs',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1)': 'shadow-sm',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)': 'shadow',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1)': 'shadow-md',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1)': 'shadow-lg',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1)': 'shadow-xl',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)': 'shadow-2xl',
  };

  if (shadowMap[shadow]) {
    return shadowMap[shadow];
  }

  // 尝试解析阴影值
  const parsed = parseShadow(shadow);
  if (parsed) {
    const { blur, spread } = parsed;
    if (blur <= 2 && spread <= 1) return 'shadow-xs';
    if (blur <= 6 && spread <= 1) return 'shadow-sm';
    if (blur <= 10 && spread <= 1) return 'shadow-md';
    if (blur <= 15 && spread <= 3) return 'shadow-lg';
    if (blur <= 25 && spread <= 5) return 'shadow-xl';
    if (blur <= 50 && spread <= 12) return 'shadow-2xl';
  }

  return `shadow-[${shadow}]`;
}

/**
 * 将 Figma 字体转换为 Tailwind 类名
 */
export function convertToTailwindFont(
  fontFamily?: string,
  fontSize?: number,
  fontWeight?: number,
  lineHeight?: number
): string[] {
  const classes: string[] = [];

  // 字体族
  if (fontFamily) {
    const normalizedFont = fontFamily.toLowerCase();
    if (normalizedFont.includes('inter')) {
      classes.push('font-sans');
    } else if (normalizedFont.includes('mono') || normalizedFont.includes('code')) {
      classes.push('font-mono');
    } else if (normalizedFont.includes('serif')) {
      classes.push('font-serif');
    }
  }

  // 字号
  if (fontSize !== undefined) {
    const sizeMap: Record<number, string> = {
      10: 'text-xs',
      11: 'text-xs',
      12: 'text-xs',
      13: 'text-sm',
      14: 'text-sm',
      16: 'text-base',
      18: 'text-lg',
      20: 'text-lg',
      24: 'text-xl',
      28: 'text-2xl',
      32: 'text-3xl',
      36: 'text-4xl',
      40: 'text-5xl',
      48: 'text-6xl',
      60: 'text-7xl',
      72: 'text-8xl',
      96: 'text-9xl',
    };

    if (sizeMap[fontSize]) {
      classes.push(sizeMap[fontSize]);
    } else {
      classes.push(`text-[${fontSize}px]`);
    }
  }

  // 字重
  if (fontWeight !== undefined) {
    const weightMap: Record<number, string> = {
      100: 'font-thin',
      200: 'font-extralight',
      300: 'font-light',
      400: 'font-normal',
      500: 'font-medium',
      600: 'font-semibold',
      700: 'font-bold',
      800: 'font-extrabold',
      900: 'font-black',
    };

    if (weightMap[fontWeight]) {
      classes.push(weightMap[fontWeight]);
    } else {
      classes.push(`font-[${fontWeight}]`);
    }
  }

  // 行高
  if (lineHeight !== undefined && fontSize) {
    const calculated = lineHeight / fontSize;
    if (calculated <= 1) classes.push('leading-none');
    else if (calculated <= 1.25) classes.push('leading-tight');
    else if (calculated <= 1.375) classes.push('leading-snug');
    else if (calculated <= 1.5) classes.push('leading-normal');
    else if (calculated <= 1.625) classes.push('leading-relaxed');
    else classes.push('leading-loose');
  }

  return classes;
}

/**
 * 转换完整样式为 Tailwind 类名
 */
export function convertStyleToTailwind(
  style: StyleDefinition,
  tokens?: DesignTokens
): {
  classes: string[];
  arbitraryStyles: Record<string, string>;
} {
  const classes: string[] = [];
  const arbitraryStyles: Record<string, string> = {};

  // 背景色
  if (style.backgroundColor) {
    classes.push(convertToTailwindColor(style.backgroundColor, tokens));
  }

  // 边框
  if (style.borderWidth) {
    classes.push(`border-[${style.borderWidth}px]`);
  }
  if (style.borderColor) {
    classes.push(convertToTailwindColor(style.borderColor, tokens));
  }
  if (style.borderRadius) {
    classes.push(convertToTailwindRadius(style.borderRadius));
  }

  // 阴影
  if (style.boxShadow) {
    classes.push(convertToTailwindShadow(style.boxShadow));
  }

  // 透明度
  if (style.opacity !== undefined && style.opacity < 1) {
    classes.push(`opacity-[${style.opacity}]`);
  }

  // 尺寸
  if (style.width !== undefined) {
    arbitraryStyles.width = `${style.width}px`;
  }
  if (style.height !== undefined) {
    arbitraryStyles.height = `${style.height}px`;
  }

  // 内边距
  if (style.paddingTop !== undefined) {
    arbitraryStyles.paddingTop = `${style.paddingTop}px`;
  }
  if (style.paddingRight !== undefined) {
    arbitraryStyles.paddingRight = `${style.paddingRight}px`;
  }
  if (style.paddingBottom !== undefined) {
    arbitraryStyles.paddingBottom = `${style.paddingBottom}px`;
  }
  if (style.paddingLeft !== undefined) {
    arbitraryStyles.paddingLeft = `${style.paddingLeft}px`;
  }

  // 外边距
  if (style.marginTop !== undefined) {
    arbitraryStyles.marginTop = `${style.marginTop}px`;
  }
  if (style.marginRight !== undefined) {
    arbitraryStyles.marginRight = `${style.marginRight}px`;
  }
  if (style.marginBottom !== undefined) {
    arbitraryStyles.marginBottom = `${style.marginBottom}px`;
  }
  if (style.marginLeft !== undefined) {
    arbitraryStyles.marginLeft = `${style.marginLeft}px`;
  }

  return { classes, arbitraryStyles };
}

/**
 * 辅助函数：解析颜色
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: hexMatch[4] ? parseInt(hexMatch[4], 16) / 255 : 1,
    };
  }

  return null;
}

/**
 * 辅助函数：标准化颜色
 */
function normalizeColor(color: string): string {
  const parsed = parseColor(color);
  if (!parsed) return color;
  return `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`;
}

/**
 * 辅助函数：解析阴影
 */
function parseShadow(
  shadow: string
): { x: number; y: number; blur: number; spread: number; color: string } | null {
  const match = shadow.match(
    /(\d+)px\s+(\d+)px\s+(\d+)px\s+(\d+)px\s+rgba?\([^)]+\)/
  );
  if (match) {
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      blur: parseInt(match[3]),
      spread: parseInt(match[4]),
      color: shadow,
    };
  }

  const simpleMatch = shadow.match(
    /(\d+)px\s+(\d+)px\s+(\d+)px\s+rgba?\([^)]+\)/
  );
  if (simpleMatch) {
    return {
      x: parseInt(simpleMatch[1]),
      y: parseInt(simpleMatch[2]),
      blur: parseInt(simpleMatch[3]),
      spread: 0,
      color: shadow,
    };
  }

  return null;
}

/**
 * 辅助函数：查找常见颜色名称
 */
function findCommonColor(r: number, g: number, b: number): string | null {
  const commonColors: Record<string, [number, number, number]> = {
    red: [239, 68, 68],
    orange: [249, 115, 22],
    amber: [245, 158, 11],
    yellow: [234, 179, 8],
    lime: [132, 204, 22],
    green: [34, 197, 94],
    emerald: [16, 185, 129],
    teal: [20, 184, 166],
    cyan: [6, 182, 212],
    sky: [14, 165, 233],
    blue: [59, 130, 246],
    indigo: [99, 102, 241],
    violet: [139, 92, 246],
    purple: [168, 85, 247],
    fuchsia: [192, 38, 211],
    pink: [236, 72, 153],
    rose: [244, 63, 94],
  };

  let closestColor: string | null = null;
  let closestDistance = Infinity;

  for (const [name, [cr, cg, cb]] of Object.entries(commonColors)) {
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
    );
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = name;
    }
  }

  // 只在距离足够近时返回颜色名称
  if (closestDistance < 30) {
    return closestColor;
  }

  return null;
}

/**
 * 生成 Tailwind 配置文件片段
 */
export function generateTailwindConfig(tokens: DesignTokens): string {
  let config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
`;

  // 颜色 - DesignTokens.colors 是 ColorToken[]
  if (tokens.colors && Array.isArray(tokens.colors)) {
    config += `      colors: {\n`;
    for (const color of tokens.colors) {
      config += `        '${color.name}': '${color.value}',\n`;
    }
    config += `      },\n`;
  }

  // 字体 - 暂时不处理，DesignTokens 没有 fonts 属性
  // 如需要可以扩展 DesignTokens 类型

  // 阴影 - DesignTokens.shadows 是 { name: string; value: string }[]
  if (tokens.shadows && Array.isArray(tokens.shadows)) {
    config += `      boxShadow: {\n`;
    for (const shadow of tokens.shadows) {
      config += `        '${shadow.name}': '${shadow.value}',\n`;
    }
    config += `      },\n`;
  }

  config += `    },
  },
};`;

  return config;
}

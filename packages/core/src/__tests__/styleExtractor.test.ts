import { describe, it, expect } from 'vitest';
import { rgbaToCSS, shadowsToCSS } from '@design-to-storybook/core/extractors/styleExtractor';

describe('StyleExtractor', () => {
  describe('rgbaToCSS', () => {
    it('should convert RGBA to CSS rgb format', () => {
      const color = { r: 255, g: 0, b: 0, a: 1 };

      const result = rgbaToCSS(color);

      // 当 alpha 为 1 时，返回 rgb 格式
      expect(result).toBe('rgb(255, 0, 0)');
    });

    it('should handle transparency', () => {
      const color = { r: 0, g: 0, b: 0, a: 0.5 };

      const result = rgbaToCSS(color);

      expect(result).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('shadowsToCSS', () => {
    it('should convert shadow to CSS', () => {
      const shadows = [
        {
          color: { r: 0, g: 0, b: 0, a: 0.3 },
          offset: { x: 0, y: 2 },
          blur: 4,
          spread: 0,
          inset: false,
        },
      ];

      const result = shadowsToCSS(shadows);

      // 直接返回 shadow 值，不包含 box-shadow 前缀
      expect(result).toContain('0px 2px 4px');
      expect(result).toContain('rgba(0, 0, 0, 0.3)');
    });

    it('should return empty string for no shadows', () => {
      const result = shadowsToCSS([]);

      expect(result).toBe('');
    });
  });
});

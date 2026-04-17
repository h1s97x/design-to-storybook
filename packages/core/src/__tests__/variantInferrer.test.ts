import { describe, it, expect } from 'vitest';
import { inferComponentProperties } from '@design-to-storybook/core/inference/variantInferrer';
import type { DesignNode } from '@design-to-storybook/core/types';

describe('VariantInferrer', () => {
  describe('inferComponentProperties', () => {
    it('should handle frame node', () => {
      const frameNode: DesignNode = {
        id: '1',
        name: 'Button',
        type: 'FRAME',
        children: [],
      };

      const result = inferComponentProperties(frameNode);

      // 返回推断结果的映射
      expect(result).toBeDefined();
    });

    it('should handle component set', () => {
      const componentSet: DesignNode = {
        id: '1',
        name: 'Button/Variants',
        type: 'COMPONENT_SET',
        children: [
          { id: '2', name: 'Primary', type: 'COMPONENT' } as DesignNode,
          { id: '3', name: 'Secondary', type: 'COMPONENT' } as DesignNode,
        ],
      };

      const result = inferComponentProperties(componentSet);

      expect(result).toBeDefined();
    });

    it('should handle text nodes', () => {
      const textNode: DesignNode = {
        id: '1',
        name: 'Label',
        type: 'TEXT',
        characters: 'Hello World',
      };

      const result = inferComponentProperties(textNode);

      expect(result).toBeDefined();
    });
  });
});

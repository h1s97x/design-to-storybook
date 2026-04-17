import { describe, it, expect } from 'vitest';
import { inferProps } from '@design-to-storybook/core/inference/propsInferrer';
import type { DesignNode } from '@design-to-storybook/core/types';

describe('PropsInferrer', () => {
  describe('inferProps', () => {
    it('should handle text node', () => {
      const textNode: DesignNode = {
        id: '1',
        name: 'Text',
        type: 'TEXT',
        characters: 'Hello',
      };

      const result = inferProps(textNode);

      // 返回数组，可能为空或包含推断的属性
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle frame node', () => {
      const frameNode: DesignNode = {
        id: '1',
        name: 'Frame',
        type: 'FRAME',
        children: [],
      };

      const result = inferProps(frameNode);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array for unknown nodes', () => {
      const unknownNode: DesignNode = {
        id: '1',
        name: 'Unknown',
        type: 'VECTOR',
      };

      const result = inferProps(unknownNode);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});

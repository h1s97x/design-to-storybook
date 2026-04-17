import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@design-to-storybook/core', '@design-to-storybook/react', '@design-to-storybook/vue', '@design-to-storybook/angular']
});

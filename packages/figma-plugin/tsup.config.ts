import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/ui.tsx'],
  format: ['esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  platform: 'browser',
  // Figma Plugin 不需要外部依赖打包
  external: [],
});

/**
 * Design-to-Storybook React Generator
 * 
 * React-specific code generation for Design-to-Storybook
 */

// Export generators
export { generateReactComponent } from './generators/reactComponentGenerator.js';
export { generateStoryFile } from './generators/storyGenerator.js';

export type { ReactGeneratorOptions } from './generators/reactComponentGenerator.js';
export type { StoryGeneratorOptions } from './generators/storyGenerator.js';

/**
 * Main React generation function
 */
import type { DesignNode, GeneratedComponent } from '@design-to-storybook/core';
import { generateReactComponent } from './generators/reactComponentGenerator.js';
import type { ReactGeneratorOptions } from './generators/reactComponentGenerator.js';
import { generateStoryFile } from './generators/storyGenerator.js';
import type { StoryGeneratorOptions } from './generators/storyGenerator.js';

export interface ReactConvertOptions extends Partial<ReactGeneratorOptions>, Partial<StoryGeneratorOptions> {
  outputDir?: string;
  styleFormat?: 'css' | 'tailwind' | 'styled';
  typescript?: boolean;
}

export interface ReactConvertResult {
  components: GeneratedComponent[];
  stories: string[];
}

/**
 * Convert design nodes to React components and stories
 */
export function convertToReact(
  nodes: DesignNode[],
  options: ReactConvertOptions = {}
): ReactConvertResult {
  const components: GeneratedComponent[] = [];
  const stories: string[] = [];

  for (const node of nodes) {
    // Generate component
    const { code, styles } = generateReactComponent(node, options);
    const component: GeneratedComponent = {
      name: node.name,
      code,
      language: 'tsx',
      props: [],
      styles,
    };
    components.push(component);

    // Generate story
    const storyContent = generateStoryFile(component, node, options);
    stories.push(storyContent);
  }

  return { components, stories };
}

/**
 * Convert a single design node to React
 */
export function convertNodeToReact(
  node: DesignNode,
  options: ReactConvertOptions = {}
): ReactConvertResult {
  const { code, styles } = generateReactComponent(node, options);
  const component: GeneratedComponent = {
    name: node.name,
    code,
    language: 'tsx',
    props: [],
    styles,
  };
  const story = generateStoryFile(component, node, options);

  return {
    components: [component],
    stories: [story],
  };
}

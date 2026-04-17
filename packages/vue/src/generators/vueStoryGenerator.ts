/**
 * Vue Storybook Story 生成器
 * 为 Vue 3 组件生成 Storybook Stories
 */

import type { PropDefinition } from '@design-to-storybook/core';

export interface VueStoryOutput {
  /** Story 文件内容 */
  storyFile: string;
  /** MDX 文档内容 */
  docsFile?: string;
}

// 简化的 Variant 定义
export interface VariantDefinition {
  name: string;
  variantProps: Record<string, string>;
}

/**
 * Vue Storybook Story 生成器
 */
export class VueStoryGenerator {
  /**
   * 生成 Vue Storybook Story 文件
   */
  generate(
    componentName: string,
    componentPath: string,
    props: PropDefinition[],
    variants?: VariantDefinition[]
  ): VueStoryOutput {
    const stories: string[] = [];

    // Default Story
    stories.push(this.generateDefaultStory(componentName, props));

    // Variant Stories
    if (variants && variants.length > 0) {
      stories.push(this.generateVariantStories(componentName, variants));
    }

    // State Stories
    stories.push(this.generateStateStories(componentName, props));

    const storyFile = this.wrapStoryFile(componentName, componentPath, stories.join('\n\n'));

    return {
      storyFile,
    };
  }

  /**
   * 生成默认 Story
   */
  private generateDefaultStory(
    _componentName: string,
    props: PropDefinition[]
  ): string {
    const defaultArgs = props
      .filter((p) => p.defaultValue !== undefined)
      .reduce((acc, p) => {
        acc[p.name] = p.defaultValue;
        return acc;
      }, {} as Record<string, unknown>);

    const argTypes = this.generateArgTypes(props);

    return `export const Default = {
  args: ${JSON.stringify(defaultArgs, null, 4)},
  argTypes: ${argTypes},
  parameters: {
    layout: 'centered',
  },
};`;
  }

  /**
   * 生成 Variant Stories
   */
  private generateVariantStories(
    _componentName: string,
    variants: VariantDefinition[]
  ): string {
    const variantStories = variants.map((variant) => {
      return `export const ${this.toPascalCase(variant.name)} = {
  args: ${JSON.stringify(variant.variantProps, null, 4)},
  parameters: {
    layout: 'centered',
  },
};`;
    });

    return variantStories.join('\n\n');
  }

  /**
   * 生成状态 Story
   */
  private generateStateStories(
    _componentName: string,
    props: PropDefinition[]
  ): string {
    const states: string[] = [];

    // 生成禁用状态
    const hasDisabled = props.some((p) => p.name === 'disabled');
    if (hasDisabled) {
      states.push(`export const Disabled = {
  args: {
    disabled: true,
  },
  parameters: {
    layout: 'centered',
  },
};`);
    }

    // 生成加载状态
    const hasLoading = props.some((p) => p.name === 'loading');
    if (hasLoading) {
      states.push(`export const Loading = {
  args: {
    loading: true,
  },
  parameters: {
    layout: 'centered',
  },
};`);
    }

    return states.join('\n\n');
  }

  /**
   * 生成 ArgTypes
   */
  private generateArgTypes(props: PropDefinition[]): string {
    const argTypes: Record<string, { control?: { type: string }; options?: string[]; description?: string }> = {};

    for (const prop of props) {
      // 有 options 的使用 select
      if (prop.options && prop.options.length > 0) {
        argTypes[prop.name] = {
          control: { type: 'select' },
          options: prop.options,
        };
      } else if (prop.type === 'boolean') {
        argTypes[prop.name] = {
          control: { type: 'boolean' },
        };
      } else if (prop.type === 'number') {
        argTypes[prop.name] = {
          control: { type: 'number' },
        };
      } else {
        // 默认为 text
        argTypes[prop.name] = {
          control: { type: 'text' },
        };
      }
    }

    return JSON.stringify(argTypes, null, 4);
  }

  /**
   * 包装 Story 文件
   */
  private wrapStoryFile(
    componentName: string,
    componentPath: string,
    stories: string
  ): string {
    return `import type { Meta, StoryObj } from '@storybook/vue3';
import ${componentName} from '${componentPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

${stories}`;
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }
}

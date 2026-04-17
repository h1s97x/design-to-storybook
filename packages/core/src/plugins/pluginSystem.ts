/**
 * Plugin System for Design-to-Storybook
 * 
 * Allows extending the conversion pipeline with custom plugins
 */

import type { DesignNode, PropDefinition, StyleDefinition } from '../types';

/**
 * Plugin hook types
 */
export type PluginHook = 
  | 'beforeExtract'
  | 'afterExtract'
  | 'beforeConvert'
  | 'afterConvert'
  | 'beforeGenerate'
  | 'afterGenerate';

/**
 * Plugin interface
 */
export interface DesignToStorybookPlugin {
  name: string;
  version: string;
  hooks: {
    [K in PluginHook]?: (context: PluginContext) => Promise<void> | void;
  };
  transforms?: {
    node?: (node: DesignNode) => DesignNode;
    props?: (props: PropDefinition[]) => PropDefinition[];
    styles?: (styles: StyleDefinition) => StyleDefinition;
  };
  config?: Record<string, unknown>;
}

/**
 * Plugin context passed to hook functions
 */
export interface PluginContext {
  fileName?: string;
  framework?: string;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Plugin manager class
 */
export class PluginManager {
  private plugins: DesignToStorybookPlugin[] = [];
  private hooks: Map<PluginHook, Set<(context: PluginContext) => Promise<void> | void>> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: DesignToStorybookPlugin): void {
    if (this.plugins.find(p => p.name === plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    this.plugins.push(plugin);
    
    // Register hooks
    for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
      if (hookFn) {
        const hook = hookName as PluginHook;
        if (!this.hooks.has(hook)) {
          this.hooks.set(hook, new Set());
        }
        this.hooks.get(hook)!.add(hookFn);
      }
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    const index = this.plugins.findIndex(p => p.name === name);
    if (index === -1) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    const plugin = this.plugins[index];
    this.plugins.splice(index, 1);

    // Remove hooks
    for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
      if (hookFn) {
        const hook = hookName as PluginHook;
        this.hooks.get(hook)?.delete(hookFn);
      }
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): DesignToStorybookPlugin[] {
    return [...this.plugins];
  }

  /**
   * Execute hooks for a specific event
   */
  async executeHook(hook: PluginHook, context: PluginContext = {}): Promise<void> {
    const handlers = this.hooks.get(hook);
    if (handlers) {
      for (const handler of handlers) {
        await handler(context);
      }
    }
  }

  /**
   * Apply node transforms from plugins
   */
  applyNodeTransforms(node: DesignNode): DesignNode {
    let result = node;
    for (const plugin of this.plugins) {
      if (plugin.transforms?.node) {
        result = plugin.transforms.node(result);
      }
    }
    return result;
  }

  /**
   * Apply props transforms from plugins
   */
  applyPropsTransforms(props: PropDefinition[]): PropDefinition[] {
    let result = props;
    for (const plugin of this.plugins) {
      if (plugin.transforms?.props) {
        result = plugin.transforms.props(result);
      }
    }
    return result;
  }

  /**
   * Apply styles transforms from plugins
   */
  applyStylesTransforms(styles: StyleDefinition): StyleDefinition {
    let result = styles;
    for (const plugin of this.plugins) {
      if (plugin.transforms?.styles) {
        result = plugin.transforms.styles(result);
      }
    }
    return result;
  }
}

// Built-in plugins
export const officialPlugins = {
  /**
   * Tailwind CSS plugin
   */
  tailwind: {
    name: 'tailwind',
    version: '1.0.0',
    hooks: {},
    transforms: {
      styles: (styles: StyleDefinition) => {
        // Add Tailwind-specific transformations
        return {
          ...styles,
          tailwindClasses: true
        };
      }
    }
  },

  /**
   * Accessibility plugin
   */
  a11y: {
    name: 'a11y',
    version: '1.0.0',
    hooks: {
      afterConvert: (_context: unknown) => {
        // Add accessibility attributes
        console.log('Adding accessibility attributes');
      }
    },
    transforms: {
      props: (props: PropDefinition[]) => {
        // Add a11y-related props
        return [
          ...props,
          {
            name: 'ariaLabel',
            type: 'string',
            required: false,
            description: 'Accessibility label'
          }
        ];
      }
    }
  },

  /**
   * i18n plugin
   */
  i18n: {
    name: 'i18n',
    version: '1.0.0',
    hooks: {},
    transforms: {
      props: (props: PropDefinition[]) => {
        // Wrap text content with i18n function
        return props.map((prop: PropDefinition) => ({
          ...prop,
          description: `[i18n] ${prop.description}`
        }));
      }
    }
  }
} as const;

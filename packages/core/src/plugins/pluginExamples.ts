/**
 * Plugin Examples
 * 
 * Example plugins demonstrating the plugin system
 */

import type { DesignToStorybookPlugin, PluginContext } from './pluginSystem';

/**
 * Custom color mapping plugin
 * Maps design colors to semantic tokens
 */
export const colorMappingPlugin: DesignToStorybookPlugin = {
  name: 'color-mapping',
  version: '1.0.0',
  
  config: {
    mappings: {
      '#6366f1': 'primary',
      '#ef4444': 'destructive',
      '#22c55e': 'success',
      '#f59e0b': 'warning'
    }
  },

  hooks: {
    beforeConvert: (_context: PluginContext) => {
      console.log('[color-mapping] Applying color mappings');
    }
  },

  transforms: {
    styles: (styles) => {
      const config = colorMappingPlugin.config as { mappings: Record<string, string> };
      
      return {
        ...styles,
        semanticColors: Object.fromEntries(
          Object.entries(config.mappings).map(([hex, token]) => [token, hex])
        )
      };
    }
  }
};

/**
 * Animation plugin
 * Adds animation props to components
 */
export const animationPlugin: DesignToStorybookPlugin = {
  name: 'animation',
  version: '1.0.0',

  hooks: {
    beforeConvert: (_context: PluginContext) => {
      console.log('[animation] Adding animation support');
    }
  },

  transforms: {
    props: (props) => {
      return [
        ...props,
        {
          name: 'animation',
          type: 'string',
          required: false,
          defaultValue: 'none',
        },
        {
          name: 'animationDuration',
          type: 'number',
          required: false,
          defaultValue: 300,
        }
      ];
    }
  }
};

/**
 * Form validation plugin
 * Adds validation props to form components
 */
export const formValidationPlugin: DesignToStorybookPlugin = {
  name: 'form-validation',
  version: '1.0.0',

  hooks: {
    beforeConvert: (_context: PluginContext) => {
      console.log('[form-validation] Adding form validation props');
    }
  },

  transforms: {
    props: (props) => {
      return [
        ...props,
        {
          name: 'required',
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
        {
          name: 'pattern',
          type: 'string',
          required: false,
        },
        {
          name: 'minLength',
          type: 'number',
          required: false,
        },
        {
          name: 'maxLength',
          type: 'number',
          required: false,
        }
      ];
    }
  }
};

/**
 * Responsive props plugin
 * Adds responsive props to components
 */
export const responsivePlugin: DesignToStorybookPlugin = {
  name: 'responsive',
  version: '1.0.0',

  hooks: {
    beforeConvert: (_context: PluginContext) => {
      console.log('[responsive] Adding responsive props');
    }
  },

  transforms: {
    props: (props) => {
      return [
        ...props,
        {
          name: 'hiddenOn',
          type: 'string',
          required: false,
        },
        {
          name: 'visibleOn',
          type: 'string',
          required: false,
        }
      ];
    }
  }
};

/**
 * State machine plugin
 * Adds state machine support for complex components
 */
export const stateMachinePlugin: DesignToStorybookPlugin = {
  name: 'state-machine',
  version: '1.0.0',

  hooks: {
    afterConvert: (_context: PluginContext) => {
      console.log('[state-machine] State machine generated');
    }
  },

  transforms: {
    props: (props) => {
      return [
        ...props,
        {
          name: 'state',
          type: 'string',
          required: false,
          defaultValue: 'idle',
        },
        {
          name: 'onStateChange',
          type: 'function',
          required: false,
        }
      ];
    }
  }
};

/**
 * Testing plugin
 * Adds testing utilities
 */
export const testingPlugin: DesignToStorybookPlugin = {
  name: 'testing',
  version: '1.0.0',

  hooks: {
    afterGenerate: (_context: PluginContext) => {
      console.log('[testing] Testing utilities added');
    }
  },

  transforms: {
    props: (props) => {
      return [
        {
          name: 'dataTestid',
          type: 'string',
          required: false,
        },
        ...props
      ];
    }
  }
};

import type { DesignNode } from '../types/index.js';

/**
 * Interaction State
 */
export interface InteractionState {
  name: string;
  selector: string;
  styles: Record<string, unknown>;
  description: string;
}

/**
 * Interaction State Export
 */
export interface InteractionStateExport {
  states: InteractionState[];
  interactionCode: string;
  testCases: string;
  metadata: {
    extractedAt: string;
    totalStates: number;
    framework: string;
  };
}

/**
 * Interaction State Exporter
 * Extracts and exports interaction states from Figma designs
 */
export class InteractionStateExporter {
  
  /**
   * Export interaction states
   */
  export(
    nodes: DesignNode[],
    options?: InteractionExportOptions
  ): InteractionStateExport {
    const states = this.extractStates(nodes);
    const interactionCode = this.generateInteractionCode(states, options);
    const testCases = this.generateTestCases(states);
    
    return {
      states,
      interactionCode,
      testCases,
      metadata: {
        extractedAt: new Date().toISOString(),
        totalStates: states.length,
        framework: options?.framework || 'react'
      }
    };
  }
  
  /**
   * Extract interaction states from nodes
   */
  private extractStates(nodes: DesignNode[]): InteractionState[] {
    const states: InteractionState[] = [];
    
    for (const node of nodes) {
      const nodeRecord = node as unknown as Record<string, unknown>;
      
      // Check for hover state indicators
      if (node.name.toLowerCase().includes('hover')) {
        states.push({
          name: 'Hover',
          selector: '[data-state="hover"]',
          styles: (nodeRecord.styles as Record<string, unknown>) || {},
          description: 'Applied when the mouse hovers over the element'
        });
      }
      
      // Check for active/pressed state
      if (node.name.toLowerCase().includes('active')) {
        states.push({
          name: 'Active',
          selector: '[data-state="active"]',
          styles: (nodeRecord.styles as Record<string, unknown>) || {},
          description: 'Applied when the element is being clicked'
        });
      }
      
      // Check for focus state
      if (node.name.toLowerCase().includes('focus')) {
        states.push({
          name: 'Focus',
          selector: '[data-state="focus"]',
          styles: (nodeRecord.styles as Record<string, unknown>) || {},
          description: 'Applied when the element has focus'
        });
      }
      
      // Check for disabled state
      if (node.name.toLowerCase().includes('disabled')) {
        states.push({
          name: 'Disabled',
          selector: '[data-state="disabled"]',
          styles: (nodeRecord.styles as Record<string, unknown>) || {},
          description: 'Applied when the element is disabled'
        });
      }
      
      // Process children
      const children = nodeRecord.children as DesignNode[] | undefined;
      if (children) {
        states.push(...this.extractStates(children));
      }
    }
    
    return states;
  }
  
  /**
   * Generate interaction state CSS/Code
   */
  private generateInteractionCode(
    states: InteractionState[],
    options?: InteractionExportOptions
  ): string {
    const framework = options?.framework || 'react';
    
    if (framework === 'react') {
      return this.generateReactInteractionCode(states);
    }
    
    if (framework === 'vue') {
      return this.generateVueInteractionCode(states);
    }
    
    if (framework === 'angular') {
      return this.generateAngularInteractionCode(states);
    }
    
    return this.generateCSSInteractionCode(states);
  }
  
  /**
   * Generate React interaction hooks
   */
  private generateReactInteractionCode(states: InteractionState[]): string {
    if (states.length === 0) {
      return `import { useState } from 'react';

// No interaction states found
export function useInteraction() {
  return {};
}`;
    }
    
    return `import { useState } from 'react';

/**
 * Hook for managing component interaction states
 */
export function useInteraction() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return {
    isHovered, setIsHovered,
    isPressed, setIsPressed,
    isFocused, setIsFocused,
    isDisabled, setIsDisabled,
    isLoading, setIsLoading,
    getState: (state: string) => {
      const stateMap = { hovered: isHovered, pressed: isPressed, focused: isFocused, disabled: isDisabled, loading: isLoading };
      return stateMap[state] || false;
    }
  };
}`;
  }
  
  /**
   * Generate Vue interaction composable
   */
  private generateVueInteractionCode(states: InteractionState[]): string {
    if (states.length === 0) return '';
    
    return `import { ref } from 'vue';

export function useInteraction() {
  const isHovered = ref(false);
  const isPressed = ref(false);
  const isFocused = ref(false);
  const isDisabled = ref(false);
  const isLoading = ref(false);

  return {
    isHovered,
    isPressed,
    isFocused,
    isDisabled,
    isLoading,
    handlers: {
      onMouseenter: () => isHovered.value = true,
      onMouseleave: () => isHovered.value = false,
      onMousedown: () => isPressed.value = true,
      onMouseup: () => isPressed.value = false,
      onFocus: () => isFocused.value = true,
      onBlur: () => isFocused.value = false,
    }
  };
}`;
  }
  
  /**
   * Generate Angular interaction directives
   */
  private generateAngularInteractionCode(states: InteractionState[]): string {
    if (states.length === 0) return '';
    
    return `import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[d2sInteraction]',
})
export class InteractionDirective {
  @Input() isHovered = false;
  @Input() isPressed = false;
  @Input() isFocused = false;
  @Input() isDisabled = false;
  @Input() isLoading = false;

  @HostListener('mouseenter') onMouseEnter() {
    this.isHovered = true;
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.isHovered = false;
  }

  @HostListener('mousedown') onMouseDown() {
    this.isPressed = true;
  }

  @HostListener('mouseup') onMouseUp() {
    this.isPressed = false;
  }

  @HostListener('focus') onFocus() {
    this.isFocused = true;
  }

  @HostListener('blur') onBlur() {
    this.isFocused = false;
  }
}`;
  }
  
  /**
   * Generate CSS interaction styles
   */
  private generateCSSInteractionCode(states: InteractionState[]): string {
    if (states.length === 0) return '/* No interaction states */';
    
    const cssRules = states.map(state => {
      const styleEntries = Object.entries(state.styles || {});
      const styleString = styleEntries
        .map(([k, v]) => `  ${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
        .join('\n');
      
      return `.component${state.selector} {\n${styleString}\n}`;
    }).join('\n\n');
    
    return `/* Interaction States */\n\n${cssRules}`;
  }
  
  /**
   * Generate Playwright test cases
   */
  private generateTestCases(states: InteractionState[]): string {
    if (states.length === 0) return '';
    
    const testCases = states.map(state => `
  test('${state.name.toLowerCase()} state', async ({ page }) => {
    await page.goto('storybook-url');
    const element = page.locator('your-selector');
    
    // ${state.description}
    // Add test implementation
    
    await expect(element).toHaveAttribute('data-state', '${state.name.toLowerCase()}');
  });`).join('\n');
    
    return `import { test, expect } from '@playwright/test';

${testCases}
`;
  }
}

export interface InteractionExportOptions {
  framework?: 'react' | 'vue' | 'angular';
  includeTests?: boolean;
  includeHooks?: boolean;
}

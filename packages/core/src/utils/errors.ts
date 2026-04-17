import type { ConversionError } from '../types/index.js';

export type { ConversionError } from '../types/index.js';

/**
 * Error codes for design-to-storybook
 */
export enum ErrorCode {
  // Parse errors
  PARSE_FAILED = 'PARSE_FAILED',
  INVALID_JSON = 'INVALID_JSON',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Design errors
  UNSUPPORTED_NODE_TYPE = 'UNSUPPORTED_NODE_TYPE',
  MISSING_STYLE_INFO = 'MISSING_STYLE_INFO',
  INVALID_COMPONENT_STRUCTURE = 'INVALID_COMPONENT_STRUCTURE',
  
  // Generation errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  
  // File errors
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  
  // Figma API errors
  FIGMA_API_ERROR = 'FIGMA_API_ERROR',
  FIGMA_AUTH_FAILED = 'FIGMA_AUTH_FAILED',
  FIGMA_RATE_LIMITED = 'FIGMA_RATE_LIMITED',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_FRAMEWORK = 'INVALID_FRAMEWORK',
  INVALID_STYLE_FORMAT = 'INVALID_STYLE_FORMAT'
}

/**
 * Custom error class for design-to-storybook
 */
export class DesignToStorybookError extends Error {
  public readonly code: ErrorCode;
  public readonly nodeId?: string;
  public readonly nodeName?: string;
  public readonly details?: Record<string, unknown>;
  public readonly suggestion?: string;

  constructor(options: ErrorOptions) {
    super(options.message);
    this.name = 'DesignToStorybookError';
    this.code = options.code;
    this.nodeId = options.nodeId;
    this.nodeName = options.nodeName;
    this.details = options.details;
    this.suggestion = options.suggestion;
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DesignToStorybookError);
    }
  }

  /**
   * Convert to ConversionError format
   */
  toConversionError(): ConversionError {
    return {
      nodeId: this.nodeId || 'unknown',
      nodeName: this.nodeName || 'Unknown Node',
      message: this.message,
      severity: this.code.startsWith('INVALID') || this.code.startsWith('MISSING') ? 'warning' : 'error'
    };
  }

  /**
   * Format error for display
   */
  toDisplayString(): string {
    let output = `[${this.code}] ${this.message}`;
    
    if (this.nodeName) {
      output += `\n  Node: ${this.nodeName}`;
    }
    
    if (this.nodeId) {
      output += `\n  ID: ${this.nodeId}`;
    }
    
    if (this.suggestion) {
      output += `\n  Suggestion: ${this.suggestion}`;
    }
    
    if (this.details && Object.keys(this.details).length > 0) {
      output += `\n  Details: ${JSON.stringify(this.details, null, 2)}`;
    }
    
    return output;
  }
}

/**
 * Error factory functions
 */
export const Errors = {
  parseFailed(message: string, details?: Record<string, unknown>): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.PARSE_FAILED,
      message,
      details,
      suggestion: 'Check the input JSON format and ensure it matches the expected structure.'
    });
  },

  invalidJson(message: string): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.INVALID_JSON,
      message,
      suggestion: 'Validate the JSON using a JSON parser or linter.'
    });
  },

  unsupportedNodeType(type: string, nodeId?: string): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.UNSUPPORTED_NODE_TYPE,
      message: `Unsupported node type: ${type}`,
      nodeId,
      suggestion: 'Consider using a supported node type or flatten the element.'
    });
  },

  missingStyleInfo(nodeName: string, nodeId?: string): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.MISSING_STYLE_INFO,
      message: 'Missing style information for node',
      nodeId,
      nodeName,
      suggestion: 'Ensure the node has visible fills, strokes, or effects in Figma.'
    });
  },

  generationFailed(message: string, details?: Record<string, unknown>): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.GENERATION_FAILED,
      message,
      details,
      suggestion: 'Check the component template and ensure all required data is provided.'
    });
  },

  invalidFramework(framework: string): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.INVALID_FRAMEWORK,
      message: `Invalid framework: ${framework}`,
      suggestion: 'Supported frameworks: react, vue, angular, svelte.'
    });
  },

  invalidStyleFormat(format: string): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.INVALID_STYLE_FORMAT,
      message: `Invalid style format: ${format}`,
      suggestion: 'Supported formats: css, tailwind, styled.'
    });
  },

  figmaApiError(message: string, details?: Record<string, unknown>): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.FIGMA_API_ERROR,
      message,
      details,
      suggestion: 'Check your Figma API token and network connection.'
    });
  },

  fileWriteFailed(path: string, error?: Error): DesignToStorybookError {
    return new DesignToStorybookError({
      code: ErrorCode.FILE_WRITE_FAILED,
      message: `Failed to write file: ${path}`,
      details: error ? { originalError: error.message } : undefined,
      suggestion: 'Check file permissions and ensure the directory exists.'
    });
  }
};

interface ErrorOptions {
  code: ErrorCode;
  message: string;
  nodeId?: string;
  nodeName?: string;
  details?: Record<string, unknown>;
  suggestion?: string;
}

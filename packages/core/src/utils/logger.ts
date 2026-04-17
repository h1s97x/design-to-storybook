/**
 * Logger for design-to-storybook
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export type LogHandler = (entry: LogEntry) => void;

/**
 * Logger class
 */
export class Logger {
  private level: LogLevel;
  private handlers: LogHandler[] = [];
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(options?: LoggerOptions) {
    this.level = options?.level ?? LogLevel.INFO;
    this.maxEntries = options?.maxEntries ?? 1000;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Add log handler
   */
  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Clear all handlers
   */
  clearHandlers(): void {
    this.handlers = [];
  }

  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info log
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning log
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error log
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Success log (info level with success prefix)
   */
  success(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, `✓ ${message}`, context);
  }

  /**
   * Get all log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    // Store entry
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Call handlers
    for (const handler of this.handlers) {
      try {
        handler(entry);
      } catch (err) {
        console.error('Log handler error:', err);
      }
    }

    // Console output
    this.outputToConsole(entry);
  }

  /**
   * Output to console
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = this.getLevelPrefix(entry.level);
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] ${prefix} ${entry.message}${contextStr}`);
        break;
      case LogLevel.INFO:
        console.info(`[${timestamp}] ${prefix} ${entry.message}${contextStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] ${prefix} ${entry.message}${contextStr}`);
        break;
      case LogLevel.ERROR:
        console.error(`[${timestamp}] ${prefix} ${entry.message}${contextStr}`);
        break;
    }
  }

  /**
   * Get level prefix
   */
  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '[DEBUG]';
      case LogLevel.INFO: return '[INFO]';
      case LogLevel.WARN: return '[WARN]';
      case LogLevel.ERROR: return '[ERROR]';
    }
  }
}

export interface LoggerOptions {
  level?: LogLevel;
  maxEntries?: number;
  prefix?: string;
  handlers?: LogHandler[];
}

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/**
 * Default console logger
 */
export const defaultLogger = createLogger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO
});

/**
 * Silent logger (for testing)
 */
export const silentLogger = createLogger({
  level: LogLevel.ERROR + 1 // Above all levels
});

/**
 * Verbose logger (for debugging)
 */
export const verboseLogger = createLogger({
  level: LogLevel.DEBUG
});

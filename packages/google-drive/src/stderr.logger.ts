import { LoggerService, LogLevel } from '@nestjs/common';

export type LogWriter = (message: string) => void;

export class StderrLogger implements LoggerService {
  private static logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  private customWriter: LogWriter | undefined;

  constructor(
    private context?: string,
    private options: { timestamp?: boolean } = {},
    writer?: LogWriter, // writer parameter from main.ts
  ) {
    this.customWriter = writer; // Store the custom writer if provided
  }

  log(message: any, context?: string) {
    this.printMessage('log', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printMessage('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.printMessage('warn', message, context);
  }

  debug?(message: any, context?: string) {
    if (!StderrLogger.logLevels.includes('debug')) {
      return;
    }
    this.printMessage('debug', message, context);
  }

  verbose?(message: any, context?: string) {
    if (!StderrLogger.logLevels.includes('verbose')) {
      return;
    }
    this.printMessage('verbose', message, context);
  }

  private printMessage(level: LogLevel, message: any, context?: string, trace?: string) {
    const prefix = this.formatPrefix(level, context || this.context);
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    const logLine = `${prefix}${formattedMessage}`;

    if (this.customWriter) {
      // If a custom writer (e.g., for VS Code OutputChannel) is provided, use it.
      // Add newline as customWriter (like outputChannel.append) might expect full lines.
      this.customWriter(logLine + '\\n');
      if (trace) {
        this.customWriter(trace + '\\n');
      }
    } else {
      // Default behavior: use console.error for errors, console.warn for other levels
      // to ensure messages go to stderr and potentially avoid parsing issues.
      switch (level) {
        case 'error':
          console.error(logLine);
          if (trace) console.error(trace);
          break;
        case 'warn':
          console.warn(logLine);
          break;
        case 'log':
          console.warn(logLine); // Using console.warn to direct to stderr
          break;
        case 'debug':
          console.warn(logLine); // Using console.warn to direct to stderr
          break;
        case 'verbose':
          console.warn(logLine); // Using console.warn to direct to stderr
          break;
        default:
          console.warn(logLine); // Default to console.warn for unknown levels
      }
    }
  }

  private formatPrefix(level: LogLevel, context?: string): string {
    let prefix = '';
    if (this.options.timestamp) {
      prefix += `${new Date().toISOString()} `;
    }
    prefix += `${level.toUpperCase()} `;
    if (context) {
      prefix += `[${context}] `;
    }
    return prefix;
  }

  setLogLevels?(levels: LogLevel[]) {
    StderrLogger.logLevels = levels;
  }
}

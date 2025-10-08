/**
 * Structured logging utility with environment-based filtering
 *
 * Usage:
 *   logger.debug('User action', { userId: '123' });
 *   logger.info('Payment processed', { amount: 100 });
 *   logger.warn('Low memory', { available: 50 });
 *   logger.error('API failed', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    let formatted = `${emoji} [${level.toUpperCase()}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    return formatted;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: error.message,
        stack: error.stack,
      }),
    };

    console.error(this.formatMessage('error', message, errorContext));

    // TODO: Send to remote logging service (Sentry, LogRocket, etc.)
    // if (this.remoteLogger) {
    //   this.remoteLogger.captureException(error, { extra: context });
    // }
  }
}

export const logger = new Logger();

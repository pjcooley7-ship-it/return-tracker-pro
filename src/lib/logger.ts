type Severity = 'info' | 'warn' | 'error' | 'fatal';

interface LogOptions {
  source?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

function log(severity: Severity, message: string, options: LogOptions = {}) {
  const { source = 'client', metadata } = options;

  // Log to console only - error_logs table doesn't exist yet
  const consoleFn = severity === 'fatal' ? console.error : console[severity] ?? console.log;
  consoleFn(`[${severity.toUpperCase()}] ${source}: ${message}`, metadata ?? '');
}

export const logger = {
  info: (message: string, options?: LogOptions) => log('info', message, options),
  warn: (message: string, options?: LogOptions) => log('warn', message, options),
  error: (message: string, options?: LogOptions) => log('error', message, options),
  fatal: (message: string, options?: LogOptions) => log('fatal', message, options),
};

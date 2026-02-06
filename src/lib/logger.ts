import { supabase } from '@/integrations/supabase/client';

type Severity = 'info' | 'warn' | 'error' | 'fatal';

interface LogOptions {
  source?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

function log(severity: Severity, message: string, options: LogOptions = {}) {
  const { source = 'client', metadata, stack } = options;
  const url = typeof window !== 'undefined' ? window.location.href : undefined;

  // Always log to console
  const consoleFn = severity === 'fatal' ? console.error : console[severity] ?? console.log;
  consoleFn(`[${severity.toUpperCase()}] ${source}: ${message}`, metadata ?? '');

  // Fire-and-forget insert into error_logs — never throw
  try {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id ?? null;
      supabase
        .from('error_logs')
        .insert({
          user_id: userId,
          severity,
          source,
          message,
          stack: stack ?? null,
          metadata: metadata ?? {},
          url: url ?? null,
        })
        .then(({ error }) => {
          if (error) {
            // Only console — never throw from logger
            console.warn('[logger] Failed to persist log:', error.message);
          }
        });
    });
  } catch {
    // Swallow — logging must never crash the app
  }
}

export const logger = {
  info: (message: string, options?: LogOptions) => log('info', message, options),
  warn: (message: string, options?: LogOptions) => log('warn', message, options),
  error: (message: string, options?: LogOptions) => log('error', message, options),
  fatal: (message: string, options?: LogOptions) => log('fatal', message, options),
};

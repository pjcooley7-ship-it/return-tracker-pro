import { supabase } from '@/integrations/supabase/client';

type Severity = 'info' | 'warn' | 'error' | 'fatal';

interface LogOptions {
  source?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

async function persistLog(severity: Severity, message: string, options: LogOptions) {
  const { source = 'client', metadata, stack } = options;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('error_logs').insert({
      user_id: session?.user.id ?? null,
      severity,
      source,
      message,
      stack: stack ?? null,
      metadata: metadata ?? {},
      url: window.location.href,
    });
  } catch {
    // Swallow silently — logger errors must never cause infinite loops
  }
}

function log(severity: Severity, message: string, options: LogOptions = {}) {
  const { source = 'client', metadata } = options;
  const consoleFn = severity === 'fatal' ? console.error : console[severity] ?? console.log;
  consoleFn(`[${severity.toUpperCase()}] ${source}: ${message}`, metadata ?? '');

  if (severity !== 'info') {
    persistLog(severity, message, options);
  }
}

export const logger = {
  info:  (message: string, options?: LogOptions) => log('info',  message, options),
  warn:  (message: string, options?: LogOptions) => log('warn',  message, options),
  error: (message: string, options?: LogOptions) => log('error', message, options),
  fatal: (message: string, options?: LogOptions) => log('fatal', message, options),
};

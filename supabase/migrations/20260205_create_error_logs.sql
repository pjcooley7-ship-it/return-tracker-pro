-- Create error_logs table for centralized error tracking
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warn', 'error', 'fatal')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own error logs
CREATE POLICY "Users can insert own error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service_role can read all error logs (for dashboards / debugging)
-- No SELECT policy for authenticated users — they cannot read logs

-- Index for querying by severity and recency
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_source ON public.error_logs(source);

-- Auto-cleanup: delete logs older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.error_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

-- Schedule cleanup via pg_cron if available, otherwise call manually.
-- On Supabase Pro plans, uncomment the following:
-- SELECT cron.schedule('cleanup-error-logs', '0 3 * * *', 'SELECT public.cleanup_old_error_logs()');

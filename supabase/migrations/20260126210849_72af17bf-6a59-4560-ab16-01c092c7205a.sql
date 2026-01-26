-- Create enum for return status
CREATE TYPE public.return_status AS ENUM (
  'initiated',
  'label_created',
  'in_transit',
  'delivered',
  'awaiting_refund',
  'refunded',
  'disputed'
);

-- Create enum for tracking status
CREATE TYPE public.tracking_status AS ENUM (
  'pre_transit',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception',
  'unknown'
);

-- Create profiles table for user settings
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  default_refund_threshold_days INTEGER DEFAULT 14,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  support_email TEXT,
  support_url TEXT,
  average_refund_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create returns table
CREATE TABLE public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  vendor_name TEXT NOT NULL,
  order_number TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  expected_refund_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status public.return_status DEFAULT 'initiated' NOT NULL,
  return_initiated_at TIMESTAMP WITH TIME ZONE,
  label_created_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  refund_received_at TIMESTAMP WITH TIME ZONE,
  refund_threshold_days INTEGER DEFAULT 14,
  source_email_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tracking table
CREATE TABLE public.tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE NOT NULL,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  status public.tracking_status DEFAULT 'unknown' NOT NULL,
  last_location TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  last_update TIMESTAMP WITH TIME ZONE,
  tracking_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create refunds table
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_id TEXT,
  bank_account_id TEXT,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_by_user BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create connected_accounts table for Gmail and bank connections
CREATE TABLE public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('gmail', 'plaid')),
  account_identifier TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  institution_name TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('delivery', 'refund_received', 'refund_overdue', 'action_required', 'info')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Vendors policies (public read, system write)
CREATE POLICY "Anyone can view vendors"
  ON public.vendors FOR SELECT
  USING (true);

-- Returns policies
CREATE POLICY "Users can view their own returns"
  ON public.returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own returns"
  ON public.returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own returns"
  ON public.returns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own returns"
  ON public.returns FOR DELETE
  USING (auth.uid() = user_id);

-- Tracking policies (through return ownership)
CREATE POLICY "Users can view tracking for their returns"
  ON public.tracking FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.returns
    WHERE returns.id = tracking.return_id
    AND returns.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert tracking for their returns"
  ON public.tracking FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.returns
    WHERE returns.id = tracking.return_id
    AND returns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tracking for their returns"
  ON public.tracking FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.returns
    WHERE returns.id = tracking.return_id
    AND returns.user_id = auth.uid()
  ));

-- Refunds policies (through return ownership)
CREATE POLICY "Users can view refunds for their returns"
  ON public.refunds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.returns
    WHERE returns.id = refunds.return_id
    AND returns.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert refunds for their returns"
  ON public.refunds FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.returns
    WHERE returns.id = refunds.return_id
    AND returns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update refunds for their returns"
  ON public.refunds FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.returns
    WHERE returns.id = refunds.return_id
    AND returns.user_id = auth.uid()
  ));

-- Connected accounts policies
CREATE POLICY "Users can view their connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their connected accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracking_updated_at
  BEFORE UPDATE ON public.tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_returns_user_id ON public.returns(user_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_tracking_return_id ON public.tracking(return_id);
CREATE INDEX idx_refunds_return_id ON public.refunds(return_id);
CREATE INDEX idx_connected_accounts_user_id ON public.connected_accounts(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
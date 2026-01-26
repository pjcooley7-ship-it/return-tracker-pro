export type ReturnStatus = 
  | 'initiated'
  | 'label_created'
  | 'in_transit'
  | 'delivered'
  | 'awaiting_refund'
  | 'refunded'
  | 'disputed';

export type TrackingStatus = 
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'unknown';

export interface ReturnItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface Return {
  id: string;
  user_id: string;
  vendor_id?: string;
  vendor_name: string;
  order_number?: string;
  items: ReturnItem[];
  expected_refund_amount?: number;
  currency: string;
  status: ReturnStatus;
  return_initiated_at?: string;
  label_created_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  refund_received_at?: string;
  refund_threshold_days: number;
  source_email_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  tracking?: Tracking;
}

export interface Tracking {
  id: string;
  return_id: string;
  carrier: string;
  tracking_number: string;
  status: TrackingStatus;
  last_location?: string;
  estimated_delivery?: string;
  last_update?: string;
  tracking_history: TrackingEvent[];
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  description?: string;
}

export interface Refund {
  id: string;
  return_id: string;
  amount: number;
  currency: string;
  transaction_id?: string;
  bank_account_id?: string;
  matched_at: string;
  confirmed_by_user: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  default_refund_threshold_days: number;
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  account_type: 'gmail' | 'plaid';
  account_identifier?: string;
  institution_name?: string;
  last_sync_at?: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  return_id?: string;
  title: string;
  message: string;
  type: 'delivery' | 'refund_received' | 'refund_overdue' | 'action_required' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalReturns: number;
  activeReturns: number;
  awaitingRefund: number;
  totalRecovered: number;
  avgRefundDays: number;
}

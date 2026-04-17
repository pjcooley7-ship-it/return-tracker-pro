import { Package, Truck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReturnStatus, TrackingStatus } from '@/lib/types';

interface ReturnStatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  progress: number;
}

interface TrackingStatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const returnStatusConfig: Record<ReturnStatus, ReturnStatusConfig> = {
  initiated:       { label: 'Initiated',        icon: Package,       color: 'bg-muted text-muted-foreground', progress: 10  },
  label_created:   { label: 'Label Created',    icon: Package,       color: 'bg-muted text-muted-foreground', progress: 25  },
  in_transit:      { label: 'In Transit',       icon: Truck,         color: 'status-active',                  progress: 50  },
  delivered:       { label: 'Delivered',        icon: CheckCircle,   color: 'status-awaiting',                progress: 75  },
  awaiting_refund: { label: 'Awaiting Refund',  icon: Clock,         color: 'status-awaiting',                progress: 85  },
  refunded:        { label: 'Refunded',         icon: CheckCircle,   color: 'status-completed',               progress: 100 },
  disputed:        { label: 'Disputed',         icon: AlertTriangle, color: 'status-disputed',                progress: 0   },
};

export const trackingStatusConfig: Record<TrackingStatus, TrackingStatusConfig> = {
  pre_transit:      { label: 'Pre-Transit',       icon: Package,       color: 'bg-muted text-muted-foreground' },
  in_transit:       { label: 'In Transit',        icon: Package,       color: 'status-active'                  },
  out_for_delivery: { label: 'Out for Delivery',  icon: Package,       color: 'status-active'                  },
  delivered:        { label: 'Delivered',         icon: CheckCircle,   color: 'status-completed'               },
  exception:        { label: 'Exception',         icon: AlertTriangle, color: 'status-disputed'                },
  unknown:          { label: 'Unknown',           icon: Package,       color: 'bg-muted text-muted-foreground' },
};

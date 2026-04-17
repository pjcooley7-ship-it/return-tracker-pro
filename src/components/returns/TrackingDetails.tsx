import { format } from 'date-fns';
import { RefreshCw, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTracking } from '@/hooks/useTracking';
import { trackingStatusConfig } from '@/lib/statusConfig';
import type { Tracking } from '@/lib/types';

interface TrackingDetailsProps {
  tracking: Tracking;
}

export function TrackingDetails({ tracking }: TrackingDetailsProps) {
  const { refreshTracking } = useTracking();
  const config = trackingStatusConfig[tracking.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={cn("gap-1", config.color)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            <span className="text-sm text-muted-foreground">{tracking.carrier}</span>
          </div>
          <p className="font-mono text-sm">{tracking.tracking_number}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshTracking.mutate(tracking.tracking_number)}
          disabled={refreshTracking.isPending}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshTracking.isPending && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {tracking.last_location && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {tracking.last_location}
        </div>
      )}

      {tracking.estimated_delivery && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Estimated delivery: {format(new Date(tracking.estimated_delivery), 'PPP')}</span>
        </div>
      )}

      {tracking.tracking_history && tracking.tracking_history.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium">Tracking History</h4>
          <div className="space-y-2">
            {tracking.tracking_history.slice(0, 5).map((event, index) => (
              <div key={index} className="flex gap-3 text-sm border-l-2 border-muted pl-3 py-1">
                <div className="min-w-[100px] text-muted-foreground">
                  {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                </div>
                <div>
                  <p>{event.description || event.status}</p>
                  {event.location && (
                    <p className="text-muted-foreground text-xs">{event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tracking.last_update && (
        <p className="text-xs text-muted-foreground">
          Last updated: {format(new Date(tracking.last_update), 'PPP p')}
        </p>
      )}
    </div>
  );
}

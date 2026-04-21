import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { returnStatusConfig } from '@/lib/statusConfig';
import type { Return } from '@/lib/types';

interface ReturnCardProps {
  returnItem: Return;
  onClick?: () => void;
}

export function ReturnCard({ returnItem, onClick }: ReturnCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const config = returnStatusConfig[returnItem.status];
  const StatusIcon = config.icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setDetailsOpen(true);
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string | null) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getDaysUntilRefundDue = () => {
    if (!returnItem.delivered_at || returnItem.refund_threshold_days == null) return null;
    const deliveredDate = new Date(returnItem.delivered_at);
    const dueDate = new Date(deliveredDate);
    dueDate.setDate(dueDate.getDate() + returnItem.refund_threshold_days);
    const now = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const daysUntilDue = getDaysUntilRefundDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5",
          isOverdue && "border-destructive"
        )}
        onClick={handleClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{returnItem.vendor_name}</h3>
              {returnItem.order_number && (
                <p className="text-sm text-muted-foreground">
                  Order #{returnItem.order_number}
                </p>
              )}
            </div>
            <Badge className={cn("gap-1", config.color)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="text-sm">
            {returnItem.items.length > 0 ? (
              <span>
                {returnItem.items.map(i => i.name).slice(0, 2).join(', ')}
                {returnItem.items.length > 2 && ` +${returnItem.items.length - 2} more`}
              </span>
            ) : (
              <span className="text-muted-foreground">No items listed</span>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <Progress value={config.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Initiated</span>
              <span>Refunded</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Expected: </span>
              <span className="font-medium">
                {formatCurrency(returnItem.expected_refund_amount, returnItem.currency)}
              </span>
            </div>
            
            {returnItem.status === 'awaiting_refund' && daysUntilDue !== null && (
              <div className={cn(
                "text-sm font-medium",
                isOverdue ? "text-destructive" : daysUntilDue <= 3 ? "text-[hsl(var(--warning))]" : "text-muted-foreground"
              )}>
                {isOverdue 
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : `${daysUntilDue} days left`
                }
              </div>
            )}

            {returnItem.tracking?.estimated_delivery && returnItem.status === 'in_transit' && (
              <div className="text-sm text-muted-foreground">
                ETA: {format(new Date(returnItem.tracking.estimated_delivery), 'MMM d')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <ReturnDetailsDialog 
        returnItem={returnItem} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
    </>
  );
}

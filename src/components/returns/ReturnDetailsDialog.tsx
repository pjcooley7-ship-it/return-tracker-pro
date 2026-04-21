import { format } from 'date-fns';
import { Package, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AddTrackingDialog } from './AddTrackingDialog';
import { TrackingDetails } from './TrackingDetails';
import { useReturns } from '@/hooks/useReturns';
import { toast } from 'sonner';
import { returnStatusConfig } from '@/lib/statusConfig';
import type { Return } from '@/lib/types';

interface ReturnDetailsDialogProps {
  returnItem: Return | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnDetailsDialog({ returnItem, open, onOpenChange }: ReturnDetailsDialogProps) {
  const { deleteReturn, updateReturn } = useReturns();

  if (!returnItem) return null;

  const config = returnStatusConfig[returnItem.status];

  const formatCurrency = (amount: number | undefined, currency: string | null) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this return?')) return;
    
    try {
      await deleteReturn.mutateAsync(returnItem.id);
      toast.success('Return deleted', { description: 'The return has been removed.' });
      onOpenChange(false);
    } catch (error) {
      toast.error('Error', { description: 'Failed to delete return.' });
    }
  };

  const handleMarkAwaitingRefund = async () => {
    try {
      await updateReturn.mutateAsync({
        id: returnItem.id,
        status: 'awaiting_refund',
      });
      toast.success('Status updated', { description: 'Return marked as awaiting refund.' });
    } catch (error) {
      toast.error('Error', { description: 'Failed to update status.' });
    }
  };

  const handleMarkRefunded = async () => {
    try {
      await updateReturn.mutateAsync({
        id: returnItem.id,
        status: 'refunded',
        refund_received_at: new Date().toISOString(),
      });
      toast.success('Status updated', { description: 'Return marked as refunded.' });
    } catch (error) {
      toast.error('Error', { description: 'Failed to update status.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>{returnItem.vendor_name}</DialogTitle>
              <DialogDescription>
                {returnItem.order_number ? `Order #${returnItem.order_number}` : 'No order number'}
              </DialogDescription>
            </div>
            <Badge className={cn(config.color)}>{config.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items */}
          <div>
            <h4 className="text-sm font-medium mb-2">Items</h4>
            {returnItem.items.length > 0 ? (
              <div className="space-y-1">
                {returnItem.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm bg-muted px-3 py-2 rounded-md">
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items listed</p>
            )}
          </div>

          <Separator />

          {/* Amount */}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Expected Refund</span>
            <span className="font-medium">
              {formatCurrency(returnItem.expected_refund_amount, returnItem.currency)}
            </span>
          </div>

          {/* Dates */}
          <div className="space-y-2 text-sm">
            {returnItem.return_initiated_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initiated</span>
                <span>{format(new Date(returnItem.return_initiated_at), 'PPP')}</span>
              </div>
            )}
            {returnItem.delivered_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <span>{format(new Date(returnItem.delivered_at), 'PPP')}</span>
              </div>
            )}
            {returnItem.refund_received_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refunded</span>
                <span>{format(new Date(returnItem.refund_received_at), 'PPP')}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Tracking */}
          <div>
            <h4 className="text-sm font-medium mb-2">Tracking</h4>
            {returnItem.tracking ? (
              <TrackingDetails tracking={returnItem.tracking} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 border border-dashed rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No tracking information</p>
                <AddTrackingDialog returnId={returnItem.id} />
              </div>
            )}
          </div>

          {returnItem.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{returnItem.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {returnItem.status === 'delivered' && (
              <Button variant="outline" size="sm" onClick={handleMarkAwaitingRefund}>
                Mark Awaiting Refund
              </Button>
            )}
            {(returnItem.status === 'delivered' || returnItem.status === 'awaiting_refund') && (
              <Button variant="outline" size="sm" onClick={handleMarkRefunded}>
                Mark Refunded
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

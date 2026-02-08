import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReturns } from '@/hooks/useReturns';
import { toast } from 'sonner';

const returnSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required').max(100),
  order_number: z.string().max(50).optional(),
  expected_refund_amount: z.string().optional(),
  currency: z.string().default('CHF'),
  refund_threshold_days: z.string().default('14'),
  notes: z.string().max(500).optional(),
});

type ReturnFormData = z.infer<typeof returnSchema>;

interface AddReturnDialogProps {
  children?: React.ReactNode;
}

export function AddReturnDialog({ children }: AddReturnDialogProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ name: string; quantity: number }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const { createReturn } = useReturns();

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      vendor_name: '',
      order_number: '',
      expected_refund_amount: '',
      currency: 'CHF',
      refund_threshold_days: '14',
      notes: '',
    },
  });

  const addItem = () => {
    if (newItemName.trim()) {
      setItems([...items, { name: newItemName.trim(), quantity: 1 }]);
      setNewItemName('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReturnFormData) => {
    try {
      await createReturn.mutateAsync({
        vendor_name: data.vendor_name,
        order_number: data.order_number || undefined,
        expected_refund_amount: data.expected_refund_amount 
          ? parseFloat(data.expected_refund_amount) 
          : undefined,
        currency: data.currency,
        refund_threshold_days: parseInt(data.refund_threshold_days),
        notes: data.notes || undefined,
        items,
        return_initiated_at: new Date().toISOString(),
      });

      toast.success('Return added', { description: 'Your return has been added successfully.' });

      setOpen(false);
      form.reset();
      setItems([]);
    } catch (error) {
      toast.error('Error', { description: 'Failed to add return. Please try again.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Return
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Return</DialogTitle>
          <DialogDescription>
            Manually add a return to track. You can also connect your email for automatic detection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vendor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor / Retailer *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Amazon, Target, Walmart" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Items */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Items</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                />
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {items.length > 0 && (
                <div className="space-y-1">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                      <span>{item.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_refund_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Refund</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CHF">CHF</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="refund_threshold_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Alert Threshold</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7">7 days after delivery</SelectItem>
                      <SelectItem value="14">14 days after delivery</SelectItem>
                      <SelectItem value="21">21 days after delivery</SelectItem>
                      <SelectItem value="30">30 days after delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReturn.isPending}>
                {createReturn.isPending ? 'Adding...' : 'Add Return'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

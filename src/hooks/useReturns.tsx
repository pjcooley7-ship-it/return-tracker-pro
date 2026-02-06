import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Return, DashboardStats, ReturnItem, Tracking, TrackingEvent } from '@/lib/types';
import type { Json } from '@/integrations/supabase/types';

export function useReturns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const returnsQuery = useQuery({
    queryKey: ['returns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          tracking (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(r => {
        const trackingData = r.tracking?.[0];
        return {
          ...r,
          items: (r.items as unknown as ReturnItem[]) || [],
          tracking: trackingData ? {
            ...trackingData,
            tracking_history: (trackingData.tracking_history as unknown as TrackingEvent[]) || [],
          } as Tracking : undefined,
        } as Return;
      });
    },
    enabled: !!user,
  });

  const createReturn = useMutation({
    mutationFn: async (returnData: Partial<Return>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('returns')
        .insert({
          user_id: user.id,
          vendor_name: returnData.vendor_name!,
          order_number: returnData.order_number,
          items: (returnData.items || []) as unknown as Json,
          expected_refund_amount: returnData.expected_refund_amount,
          currency: returnData.currency || 'USD',
          status: returnData.status || 'initiated',
          return_initiated_at: returnData.return_initiated_at,
          refund_threshold_days: returnData.refund_threshold_days || 14,
          notes: returnData.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  const updateReturn = useMutation({
    mutationFn: async ({ id, items, tracking, ...updates }: Partial<Return> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (items) {
        updateData.items = items as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('returns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('returns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  return {
    returns: returnsQuery.data || [],
    isLoading: returnsQuery.isLoading,
    error: returnsQuery.error,
    createReturn,
    updateReturn,
    deleteReturn,
  };
}

export function useDashboardStats() {
  const { returns, isLoading } = useReturns();

  const stats: DashboardStats = {
    totalReturns: returns.length,
    activeReturns: returns.filter(r => 
      ['initiated', 'label_created', 'in_transit'].includes(r.status)
    ).length,
    awaitingRefund: returns.filter(r => 
      ['delivered', 'awaiting_refund'].includes(r.status)
    ).length,
    totalRecovered: returns
      .filter(r => r.status === 'refunded')
      .reduce((sum, r) => sum + (r.expected_refund_amount || 0), 0),
    avgRefundDays: calculateAvgRefundDays(returns),
  };

  return { stats, isLoading };
}

function calculateAvgRefundDays(returns: Return[]): number {
  const refundedReturns = returns.filter(
    r => r.status === 'refunded' && r.delivered_at && r.refund_received_at
  );
  
  if (refundedReturns.length === 0) return 0;

  const totalDays = refundedReturns.reduce((sum, r) => {
    // Safe: filter above guarantees both dates exist
    const delivered = new Date(r.delivered_at as string);
    const refunded = new Date(r.refund_received_at as string);
    const days = Math.ceil((refunded.getTime() - delivered.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);

  return Math.round(totalDays / refundedReturns.length);
}

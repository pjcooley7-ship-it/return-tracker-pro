import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateTrackingParams {
  return_id: string;
  tracking_number: string;
  carrier: string;
}

export function useTracking() {
  const queryClient = useQueryClient();

  const createTracking = useMutation({
    mutationFn: async ({ return_id, tracking_number, carrier }: CreateTrackingParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: {
          action: 'create',
          return_id,
          tracking_number,
          carrier,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast({
        title: 'Tracking added',
        description: 'Your tracking number has been added and will be monitored.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add tracking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const refreshTracking = useMutation({
    mutationFn: async (tracking_number: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: {
          action: 'refresh',
          tracking_number,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      if (data.success) {
        toast({
          title: 'Tracking updated',
          description: 'Latest tracking information has been fetched.',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to refresh tracking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createTracking,
    refreshTracking,
  };
}

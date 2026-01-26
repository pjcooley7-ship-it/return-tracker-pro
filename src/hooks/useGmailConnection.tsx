import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GmailAccount {
  id: string;
  account_identifier: string | null;
  is_active: boolean | null;
  last_sync_at: string | null;
}

interface DetectedReturn {
  vendor: string;
  orderNumber: string | null;
  amount: number | null;
  subject: string;
  date: string;
  emailId: string;
  tracking: { carrier: string; number: string } | null;
}

export interface ScannedEmail {
  subject: string;
  from: string;
  date: string;
  emailId: string;
  isReturnRelated: boolean;
  userOverride?: boolean;
  detectedVendor: string | null;
  reason: string;
}

export function useGmailConnection() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [gmailAccount, setGmailAccount] = useState<GmailAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedReturns, setDetectedReturns] = useState<DetectedReturn[]>([]);
  const [scannedEmails, setScannedEmails] = useState<ScannedEmail[]>([]);
  const [lastScanStats, setLastScanStats] = useState<{ scannedCount: number; processedCount: number } | null>(null);

  // Fetch connected Gmail account
  const fetchGmailAccount = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('connected_accounts')
        .select('id, account_identifier, is_active, last_sync_at')
        .eq('user_id', session.user.id)
        .eq('account_type', 'gmail')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Gmail account:', error);
      }
      
      setGmailAccount(data);
    } catch (error) {
      console.error('Error fetching Gmail account:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchGmailAccount();
  }, [fetchGmailAccount]);

  // Connect Gmail - initiates OAuth flow
  const connectGmail = async () => {
    if (!session?.access_token) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Use direct fetch to avoid Supabase client issues
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Connection Failed',
        description: `Could not start Gmail connection: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Gmail
  const disconnectGmail = async () => {
    if (!gmailAccount) return;

    try {
      const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('id', gmailAccount.id);

      if (error) throw error;

      setGmailAccount(null);
      toast({
        title: 'Disconnected',
        description: 'Gmail account has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        title: 'Error',
        description: 'Could not disconnect Gmail. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Scan emails for returns
  const scanEmails = async (scanRange: string = '30d') => {
    if (!session?.access_token || !gmailAccount?.is_active) {
      toast({
        title: 'Error',
        description: 'Please connect Gmail first',
        variant: 'destructive',
      });
      return;
    }

    // Extract days from range (e.g., '30d' -> 30)
    const daysMatch = scanRange.match(/^(\d+)d$/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 30;

    setIsScanning(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-scan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ days }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.returns) {
        setDetectedReturns(data.returns);
      }
      if (data?.scannedEmails) {
        setScannedEmails(data.scannedEmails);
      }
      if (data?.scannedCount !== undefined) {
        setLastScanStats({
          scannedCount: data.scannedCount,
          processedCount: data.processedCount || 0,
        });
      }
      
      toast({
        title: 'Scan Complete',
        description: `Found ${data.returns?.length || 0} potential returns in ${data.scannedCount || 0} emails.`,
      });

      // Refresh account to get updated last_sync_at
      fetchGmailAccount();
    } catch (error) {
      console.error('Error scanning emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Scan Failed',
        description: `Could not scan emails: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
    setIsScanning(false);
    }
  };

  // Toggle return status for a scanned email
  const toggleReturnStatus = (emailId: string) => {
    setScannedEmails((prev) =>
      prev.map((email) =>
        email.emailId === emailId
          ? {
              ...email,
              isReturnRelated: !email.isReturnRelated,
              userOverride: true,
              reason: !email.isReturnRelated
                ? 'Manually marked as return'
                : 'Manually marked as not return',
            }
          : email
      )
    );
  };

  return {
    gmailAccount,
    isLoading,
    isConnecting,
    isScanning,
    detectedReturns,
    scannedEmails,
    lastScanStats,
    connectGmail,
    disconnectGmail,
    scanEmails,
    toggleReturnStatus,
    refetch: fetchGmailAccount,
  };
}

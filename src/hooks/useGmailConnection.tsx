import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

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
  currency: string | null;
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
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const [gmailAccount, setGmailAccount] = useState<GmailAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        logger.error('Error fetching Gmail account', { source: 'useGmailConnection', metadata: { error } });
      }

      setGmailAccount(data);
    } catch (error) {
      logger.error('Error fetching Gmail account', { source: 'useGmailConnection', metadata: { error } });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchGmailAccount();
  }, [fetchGmailAccount]);

  // Connect Gmail via custom OAuth edge function (gmail-auth)
  // The edge function returns a Google OAuth URL with gmail.readonly scope.
  // After user consents, gmail-callback stores tokens in connected_accounts.
  const connectGmail = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in first');
      return;
    }
    setIsConnecting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-auth`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to start OAuth (${response.status})`);
      }
      const { authUrl } = await response.json();
      if (!authUrl) throw new Error('No auth URL returned');
      // Redirect to Google; isConnecting stays true intentionally
      window.location.href = authUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error connecting Gmail', { source: 'useGmailConnection', metadata: { error: err } });
      toast.error('Connection Failed', { description: msg });
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
      toast.success('Disconnected', { description: 'Gmail account has been disconnected.' });
    } catch (error) {
      logger.error('Error disconnecting Gmail', { source: 'useGmailConnection', metadata: { error } });
      toast.error('Error', { description: 'Could not disconnect Gmail. Please try again.' });
    }
  };

  // Scan emails for returns
  const scanEmails = useCallback(async (scanRange: string = '30d') => {
    if (!session?.access_token || !gmailAccount?.is_active) {
      toast.error('Error', { description: 'Please connect Gmail first' });
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

      toast.success('Scan Complete', {
        description: `Found ${data.returns?.length || 0} potential returns in ${data.scannedCount || 0} emails.`,
      });

      // Refresh account to get updated last_sync_at
      fetchGmailAccount();
    } catch (error) {
      logger.error('Error scanning emails', { source: 'useGmailConnection', metadata: { error } });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Check if this is an expired/permission connection error
      if (errorMessage.includes('expired') || errorMessage.includes('reconnect') || errorMessage.includes('permissions')) {
        // Refresh account state to reflect inactive status
        await fetchGmailAccount();
      }

      toast.error('Scan Failed', { description: errorMessage });
    } finally {
    setIsScanning(false);
    }
  }, [session?.access_token, gmailAccount?.is_active, fetchGmailAccount]);

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

  // Set vendor name for a scanned email (user-provided)
  const setEmailVendor = (emailId: string, vendorName: string) => {
    setScannedEmails((prev) =>
      prev.map((email) =>
        email.emailId === emailId
          ? { ...email, detectedVendor: vendorName || null }
          : email
      )
    );
  };

  // Save detected returns to database
  const saveDetectedReturns = async () => {
    if (!user) {
      toast.error('Error', { description: 'Please sign in first' });
      return 0;
    }

    // Get returns that are marked as return-related AND have a vendor (detected or user-provided)
    const returnsToSave = scannedEmails
      .filter(email => email.isReturnRelated && email.detectedVendor)
      .map(email => {
        const detectedReturn = detectedReturns.find(r => r.emailId === email.emailId);
        return {
          email,
          details: detectedReturn,
        };
      });

    const missingVendorCount = scannedEmails.filter(
      email => email.isReturnRelated && !email.detectedVendor
    ).length;

    if (returnsToSave.length === 0) {
      toast('No returns to save', {
        description: missingVendorCount > 0
          ? `${missingVendorCount} return${missingVendorCount !== 1 ? 's' : ''} need a vendor name before saving.`
          : 'No valid returns were detected. Adjust selections and try again.',
      });
      return 0;
    }

    setIsSaving(true);

    try {
      let savedCount = 0;

      for (const item of returnsToSave) {
        // Check if already exists by email ID
        const { data: existing } = await supabase
          .from('returns')
          .select('id')
          .eq('user_id', user.id)
          .eq('source_email_id', item.email.emailId)
          .maybeSingle();

        if (existing) {
          // Skip duplicates
          continue;
        }

        const { error } = await supabase
          .from('returns')
          .insert({
            user_id: user.id,
            vendor_name: item.email.detectedVendor ?? 'Unknown',
            order_number: item.details?.orderNumber || null,
            expected_refund_amount: item.details?.amount || null,
            currency: item.details?.currency || 'CHF',
            status: 'initiated',
            return_initiated_at: item.details?.date ? new Date(item.details.date).toISOString() : new Date().toISOString(),
            source_email_id: item.email.emailId,
            items: item.email.subject ? [{ name: item.email.subject.substring(0, 100), quantity: 1 }] : [],
            refund_threshold_days: 14,
          });

        if (!error) {
          savedCount++;
        } else {
          logger.error('Error saving return', { source: 'useGmailConnection', metadata: { error } });
        }
      }

      // Invalidate returns query to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ['returns'] });

      toast.success('Returns Saved', {
        description: `${savedCount} return${savedCount !== 1 ? 's' : ''} added to your dashboard.`,
      });

      return savedCount;
    } catch (error) {
      logger.error('Error saving returns', { source: 'useGmailConnection', metadata: { error } });
      toast.error('Error', { description: 'Could not save returns. Please try again.' });
      return 0;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    gmailAccount,
    isLoading,
    isConnecting,
    isScanning,
    isSaving,
    detectedReturns,
    scannedEmails,
    lastScanStats,
    connectGmail,
    disconnectGmail,
    scanEmails,
    toggleReturnStatus,
    setEmailVendor,
    saveDetectedReturns,
    refetch: fetchGmailAccount,
  };
}

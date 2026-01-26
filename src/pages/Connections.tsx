import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, Check, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { useGmailConnection } from '@/hooks/useGmailConnection';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ScannedEmailsPanel } from '@/components/connections/ScannedEmailsPanel';

export default function Connections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    gmailAccount,
    isLoading,
    isConnecting,
    isScanning,
    scannedEmails,
    lastScanStats,
    connectGmail,
    disconnectGmail,
    scanEmails,
    refetch,
  } = useGmailConnection();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'gmail_connected') {
      toast({
        title: 'Gmail Connected!',
        description: 'Your Gmail account has been successfully connected.',
      });
      refetch();
      setSearchParams({});
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'You denied the Gmail connection request.',
        invalid_request: 'Invalid OAuth request. Please try again.',
        invalid_state: 'Security validation failed. Please try again.',
        expired: 'The connection request expired. Please try again.',
        token_exchange_failed: 'Could not complete authentication. Please try again.',
        db_error: 'Could not save connection. Please try again.',
        internal_error: 'An unexpected error occurred. Please try again.',
      };

      toast({
        title: 'Connection Failed',
        description: errorMessages[error] || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast, refetch]);

  const isGmailConnected = gmailAccount?.is_active;

  return (
    <DashboardLayout title="Connected Accounts">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Connect your email and bank accounts for automatic return detection and refund tracking
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gmail Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <Mail className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gmail</CardTitle>
                  <CardDescription>
                    {isGmailConnected
                      ? gmailAccount.account_identifier
                      : 'Scan emails for purchases and returns'}
                  </CardDescription>
                </div>
              </div>
              {isLoading ? (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading
                </Badge>
              ) : isGmailConnected ? (
                <Badge variant="default" className="gap-1 bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGmailConnected ? (
              <div className="space-y-4">
                {gmailAccount.last_sync_at && (
                  <p className="text-sm text-muted-foreground">
                    Last synced {formatDistanceToNow(new Date(gmailAccount.last_sync_at), { addSuffix: true })}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={scanEmails}
                    disabled={isScanning}
                    className="flex-1"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Emails
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={disconnectGmail}
                    title="Disconnect Gmail"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Gmail to automatically detect purchase confirmations, return labels, and shipping updates.
                </p>
                <Button
                  className="w-full"
                  onClick={connectGmail}
                  disabled={isConnecting || isLoading}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Gmail'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bank/Plaid Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--success))]/10">
                  <Building2 className="h-6 w-6 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank Account</CardTitle>
                  <CardDescription>Track refunds automatically</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your bank or credit card to automatically detect when refunds are posted to your account.
            </p>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scanned Emails Results */}
      <ScannedEmailsPanel scannedEmails={scannedEmails} lastScanStats={lastScanStats} />

      <Card className="mt-6 bg-muted/50">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Your data is secure</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We use industry-standard OAuth for email and Plaid for bank connections. 
              We never store your passwords and you can disconnect anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

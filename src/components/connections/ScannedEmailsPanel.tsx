import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, AlertCircle } from 'lucide-react';

interface ScannedEmail {
  subject: string;
  from: string;
  date: string;
  emailId: string;
  isReturnRelated: boolean;
  detectedVendor: string | null;
  reason: string;
}

interface ScannedEmailsPanelProps {
  scannedEmails: ScannedEmail[];
  lastScanStats: { scannedCount: number; processedCount: number } | null;
}

export function ScannedEmailsPanel({ scannedEmails, lastScanStats }: ScannedEmailsPanelProps) {
  if (scannedEmails.length === 0) {
    return null;
  }

  const returnsFound = scannedEmails.filter(e => e.isReturnRelated && e.detectedVendor).length;
  const returnRelatedNoVendor = scannedEmails.filter(e => e.isReturnRelated && !e.detectedVendor).length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Last Scan Results</CardTitle>
        <CardDescription>
          {lastScanStats && (
            <>
              Searched {lastScanStats.scannedCount} emails, processed {lastScanStats.processedCount} in detail.
              {' '}Found {returnsFound} confirmed returns
              {returnRelatedNoVendor > 0 && `, ${returnRelatedNoVendor} return-related but unrecognized vendor`}.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {scannedEmails.map((email) => (
              <div
                key={email.emailId}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="mt-0.5">
                  {email.isReturnRelated && email.detectedVendor ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--success))]/20">
                      <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                    </div>
                  ) : email.isReturnRelated ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20">
                      <AlertCircle className="h-4 w-4 text-warning" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={email.subject}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={email.from}>
                    {email.from}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {email.detectedVendor && (
                      <Badge variant="secondary" className="text-xs">
                        {email.detectedVendor}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {email.reason}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

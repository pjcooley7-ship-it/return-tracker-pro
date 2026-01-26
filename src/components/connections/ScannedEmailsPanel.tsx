import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Check, X, AlertCircle } from 'lucide-react';

export interface ScannedEmail {
  subject: string;
  from: string;
  date: string;
  emailId: string;
  isReturnRelated: boolean;
  userOverride?: boolean; // User manually toggled this
  detectedVendor: string | null;
  reason: string;
}

interface ScannedEmailsPanelProps {
  scannedEmails: ScannedEmail[];
  lastScanStats: { scannedCount: number; processedCount: number } | null;
  onToggleReturnStatus: (emailId: string) => void;
}

export function ScannedEmailsPanel({ scannedEmails, lastScanStats, onToggleReturnStatus }: ScannedEmailsPanelProps) {
  if (scannedEmails.length === 0) {
    return null;
  }

  const returnsFound = scannedEmails.filter(e => e.isReturnRelated && e.detectedVendor).length;
  const returnRelatedNoVendor = scannedEmails.filter(e => e.isReturnRelated && !e.detectedVendor).length;
  const userOverrideCount = scannedEmails.filter(e => e.userOverride).length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Last Scan Results</CardTitle>
        <CardDescription>
          {lastScanStats && (
            <>
              Searched {lastScanStats.scannedCount} emails, processed {lastScanStats.processedCount} in detail.
              {' '}Found {returnsFound} confirmed returns
              {returnRelatedNoVendor > 0 && `, ${returnRelatedNoVendor} return-related but unrecognized vendor`}
              {userOverrideCount > 0 && ` (${userOverrideCount} manually adjusted)`}.
            </>
          )}
          <span className="block mt-1 text-xs">
            Toggle the switch to mark emails as return-related or not.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {scannedEmails.map((email) => (
              <div
                key={email.emailId}
                className={`flex items-start gap-3 p-3 rounded-lg border bg-card ${email.userOverride ? 'ring-2 ring-primary/30' : ''}`}
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
                    {email.userOverride && (
                      <Badge variant="outline" className="text-xs">
                        Manually adjusted
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {email.reason}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Switch
                    checked={email.isReturnRelated}
                    onCheckedChange={() => onToggleReturnStatus(email.emailId)}
                    aria-label={`Mark as ${email.isReturnRelated ? 'not' : ''} return-related`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {email.isReturnRelated ? 'Return' : 'Not return'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

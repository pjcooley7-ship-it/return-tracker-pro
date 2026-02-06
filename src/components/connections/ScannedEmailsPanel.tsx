import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Check, X, AlertCircle, Save, Loader2 } from 'lucide-react';

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

interface ScannedEmailsPanelProps {
  scannedEmails: ScannedEmail[];
  lastScanStats: { scannedCount: number; processedCount: number } | null;
  onToggleReturnStatus: (emailId: string) => void;
  onSetEmailVendor: (emailId: string, vendorName: string) => void;
  onSaveReturns: () => Promise<number>;
  isSaving: boolean;
}

export function ScannedEmailsPanel({
  scannedEmails,
  lastScanStats,
  onToggleReturnStatus,
  onSetEmailVendor,
  onSaveReturns,
  isSaving,
}: ScannedEmailsPanelProps) {
  if (scannedEmails.length === 0) {
    return null;
  }

  const saveable = scannedEmails.filter(e => e.isReturnRelated && e.detectedVendor);
  const needsVendor = scannedEmails.filter(e => e.isReturnRelated && !e.detectedVendor);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Last Scan Results</CardTitle>
            <CardDescription>
              {lastScanStats && (
                <>
                  Searched {lastScanStats.scannedCount} emails, processed {lastScanStats.processedCount} in detail.
                  {' '}Found {saveable.length} saveable return{saveable.length !== 1 ? 's' : ''}
                  {needsVendor.length > 0 && (
                    <span className="text-warning font-medium">
                      {' '}&mdash; {needsVendor.length} need a vendor name
                    </span>
                  )}
                  .
                </>
              )}
              <span className="block mt-1 text-xs">
                Toggle the switch to mark emails as returns. Type a vendor name for unrecognized ones, then click Save.
              </span>
            </CardDescription>
          </div>
          {saveable.length > 0 && (
            <Button onClick={onSaveReturns} disabled={isSaving} className="shrink-0">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save {saveable.length} Return{saveable.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
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
                  {/* Inline vendor input for return-related emails with no detected vendor */}
                  {email.isReturnRelated && !email.detectedVendor && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter vendor name (e.g. Digitec, Zalando)"
                        className="h-8 text-sm"
                        onChange={(e) => onSetEmailVendor(email.emailId, e.target.value)}
                      />
                    </div>
                  )}
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

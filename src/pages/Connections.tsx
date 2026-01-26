import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, Check, AlertCircle } from 'lucide-react';

export default function Connections() {
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
                  <CardDescription>Scan emails for purchases and returns</CardDescription>
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
              Connect your Gmail to automatically detect purchase confirmations, return labels, and shipping updates.
            </p>
            <Button className="w-full">
              Connect Gmail
            </Button>
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
            <Button className="w-full">
              Connect Bank Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Note */}
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

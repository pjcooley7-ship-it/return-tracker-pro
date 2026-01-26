import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Package, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Placeholder data - will be replaced with real data from database
const mockNotifications = [
  {
    id: '1',
    title: 'Return Delivered',
    message: 'Your Amazon return has been delivered to the warehouse.',
    type: 'delivery' as const,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Refund Received',
    message: 'You received a $49.99 refund from Target.',
    type: 'refund_received' as const,
    is_read: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const typeConfig = {
  delivery: { icon: Package, color: 'bg-primary/10 text-primary' },
  refund_received: { icon: DollarSign, color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
  refund_overdue: { icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
  action_required: { icon: AlertTriangle, color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
  info: { icon: Info, color: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  return (
    <DashboardLayout title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Stay updated on your return status and refunds
        </p>
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      <div className="space-y-3">
        {mockNotifications.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No notifications</CardTitle>
              <CardDescription>
                You're all caught up! Notifications about your returns will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          mockNotifications.map(notification => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            
            return (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-colors",
                  !notification.is_read && "bg-primary/5"
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{notification.title}</h3>
                      {!notification.is_read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

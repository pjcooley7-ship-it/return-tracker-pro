import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ReturnCard } from '@/components/dashboard/ReturnCard';
import { useReturns } from '@/hooks/useReturns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AwaitingRefund() {
  const { returns, isLoading } = useReturns();

  const awaitingRefund = returns.filter(r => 
    ['delivered', 'awaiting_refund'].includes(r.status)
  );

  return (
    <DashboardLayout title="Awaiting Refund">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Returns that have been delivered and are waiting for refund
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : awaitingRefund.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No returns awaiting refund</CardTitle>
            <CardDescription>
              When your returns are delivered, they'll appear here until the refund is received.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {awaitingRefund.map(ret => (
            <ReturnCard key={ret.id} returnItem={ret} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

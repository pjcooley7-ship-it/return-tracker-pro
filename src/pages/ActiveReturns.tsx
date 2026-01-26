import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ReturnCard } from '@/components/dashboard/ReturnCard';
import { AddReturnDialog } from '@/components/returns/AddReturnDialog';
import { useReturns } from '@/hooks/useReturns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActiveReturns() {
  const { returns, isLoading } = useReturns();

  const activeReturns = returns.filter(r => 
    ['initiated', 'label_created', 'in_transit'].includes(r.status)
  );

  return (
    <DashboardLayout title="Active Returns">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Returns that are currently in transit or being processed
        </p>
        <AddReturnDialog />
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
      ) : activeReturns.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No active returns</CardTitle>
            <CardDescription>
              You don't have any returns currently in transit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <AddReturnDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeReturns.map(ret => (
            <ReturnCard key={ret.id} returnItem={ret} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

import { Package, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ReturnCard } from '@/components/dashboard/ReturnCard';
import { AddReturnDialog } from '@/components/returns/AddReturnDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReturns, useDashboardStats } from '@/hooks/useReturns';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { returns, isLoading } = useReturns();
  const { stats } = useDashboardStats();
  const navigate = useNavigate();

  const activeReturns = returns.filter(r => 
    ['initiated', 'label_created', 'in_transit'].includes(r.status)
  );

  const awaitingRefund = returns.filter(r => 
    ['delivered', 'awaiting_refund'].includes(r.status)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Active Returns"
          value={stats.activeReturns}
          description="Currently in transit"
          icon={<Package className="h-4 w-4" />}
        />
        <StatsCard
          title="Awaiting Refund"
          value={stats.awaitingRefund}
          description="Delivered, pending refund"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Recovered"
          value={formatCurrency(stats.totalRecovered)}
          description="Money refunded"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard
          title="Avg. Refund Time"
          value={stats.avgRefundDays ? `${stats.avgRefundDays} days` : '—'}
          description="From delivery to refund"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <AddReturnDialog />
      </div>

      {/* Active Returns Section */}
      <div className="space-y-6">
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
        ) : returns.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No returns yet</CardTitle>
              <CardDescription>
                Add your first return manually or connect your email for automatic detection.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4 pb-6">
              <AddReturnDialog>
                <Button>Add Return Manually</Button>
              </AddReturnDialog>
              <Button variant="outline" onClick={() => navigate('/connections')}>
                Connect Email
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Returns */}
            {activeReturns.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-muted-foreground">Active Returns</h3>
                  <Button variant="link" size="sm" onClick={() => navigate('/returns/active')}>
                    View all
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeReturns.slice(0, 3).map(ret => (
                    <ReturnCard key={ret.id} returnItem={ret} />
                  ))}
                </div>
              </div>
            )}

            {/* Awaiting Refund */}
            {awaitingRefund.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-muted-foreground">Awaiting Refund</h3>
                  <Button variant="link" size="sm" onClick={() => navigate('/returns/awaiting')}>
                    View all
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {awaitingRefund.slice(0, 3).map(ret => (
                    <ReturnCard key={ret.id} returnItem={ret} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

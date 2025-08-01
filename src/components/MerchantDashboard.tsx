import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentLinkGenerator } from './PaymentLinkGenerator';
import { TransactionMonitor } from './TransactionMonitor';
import { DollarSign, TrendingUp, Users, Link } from 'lucide-react';

export const MerchantDashboard = () => {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$2,847.50',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-accent'
    },
    {
      title: 'Transactions',
      value: '156',
      change: '+8.2%',
      icon: TrendingUp,
      color: 'text-primary'
    },
    {
      title: 'Payment Links',
      value: '23',
      change: '+4',
      icon: Link,
      color: 'text-solana-purple'
    },
    {
      title: 'Customers',
      value: '89',
      change: '+15.3%',
      icon: Users,
      color: 'text-solana-green'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-glow transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-accent">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="create">Create Payment Link</TabsTrigger>
          <TabsTrigger value="monitor">Transaction Monitor</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <PaymentLinkGenerator />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <TransactionMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Payment Volume</CardTitle>
                <CardDescription>Total payment volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chart visualization coming soon</p>
                    <p className="text-sm">Integration with charting library</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
                <CardDescription>Breakdown of payments by token type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span className="text-sm font-medium">USDC</span>
                    </div>
                    <span className="text-sm text-muted-foreground">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium">SOL</span>
                    </div>
                    <span className="text-sm text-muted-foreground">24%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-solana-green rounded-full"></div>
                      <span className="text-sm font-medium">USDT</span>
                    </div>
                    <span className="text-sm text-muted-foreground">8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';
import { getInvoices, PaymentStatus, formatAmount } from '@/lib/payment-utils';
import { getCurrentMerchant } from '@/lib/merchant-auth';
import BigNumber from 'bignumber.js';

interface AnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  conversionRate: number;
  topTokens: { token: string; amount: number; count: number }[];
  dailyRevenue: { date: string; revenue: number; transactions: number }[];
  monthlyTrends: { month: string; revenue: number; transactions: number }[];
}

const COLORS = ['#8b5cf6', '#06d6a0', '#f72585', '#4cc9f0', '#7209b7'];

export const AdvancedAnalytics = () => {
  const [merchant] = useState(getCurrentMerchant());
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const calculateAnalytics = useMemo(() => {
    return () => {
      setIsLoading(true);
      
      try {
        const invoices = getInvoices();
        const completedInvoices = invoices.filter(inv => inv.status === PaymentStatus.COMPLETED);
        
        // Filter by time range
        const now = new Date();
        const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        
        const filteredInvoices = completedInvoices.filter(inv => 
          inv.createdAt >= cutoffDate
        );

        // Calculate total revenue
        const totalRevenue = filteredInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.amount.toString()), 0
        );

        // Calculate average transaction
        const averageTransaction = filteredInvoices.length > 0 
          ? totalRevenue / filteredInvoices.length 
          : 0;

        // Calculate conversion rate (completed vs total)
        const totalInvoicesInRange = invoices.filter(inv => inv.createdAt >= cutoffDate);
        const conversionRate = totalInvoicesInRange.length > 0 
          ? (filteredInvoices.length / totalInvoicesInRange.length) * 100 
          : 0;

        // Calculate top tokens
        const tokenStats = filteredInvoices.reduce((acc, inv) => {
          const token = inv.token;
          if (!acc[token]) {
            acc[token] = { amount: 0, count: 0 };
          }
          acc[token].amount += parseFloat(inv.amount.toString());
          acc[token].count += 1;
          return acc;
        }, {} as Record<string, { amount: number; count: number }>);

        const topTokens = Object.entries(tokenStats)
          .map(([token, stats]) => ({ token, ...stats }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // Calculate daily revenue for the last 30 days
        const dailyRevenue = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          
          const dayInvoices = filteredInvoices.filter(inv => 
            inv.createdAt >= dayStart && inv.createdAt < dayEnd
          );
          
          const dayRevenue = dayInvoices.reduce((sum, inv) => 
            sum + parseFloat(inv.amount.toString()), 0
          );

          dailyRevenue.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: dayRevenue,
            transactions: dayInvoices.length
          });
        }

        // Calculate monthly trends for the last 12 months
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const monthInvoices = completedInvoices.filter(inv => 
            inv.createdAt >= monthStart && inv.createdAt <= monthEnd
          );
          
          const monthRevenue = monthInvoices.reduce((sum, inv) => 
            sum + parseFloat(inv.amount.toString()), 0
          );

          monthlyTrends.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            revenue: monthRevenue,
            transactions: monthInvoices.length
          });
        }

        setAnalyticsData({
          totalRevenue,
          totalTransactions: filteredInvoices.length,
          averageTransaction,
          conversionRate,
          topTokens,
          dailyRevenue,
          monthlyTrends
        });

      } catch (error) {
        console.error('Error calculating analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
  }, [timeRange]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${analyticsData.totalRevenue.toFixed(2)}`],
      ['Total Transactions', analyticsData.totalTransactions.toString()],
      ['Average Transaction', `$${analyticsData.averageTransaction.toFixed(2)}`],
      ['Conversion Rate', `${analyticsData.conversionRate.toFixed(1)}%`],
      [''],
      ['Top Tokens', ''],
      ...analyticsData.topTokens.map(token => [token.token, `$${token.amount.toFixed(2)}`]),
      [''],
      ['Daily Revenue', ''],
      ...analyticsData.dailyRevenue.map(day => [day.date, `$${day.revenue.toFixed(2)}`])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!merchant) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center">
          <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please authenticate as a merchant to view analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your payment performance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={calculateAnalytics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={exportAnalytics}
                disabled={!analyticsData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {analyticsData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${analyticsData.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{analyticsData.totalTransactions}</p>
                  </div>
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Transaction</p>
                    <p className="text-2xl font-bold">${analyticsData.averageTransaction.toFixed(2)}</p>
                  </div>
                  <Target className="h-8 w-8 text-solana-purple" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.conversionRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-solana-green" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Chart */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue and transaction count over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Token Distribution */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
                <CardDescription>Revenue breakdown by token type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.topTokens}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ token, amount }) => `${token}: $${amount.toFixed(0)}`}
                    >
                      {analyticsData.topTokens.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Long-term revenue and transaction trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentLinkGenerator } from './PaymentLinkGenerator';
import { TransactionMonitor } from './TransactionMonitor';
import { InvoiceManager } from './InvoiceManager';
import { WalletBalance } from './WalletBalance';
import { TokenFaucet } from './TokenFaucet';
import { MerchantAuth } from './MerchantAuth';
import { WebhookManager } from './WebhookManager';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { PaymentConfirmationSystem } from './PaymentConfirmationSystem';
import { DollarSign, TrendingUp, Users, Link } from 'lucide-react';
import { getInvoices, PaymentStatus, formatAmount } from '@/lib/payment-utils';
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor';
import { getCurrentMerchantSync, MerchantProfile } from '@/lib/merchant-auth';
import { useWallet } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';

export const MerchantDashboard = () => {
  const { connected } = useWallet();
  const [currentMerchant, setCurrentMerchant] = useState<MerchantProfile | null>(null);

  // Initialize transaction monitoring
  useTransactionMonitor({
    onPaymentConfirmed: (confirmation) => {
      console.log('Payment confirmed in dashboard:', confirmation);
      // Refresh stats when payment is confirmed
      calculateStats();
    }
  });

  // Check for current merchant
  useEffect(() => {
    if (connected) {
      const merchant = getCurrentMerchantSync();
      setCurrentMerchant(merchant);
    } else {
      setCurrentMerchant(null);
    }
  }, [connected]);

  const [stats, setStats] = useState([
    {
      title: 'Total Revenue',
      value: '$0.00',
      change: '+0%',
      icon: DollarSign,
      color: 'text-accent'
    },
    {
      title: 'Transactions',
      value: '0',
      change: '+0%',
      icon: TrendingUp,
      color: 'text-primary'
    },
    {
      title: 'Payment Links',
      value: '0',
      change: '+0',
      icon: Link,
      color: 'text-solana-purple'
    },
    {
      title: 'Customers',
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'text-solana-green'
    }
  ]);

  // Calculate real statistics from stored invoices
  const calculateStats = () => {
    const invoices = getInvoices();
    const completedInvoices = invoices.filter(inv => inv.status === PaymentStatus.COMPLETED);

    // Calculate total revenue (in USD equivalent for display)
    let totalRevenue = new BigNumber(0);
    completedInvoices.forEach(invoice => {
      // For simplicity, we'll just sum all amounts regardless of token
      // In a real app, you'd convert to a common currency
      totalRevenue = totalRevenue.plus(invoice.amount);
    });

    // Get unique customer wallets
    const uniqueCustomers = new Set(
      completedInvoices
        .filter(inv => inv.customerWallet)
        .map(inv => inv.customerWallet!.toString())
    );

    setStats([
      {
        title: 'Total Revenue',
        value: `$${totalRevenue.toFixed(2)}`,
        change: '+0%', // Would calculate from historical data
        icon: DollarSign,
        color: 'text-accent'
      },
      {
        title: 'Transactions',
        value: completedInvoices.length.toString(),
        change: '+0%',
        icon: TrendingUp,
        color: 'text-primary'
      },
      {
        title: 'Payment Links',
        value: invoices.length.toString(),
        change: '+0',
        icon: Link,
        color: 'text-solana-purple'
      },
      {
        title: 'Customers',
        value: uniqueCustomers.size.toString(),
        change: '+0%',
        icon: Users,
        color: 'text-solana-green'
      }
    ]);
  };

  useEffect(() => {
    calculateStats();

    // Recalculate stats every 30 seconds
    const interval = setInterval(calculateStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show merchant authentication if not authenticated
  if (!currentMerchant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <MerchantAuth onAuthSuccess={setCurrentMerchant} />
      </div>
    );
  }

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
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PaymentLinkGenerator />
            </div>
            <div className="space-y-6">
              <WalletBalance />
              <TokenFaucet />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentConfirmationSystem />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceManager />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <TransactionMonitor />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
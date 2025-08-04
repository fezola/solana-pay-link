import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Smartphone, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { HybridMerchantAuth, HybridMerchantProfile } from '@/components/HybridMerchantAuth';
import { HybridPOS } from '@/components/HybridPOS';
import { useToast } from '@/hooks/use-toast';

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  cryptoRevenue: number;
  fiatRevenue: number;
  cryptoTransactions: number;
  fiatTransactions: number;
  todayRevenue: number;
  todayTransactions: number;
}

export const HybridPOSPage = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  
  const [merchant, setMerchant] = useState<HybridMerchantProfile | null>(null);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    cryptoRevenue: 0,
    fiatRevenue: 0,
    cryptoTransactions: 0,
    fiatTransactions: 0,
    todayRevenue: 0,
    todayTransactions: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  // Load payment statistics
  useEffect(() => {
    if (!merchant) return;

    const loadStats = () => {
      // In production, this would fetch from your backend
      // For demo, we'll use localStorage
      const mockStats: PaymentStats = {
        totalRevenue: 15420.50,
        totalTransactions: 89,
        cryptoRevenue: 8750.25,
        fiatRevenue: 6670.25,
        cryptoTransactions: 34,
        fiatTransactions: 55,
        todayRevenue: 1250.00,
        todayTransactions: 8
      };
      
      setStats(mockStats);
      
      // Mock recent payments
      const mockPayments = [
        {
          id: 'pay_001',
          amount: 25.50,
          currency: merchant.defaultCurrency,
          method: 'USDC',
          status: 'completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          description: 'Coffee and pastry'
        },
        {
          id: 'pay_002',
          amount: 150.00,
          currency: merchant.defaultCurrency,
          method: 'Bank Transfer',
          status: 'completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
          description: 'Catering order'
        },
        {
          id: 'pay_003',
          amount: 75.25,
          currency: merchant.defaultCurrency,
          method: 'SOL',
          status: 'pending',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          description: 'Product purchase'
        }
      ];
      
      setRecentPayments(mockPayments);
    };

    loadStats();
  }, [merchant]);

  const handleMerchantAuth = (merchantProfile: HybridMerchantProfile) => {
    setMerchant(merchantProfile);
    toast({
      title: "Welcome back!",
      description: `Logged in as ${merchantProfile.businessName}`,
    });
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
              Hybrid POS System
            </h1>
            <p className="text-xl text-muted-foreground">
              Accept both cryptocurrency and traditional payments in one system
            </p>
          </div>
          
          <HybridMerchantAuth onAuthSuccess={handleMerchantAuth} />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <HybridMerchantAuth onAuthSuccess={handleMerchantAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 p-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-teal-800">
              {merchant.businessName}
            </h1>
            <p className="text-muted-foreground">
              Hybrid Payment Terminal • {merchant.city}, {merchant.country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-teal-50 text-teal-700">
              <Store className="h-3 w-3 mr-1" />
              {merchant.businessType}
            </Badge>
            {merchant.enableHybridPayments && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Hybrid Enabled
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRevenue.toLocaleString()} {merchant.defaultCurrency}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crypto Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {stats.cryptoRevenue.toLocaleString()} {merchant.defaultCurrency}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.cryptoTransactions} crypto payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fiat Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.fiatRevenue.toLocaleString()} {merchant.defaultCurrency}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.fiatTransactions} traditional payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.todayRevenue.toLocaleString()} {merchant.defaultCurrency}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayTransactions} payments today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pos">POS Terminal</TabsTrigger>
            <TabsTrigger value="payments">Recent Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* POS Terminal */}
              <div>
                <HybridPOS merchant={merchant} />
              </div>

              {/* Payment Methods Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Supported Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        Cryptocurrency
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {merchant.supportedCryptos.map(crypto => (
                          <Badge key={crypto} variant="outline" className="bg-teal-50 text-teal-700">
                            {crypto}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {merchant.enableHybridPayments && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          Traditional Methods
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {merchant.supportedFiatMethods.map(method => (
                            <Badge key={method} variant="outline" className="bg-blue-50 text-blue-700">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Supported Currencies</h4>
                      <div className="flex gap-2 flex-wrap">
                        {merchant.supportedCurrencies.map(currency => (
                          <Badge key={currency} variant="outline">
                            {currency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">How It Works</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-medium">
                          1
                        </span>
                        <span>Enter payment amount and generate QR code</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-medium">
                          2
                        </span>
                        <span>Customer scans QR code with their phone</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-medium">
                          3
                        </span>
                        <span>Customer chooses crypto or traditional payment</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs font-medium">
                          4
                        </span>
                        <span>Payment is processed and confirmed</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>
                  Latest transactions from your hybrid payment system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.method.includes('SOL') || payment.method.includes('USDC') 
                            ? 'bg-teal-100' 
                            : 'bg-blue-100'
                        }`}>
                          {payment.method.includes('SOL') || payment.method.includes('USDC') ? (
                            <TrendingUp className={`h-5 w-5 text-teal-600`} />
                          ) : (
                            <BarChart3 className={`h-5 w-5 text-blue-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {payment.amount} {payment.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.description} • {payment.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {payment.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payment.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Merchant Settings</CardTitle>
                <CardDescription>
                  Manage your hybrid payment configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Business Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Business Name:</span>
                          <span>{merchant.businessName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{merchant.businessType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{merchant.city}, {merchant.country}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Payment Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Default Currency:</span>
                          <span>{merchant.defaultCurrency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hybrid Payments:</span>
                          <span>{merchant.enableHybridPayments ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Crypto Wallet:</span>
                          <span className="font-mono">{merchant.cryptoWallet.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.removeItem('hybrid_merchant_profile');
                      setMerchant(null);
                      toast({
                        title: "Logged Out",
                        description: "You have been logged out successfully",
                      });
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

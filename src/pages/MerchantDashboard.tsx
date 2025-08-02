import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, TrendingUp, Calendar, Wallet, Building2, Clock, ArrowUpRight, CheckCircle, AlertCircle, Plus, LifeBuoy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { MerchantService } from '@/lib/supabase-service';
import { formatAmount } from '@/lib/payment-utils';
import { getCurrentMerchant, registerMerchant } from '@/lib/merchant-auth';

interface ClientData {
  address: string;
  totalPayments: number;
  totalVolume: number;
  lastPayment: string;
  firstPayment: string;
  transactions: Array<{
    amount: string;
    token: string;
    date: string;
    title?: string;
    description?: string;
  }>;
}

interface MerchantStats {
  total_invoices: number;
  completed_payments: number;
  pending_payments: number;
  total_volume: number;
  total_fees_earned: number;
}

export const MerchantDashboard = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    email: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    if (connected && publicKey) {
      checkMerchantRegistration();
    }
  }, [connected, publicKey]);

  const checkMerchantRegistration = async () => {
    if (!publicKey) return;

    try {
      const merchant = await getCurrentMerchant(publicKey);
      if (merchant) {
        setIsRegistered(true);
        setBusinessForm({
          businessName: merchant.businessName,
          email: merchant.email || '',
          website: merchant.website || '',
          description: merchant.description || ''
        });
        loadMerchantData();
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.warn('Error checking merchant registration:', error);
      setIsRegistered(false);
    }
  };

  const handleBusinessRegistration = async () => {
    if (!publicKey) return;

    if (!businessForm.businessName.trim()) {
      toast({
        title: "Error",
        description: "Business name is required",
        variant: "destructive"
      });
      return;
    }

    if (!businessForm.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required for account recovery",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessForm.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    try {
      await registerMerchant(publicKey, {
        businessName: businessForm.businessName,
        email: businessForm.email || undefined,
        website: businessForm.website || undefined,
        description: businessForm.description || undefined
      });

      setIsRegistered(true);
      toast({
        title: "Success!",
        description: "Your business has been registered successfully",
      });

      // Load merchant data after registration
      loadMerchantData();
    } catch (error) {
      console.error('Error registering business:', error);
      toast({
        title: "Registration Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const loadMerchantData = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      // Load merchant stats and clients in parallel
      const [merchantStats, merchantClients] = await Promise.all([
        MerchantService.getMerchantStats(publicKey),
        MerchantService.getMerchantClients(publicKey)
      ]);

      setStats(merchantStats);
      setClients(merchantClients);
    } catch (error) {
      console.warn('Error loading merchant data:', error);
      toast({
        title: "Info",
        description: "Using local data. Connect to see live analytics.",
      });

      // Fallback to mock data for demo
      setStats({
        total_invoices: 0,
        completed_payments: 0,
        pending_payments: 0,
        total_volume: 0,
        total_fees_earned: 0
      });
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getClientStatus = (lastPayment: string) => {
    const daysSinceLastPayment = Math.floor(
      (Date.now() - new Date(lastPayment).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastPayment <= 7) return { label: 'Active', color: 'bg-green-500/10 text-green-500' };
    if (daysSinceLastPayment <= 30) return { label: 'Recent', color: 'bg-yellow-500/10 text-yellow-500' };
    return { label: 'Inactive', color: 'bg-gray-500/10 text-gray-500' };
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Merchant Dashboard</h1>
              <p className="text-muted-foreground mt-1">Monitor your payment services and client relationships</p>
            </div>
            <Button 
              onClick={loadMerchantData} 
              disabled={isLoading || !connected}
              className="flex items-center gap-2"
            >
              <TrendingUp className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {!connected ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">Connect Your Wallet</h3>
                  <p>Please connect your wallet to access your merchant dashboard</p>
                </div>
              </CardContent>
            </Card>
          ) : !isRegistered ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Register Your Business
                </CardTitle>
                <CardDescription>
                  Complete your business registration to start accepting payments and managing clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="business@example.com"
                      value={businessForm.email}
                      onChange={(e) => setBusinessForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required for account recovery if you lose wallet access</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourbusiness.com"
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your business and services..."
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Why register your business?</p>
                      <p className="text-muted-foreground">Registration enables payment processing, client management, and analytics features.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <LifeBuoy className="w-5 h-5 text-orange-500" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Account Recovery Protection</p>
                      <p className="text-muted-foreground">Your email enables account recovery if you lose wallet access. Without it, losing your wallet means losing your business data forever.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleBusinessRegistration}
                    disabled={isRegistering || !businessForm.businessName.trim() || !businessForm.email.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Register Business
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Already have a business account?</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = '/recover'}
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                    >
                      <LifeBuoy className="w-4 h-4 mr-2" />
                      Recover Your Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Business Status */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{businessForm.businessName}</h3>
                        <p className="text-sm text-muted-foreground">Business Registered & Active</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Clients</p>
                        <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Volume</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${stats?.total_volume?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Payments</p>
                        <p className="text-2xl font-bold text-foreground">{stats?.completed_payments || 0}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Fees Earned</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${stats?.total_fees_earned?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <ArrowUpRight className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Client Management */}
              <Tabs defaultValue="clients" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="clients">Client Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="clients" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Your Clients & Companies
                      </CardTitle>
                      <CardDescription>
                        All companies and individuals who have made payments through your services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading client data...</p>
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2 text-foreground">No Clients Yet</h3>
                          <p>Clients will appear here once they make payments through your services</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {clients.map((client, index) => {
                            const status = getClientStatus(client.lastPayment);
                            return (
                              <div key={client.address} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-foreground">Client #{index + 1}</h3>
                                        <p className="text-sm text-muted-foreground font-mono">{formatAddress(client.address)}</p>
                                      </div>
                                      <Badge className={status.color}>
                                        {status.label}
                                      </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Total Payments:</span>
                                        <div className="font-medium text-foreground">{client.totalPayments}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Total Volume:</span>
                                        <div className="font-medium text-foreground">${client.totalVolume.toFixed(2)}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">First Payment:</span>
                                        <div className="font-medium text-foreground">{new Date(client.firstPayment).toLocaleDateString()}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Last Payment:</span>
                                        <div className="font-medium text-foreground">{new Date(client.lastPayment).toLocaleDateString()}</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="analytics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Analytics</CardTitle>
                      <CardDescription>Detailed insights into your payment processing business</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2 text-foreground">Analytics Coming Soon</h3>
                        <p>Advanced analytics and reporting features will be available here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

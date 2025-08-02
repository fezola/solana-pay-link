import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, ExternalLink, Search, Filter, Plus, Eye, Trash2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { PaymentLinkService } from '@/lib/supabase-service';
import { getCurrentMerchant } from '@/lib/merchant-auth';
import { getInvoices, PaymentStatus, formatAmount } from '@/lib/payment-utils';

// Chain Icons using actual logos
const SolanaIcon = () => (
  <img
    src="/solana-sol-logo.png"
    alt="Solana"
    className="w-4 h-4 object-contain"
  />
);

const BaseIcon = () => (
  <img
    src="/base.JPG"
    alt="Base"
    className="w-4 h-4 object-contain rounded-sm"
  />
);

interface PaymentLink {
  id: string;
  title: string;
  description: string;
  amount: string;
  token: string;
  network: 'solana' | 'base';
  recipient: string;
  status: PaymentStatus;
  createdAt: Date;
  expiresAt?: Date;
  paymentUrl: string;
}

export const PaymentLinks = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'solana' | 'base'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPaymentLinks();
  }, [connected, publicKey]);

  const loadPaymentLinks = async () => {
    setIsLoading(true);
    try {
      let links: PaymentLink[] = [];

      // Try to get merchant and load from Supabase first
      const currentMerchant = getCurrentMerchant();
      if (currentMerchant && connected && publicKey) {
        try {
          // Note: We'd need to implement getPaymentLinksByMerchant in PaymentLinkService
          // For now, we'll fall back to localStorage invoices
          console.log('Merchant found, but Supabase payment links not implemented yet');
        } catch (error) {
          console.warn('Failed to load from Supabase:', error);
        }
      }

      // Load from localStorage invoices as fallback
      const invoices = getInvoices();
      links = invoices.map(invoice => {
        // Convert PublicKey to string for recipient
        const recipientStr = typeof invoice.recipient === 'string'
          ? invoice.recipient
          : invoice.recipient.toString();

        // Convert BigNumber to string for amount
        const amountStr = typeof invoice.amount === 'string'
          ? invoice.amount
          : invoice.amount.toString();

        return {
          id: invoice.id,
          title: invoice.title,
          description: invoice.description || '',
          amount: amountStr,
          token: invoice.token,
          network: recipientStr.startsWith('0x') ? 'base' : 'solana',
          recipient: recipientStr,
          status: invoice.status,
          createdAt: invoice.createdAt,
          expiresAt: invoice.expiresAt,
          paymentUrl: `${window.location.origin}/checkout?invoice=${invoice.id}`
        };
      });

      setPaymentLinks(links);
    } catch (error) {
      console.error('Error loading payment links:', error);
      toast({
        title: "Error",
        description: "Failed to load payment links",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLinks = paymentLinks.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    const matchesNetwork = networkFilter === 'all' || link.network === networkFilter;
    return matchesSearch && matchesStatus && matchesNetwork;
  });

  const copyPaymentLink = async (link: PaymentLink) => {
    await navigator.clipboard.writeText(link.paymentUrl);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const openPaymentLink = (link: PaymentLink) => {
    window.open(link.paymentUrl, '_blank');
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'expired': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getNetworkColor = (network: string) => {
    return network === 'solana'
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const getNetworkIcon = (network: string) => {
    return network === 'solana' ? <SolanaIcon /> : <BaseIcon />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Links</h1>
            <p className="text-muted-foreground mt-1">Manage and track your payment links</p>
          </div>
          <Button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Link
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="expired">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Expired
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={networkFilter} onValueChange={(value) => setNetworkFilter(value as 'all' | 'solana' | 'base')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    <SelectItem value="solana">
                      <div className="flex items-center gap-2">
                        <SolanaIcon />
                        Solana
                      </div>
                    </SelectItem>
                    <SelectItem value="base">
                      <div className="flex items-center gap-2">
                        <BaseIcon />
                        Base
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={loadPaymentLinks} variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Links List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading payment links...</p>
                </div>
              </CardContent>
            </Card>
          ) : !connected ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">Connect Your Wallet</h3>
                  <p>Please connect your wallet to view your payment links</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredLinks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">No payment links found</h3>
                  <p>Create your first payment link to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLinks.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{link.title}</h3>
                        <Badge className={getStatusColor(link.status)}>
                          {link.status}
                        </Badge>
                        <Badge className={getNetworkColor(link.network)}>
                          <div className="flex items-center gap-1">
                            {getNetworkIcon(link.network)}
                            {link.network}
                          </div>
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{link.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <div className="font-medium">{formatAmount(link.amount)} {link.token}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div className="font-medium text-foreground">{link.createdAt.toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <div className="font-medium text-foreground">
                            {link.expiresAt ? link.expiresAt.toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recipient:</span>
                          <div className="font-medium font-mono text-xs text-foreground">
                            {link.recipient.slice(0, 8)}...{link.recipient.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPaymentLink(link)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentLink(link)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{paymentLinks.length}</div>
                <div className="text-sm text-muted-foreground">Total Links</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {paymentLinks.filter(l => l.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {paymentLinks.filter(l => l.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {paymentLinks.filter(l => l.network === 'solana').length}
                </div>
                <div className="text-sm text-muted-foreground">Solana</div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

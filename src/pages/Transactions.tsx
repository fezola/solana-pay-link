import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Filter, RefreshCw, TrendingUp, DollarSign, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { getInvoices, PaymentStatus, formatAmount, clearAllInvoices } from '@/lib/payment-utils';

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

interface Transaction {
  id: string;
  invoiceId: string;
  title: string;
  amount: string;
  token: string;
  network: 'solana' | 'base';
  recipient: string;
  sender?: string;
  status: PaymentStatus;
  transactionHash?: string;
  createdAt: Date;
  completedAt?: Date;
  blockExplorer?: string;
}

export const Transactions = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'solana' | 'base'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Load invoices and convert to transactions format
      const invoices = getInvoices();
      const txs: Transaction[] = invoices.map(invoice => {
        // Convert PublicKey to string for recipient
        const recipientStr = typeof invoice.recipient === 'string'
          ? invoice.recipient
          : invoice.recipient.toString();

        const network = recipientStr.startsWith('0x') ? 'base' : 'solana';
        const blockExplorer = network === 'solana'
          ? 'https://explorer.solana.com'
          : 'https://basescan.org';

        // Convert BigNumber to string for amount
        const amountStr = typeof invoice.amount === 'string'
          ? invoice.amount
          : invoice.amount.toString();

        return {
          id: `tx_${invoice.id}`,
          invoiceId: invoice.id,
          title: invoice.title,
          amount: amountStr,
          token: invoice.token,
          network,
          recipient: recipientStr,
          status: invoice.status,
          transactionHash: invoice.status === 'completed' ? generateMockTxHash(network) : undefined,
          createdAt: invoice.createdAt,
          completedAt: invoice.status === 'completed' ? new Date(invoice.createdAt.getTime() + 30000) : undefined,
          blockExplorer
        };
      });
      setTransactions(txs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTxHash = (network: 'solana' | 'base'): string => {
    if (network === 'solana') {
      // Solana transaction hash format
      return Array.from({length: 88}, () => 
        'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 58)]
      ).join('');
    } else {
      // Ethereum/Base transaction hash format
      return '0x' + Array.from({length: 64}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.transactionHash?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesNetwork = networkFilter === 'all' || tx.network === networkFilter;
    return matchesSearch && matchesStatus && matchesNetwork;
  });

  const openBlockExplorer = (tx: Transaction) => {
    if (tx.transactionHash && tx.blockExplorer) {
      const url = tx.network === 'solana' 
        ? `${tx.blockExplorer}/tx/${tx.transactionHash}`
        : `${tx.blockExplorer}/tx/${tx.transactionHash}`;
      window.open(url, '_blank');
    }
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

  const clearAllTransactions = () => {
    if (window.confirm('Are you sure you want to clear all transactions? This action cannot be undone.')) {
      clearAllInvoices();
      setTransactions([]);
      toast({
        title: "Cleared!",
        description: "All transactions have been cleared",
      });
    }
  };

  const totalVolume = transactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const completedCount = transactions.filter(tx => tx.status === 'completed').length;
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
              <p className="text-muted-foreground mt-1">Monitor and track all payment transactions</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadTransactions}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={clearAllTransactions}
                variant="destructive"
                disabled={isLoading || transactions.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold">${totalVolume.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
                </div>
                <ExternalLink className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
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
                    placeholder="Search transactions..."
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
                <Button onClick={loadTransactions} variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading transactions...</p>
                </div>
              </CardContent>
            </Card>
          ) : !connected ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">Connect Your Wallet</h3>
                  <p>Please connect your wallet to view your transactions</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">No transactions found</h3>
                  <p>Transactions will appear here once payments are made</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((tx) => (
              <Card key={tx.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{tx.title}</h3>
                        <Badge className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                        <Badge className={getNetworkColor(tx.network)}>
                          <div className="flex items-center gap-1">
                            {getNetworkIcon(tx.network)}
                            {tx.network}
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <div className="font-medium text-foreground">{formatAmount(tx.amount)} {tx.token}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div className="font-medium text-foreground">{tx.createdAt.toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed:</span>
                          <div className="font-medium text-foreground">
                            {tx.completedAt ? tx.completedAt.toLocaleDateString() : '-'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recipient:</span>
                          <div className="font-medium font-mono text-xs text-foreground">
                            {tx.recipient.slice(0, 8)}...{tx.recipient.slice(-6)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tx Hash:</span>
                          <div className="font-medium font-mono text-xs text-foreground">
                            {tx.transactionHash ? 
                              `${tx.transactionHash.slice(0, 8)}...${tx.transactionHash.slice(-6)}` : 
                              '-'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {tx.transactionHash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBlockExplorer(tx)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Explorer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

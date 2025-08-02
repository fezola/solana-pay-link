import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Search, Filter, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getInvoices, PaymentStatus, formatAmount } from '@/lib/payment-utils';

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
        const network = invoice.recipient.startsWith('0x') ? 'base' : 'solana';
        const blockExplorer = network === 'solana' 
          ? 'https://explorer.solana.com'
          : 'https://basescan.org';
        
        return {
          id: `tx_${invoice.id}`,
          invoiceId: invoice.id,
          title: invoice.title,
          amount: invoice.amount,
          token: invoice.token,
          network,
          recipient: invoice.recipient,
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNetworkColor = (network: string) => {
    return network === 'solana' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const totalVolume = transactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const completedCount = transactions.filter(tx => tx.status === 'completed').length;
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1">Monitor and track all payment transactions</p>
          </div>
          <Button 
            onClick={loadTransactions} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <ExternalLink className="w-8 h-8 text-blue-600" />
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Network</Label>
                <select
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value as 'all' | 'solana' | 'base')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Networks</option>
                  <option value="solana">Solana</option>
                  <option value="base">Base</option>
                </select>
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
          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No transactions found</h3>
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
                          {tx.network}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <div className="font-medium">{formatAmount(tx.amount)} {tx.token}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <div className="font-medium">{tx.createdAt.toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <div className="font-medium">
                            {tx.completedAt ? tx.completedAt.toLocaleDateString() : '-'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Recipient:</span>
                          <div className="font-medium font-mono text-xs">
                            {tx.recipient.slice(0, 8)}...{tx.recipient.slice(-6)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Tx Hash:</span>
                          <div className="font-medium font-mono text-xs">
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
  );
};

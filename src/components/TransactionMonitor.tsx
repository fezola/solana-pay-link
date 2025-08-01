import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface Transaction {
  id: string;
  signature: string;
  amount: number;
  token: string;
  from: string;
  to: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  title: string;
}

export const TransactionMonitor = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      signature: 'ABC123...XYZ789',
      amount: 49.99,
      token: 'USDC',
      from: '7xKXt...9Qj2m',
      to: '9mWxF...3Kp8r',
      status: 'confirmed',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      title: 'Coffee Purchase'
    },
    {
      id: '2',
      signature: 'DEF456...UVW012',
      amount: 0.1,
      token: 'SOL',
      from: '4pQrS...7Lm9n',
      to: '9mWxF...3Kp8r',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      title: 'Service Fee'
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
    }
  };

  const refreshTransactions = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction Monitor</CardTitle>
          <CardDescription>
            Real-time monitoring of Solana Pay transactions
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={refreshTransactions}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                {getStatusIcon(tx.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{tx.title}</span>
                    <Badge variant={getStatusVariant(tx.status)} className="text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-mono">{tx.from}</span> → <span className="font-mono">{tx.to}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(tx.timestamp)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">
                    {tx.amount} {tx.token}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {tx.signature}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions to display</p>
            <p className="text-sm">Transactions will appear here once customers make payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
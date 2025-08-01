import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, CheckCircle, Clock, XCircle, Play, Pause, Eye } from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTransactionMonitor } from '@/hooks/use-transaction-monitor';
import { StorageService } from '@/lib/storage';
import { Transaction, TransactionStatus, formatTokenAmount } from '@/types/payment';

export const TransactionMonitor = () => {
  const { connection } = useConnection();
  const {
    isMonitoring,
    pendingInvoices,
    recentTransactions,
    totalPendingAmount,
    startMonitoring,
    stopMonitoring,
    refreshData,
  } = useTransactionMonitor();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
      case TransactionStatus.FINALIZED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case TransactionStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case TransactionStatus.FAILED:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusVariant = (status: TransactionStatus): "default" | "secondary" | "destructive" => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
      case TransactionStatus.FINALIZED:
        return 'default';
      case TransactionStatus.PENDING:
        return 'secondary';
      case TransactionStatus.FAILED:
        return 'destructive';
    }
  };

  const refreshTransactions = async () => {
    setIsRefreshing(true);
    try {
      refreshData();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual feedback
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
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

  const truncateAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Transaction Monitor
            {isMonitoring && (
              <Badge variant="default" className="text-xs">
                Live
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time monitoring of Solana Pay transactions
            {pendingInvoices.length > 0 && (
              <span className="block text-sm mt-1">
                {pendingInvoices.length} pending invoice(s) • ${totalPendingAmount.toFixed(2)} total
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMonitoring}
            title={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
          >
            {isMonitoring ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshTransactions}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((tx) => {
            const invoice = StorageService.getInvoice(tx.invoiceId);
            return (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  {getStatusIcon(tx.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{invoice?.title || 'Payment'}</span>
                      <Badge variant={getStatusVariant(tx.status)} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-mono">{truncateAddress(tx.from.toString())}</span> → <span className="font-mono">{truncateAddress(tx.to.toString())}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{formatTimestamp(tx.timestamp)}</span>
                      {tx.confirmations && (
                        <span>• {tx.confirmations} confirmations</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">
                      {tx.amount} {tx.token}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {truncateAddress(tx.signature, 6)}
                    </div>
                    {tx.fee && (
                      <div className="text-xs text-muted-foreground">
                        Fee: {(tx.fee / 1e9).toFixed(6)} SOL
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`, '_blank')}
                      title="View on Solana Explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {invoice && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Could open invoice details modal
                          console.log('Invoice details:', invoice);
                        }}
                        title="View invoice details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {recentTransactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions to display</p>
            <p className="text-sm">Transactions will appear here once customers make payments</p>
            {!isMonitoring && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={startMonitoring}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
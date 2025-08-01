import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Wallet, ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  getInvoiceById,
  updateInvoiceStatus,
  PaymentStatus,
  Invoice,
  isInvoiceExpired,
  formatAmount,
  amountToBaseUnits,
  SPL_TOKENS
} from '@/lib/payment-utils';
import { getTransactionMonitor } from '@/lib/transaction-monitor';
import {
  createPaymentTransaction,
  checkSufficientBalance,
  formatTokenAmount
} from '@/lib/spl-token-utils';
import BigNumber from 'bignumber.js';

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [transactionSignature, setTransactionSignature] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [networkInfo, setNetworkInfo] = useState<string>('');

  useEffect(() => {
    // Check network info
    const checkNetwork = async () => {
      try {
        const version = await connection.getVersion();
        setNetworkInfo(`Connected to: ${connection.rpcEndpoint.includes('devnet') ? 'Devnet' : 'Unknown Network'}`);
        console.log('Network info:', version, connection.rpcEndpoint);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    };
    checkNetwork();

    // Get invoice ID from URL parameters
    const invoiceId = searchParams.get('invoice');

    if (invoiceId) {
      const foundInvoice = getInvoiceById(invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
        setPaymentStatus(foundInvoice.status);

        // Check if invoice is expired
        if (isInvoiceExpired(foundInvoice)) {
          setPaymentStatus(PaymentStatus.EXPIRED);
          updateInvoiceStatus(invoiceId, PaymentStatus.EXPIRED);
          setError('This payment link has expired');
        }
      } else {
        setError('Invoice not found');
      }
    } else {
      // Fallback: try to parse legacy URL parameters
      const amount = searchParams.get('amount');
      const token = searchParams.get('spl-token') || 'SOL';
      const title = searchParams.get('label') || 'Payment';
      const description = searchParams.get('message') || '';
      const recipient = searchParams.get('recipient');

      if (amount && recipient) {
        // Create a temporary invoice for legacy URLs
        const tempInvoice: Invoice = {
          id: 'legacy_' + Date.now(),
          reference: new PublicKey(recipient), // Use recipient as reference for legacy
          recipient: new PublicKey(recipient),
          amount: new BigNumber(amount),
          token,
          title,
          description,
          status: PaymentStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setInvoice(tempInvoice);
      } else {
        setError('Invalid payment link');
      }
    }
  }, [searchParams]);

  const processPayment = async () => {
    if (!connected || !publicKey || !invoice) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to proceed with payment",
        variant: "destructive"
      });
      return;
    }

    if (isInvoiceExpired(invoice)) {
      toast({
        title: "Payment Expired",
        description: "This payment link has expired",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus(PaymentStatus.PROCESSING);
      updateInvoiceStatus(invoice.id, PaymentStatus.PROCESSING);

      console.log('Starting payment process for:', {
        amount: invoice.amount.toString(),
        token: invoice.token,
        recipient: invoice.recipient.toString(),
        wallet: publicKey.toString()
      });

      // Check if user has sufficient balance
      const balanceCheck = await checkSufficientBalance(
        connection,
        publicKey,
        invoice.token,
        invoice.amount
      );

      console.log('Balance check result:', balanceCheck);

      if (!balanceCheck.sufficient) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${formatTokenAmount(balanceCheck.required, invoice.token)} but only have ${formatTokenAmount(balanceCheck.balance, invoice.token)}`,
          variant: "destructive"
        });
        setPaymentStatus(PaymentStatus.FAILED);
        setIsProcessing(false);
        return;
      }

      // Create payment transaction (handles both SOL and SPL tokens)
      let transaction: Transaction;

      if (invoice.token === 'SOL') {
        // Handle SOL payment with simplified approach
        const lamports = invoice.amount.multipliedBy(1000000000).toNumber(); // Convert to lamports

        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: invoice.recipient,
            lamports,
          })
        );
      } else {
        // For SPL tokens, use the utility function
        transaction = await createPaymentTransaction(
          connection,
          publicKey,
          invoice.recipient,
          invoice.token,
          invoice.amount,
          invoice.reference,
          invoice.id
        );
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('Sending transaction:', {
        instructions: transaction.instructions.length,
        feePayer: publicKey.toString(),
        blockhash: blockhash.slice(0, 8) + '...'
      });

      const signature = await sendTransaction(transaction, connection);
      setTransactionSignature(signature);

      console.log('Transaction sent:', signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Transaction confirmed:', signature);

      setPaymentStatus(PaymentStatus.COMPLETED);
      updateInvoiceStatus(invoice.id, PaymentStatus.COMPLETED, signature, publicKey);

      toast({
        title: "Payment Successful!",
        description: "Your transaction has been confirmed on the Solana blockchain",
      });

      // Start monitoring for this specific payment
      const monitor = getTransactionMonitor(connection);
      monitor.onPaymentConfirmed((confirmation) => {
        if (confirmation.invoice.id === invoice.id) {
          console.log('Payment confirmed via monitor:', confirmation);
        }
      });

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus(PaymentStatus.FAILED);
      updateInvoiceStatus(invoice.id, PaymentStatus.FAILED);

      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-8 w-8 text-accent" />;
      case PaymentStatus.PROCESSING:
        return <Clock className="h-8 w-8 text-yellow-500 animate-spin" />;
      case PaymentStatus.FAILED:
        return <AlertTriangle className="h-8 w-8 text-destructive" />;
      case PaymentStatus.EXPIRED:
        return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      default:
        return <Wallet className="h-8 w-8 text-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case PaymentStatus.COMPLETED:
        return 'Payment completed successfully!';
      case PaymentStatus.PROCESSING:
        return 'Processing your payment...';
      case PaymentStatus.FAILED:
        return 'Payment failed. Please try again.';
      case PaymentStatus.EXPIRED:
        return 'This payment link has expired';
      default:
        return 'Ready to process payment';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case PaymentStatus.COMPLETED:
        return 'text-accent';
      case PaymentStatus.PROCESSING:
        return 'text-yellow-500';
      case PaymentStatus.FAILED:
        return 'text-destructive';
      case PaymentStatus.EXPIRED:
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Invalid payment link'}
            </p>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-solana">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{invoice.title}</CardTitle>
          <CardDescription className={getStatusColor()}>
            {getStatusMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invoice Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invoice ID</span>
              <span className="font-mono text-xs">{invoice.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reference</span>
              <span className="font-mono text-xs">{invoice.reference.toString().slice(0, 8)}...</span>
            </div>
            {invoice.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-xs">{invoice.expiresAt.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatAmount(invoice.amount, invoice.token)} {invoice.token}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-mono text-sm">{invoice.recipient.toString().slice(0, 8)}...{invoice.recipient.toString().slice(-8)}</span>
              </div>
              {invoice.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-sm">{invoice.description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="text-sm font-medium">{invoice.token}</span>
              </div>
            </div>
          </div>

          {/* Wallet Connection and Payment */}
          <div className="space-y-4">
            {!connected ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Connect Your Solana Wallet</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    To complete this payment, you need to connect a Solana wallet like Phantom or Solflare.
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1 mb-3">
                    <li>• Make sure you have {formatAmount(invoice.amount, invoice.token)} {invoice.token} in your wallet</li>
                    <li>• You're paying on Solana Devnet (test network)</li>
                    <li>• Transaction fees are very low (~$0.001)</li>
                  </ul>
                </div>
                <WalletMultiButton className="w-full !bg-gradient-solana !hover:shadow-glow" />
              </div>
            ) : paymentStatus === PaymentStatus.EXPIRED ? (
              <div className="space-y-4">
                <Badge variant="destructive" className="w-full justify-center py-2">
                  Payment Expired
                </Badge>
                <p className="text-sm text-muted-foreground text-center">
                  This payment link has expired and can no longer be used
                </p>
              </div>
            ) : paymentStatus === PaymentStatus.PENDING ? (
              <Button
                onClick={processPayment}
                className="w-full"
                variant="solana"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatAmount(invoice.amount, invoice.token)} {invoice.token}
                  </>
                )}
              </Button>
            ) : paymentStatus === PaymentStatus.COMPLETED ? (
              <div className="space-y-4">
                <Badge variant="default" className="w-full justify-center py-2">
                  Payment Completed
                </Badge>
                {transactionSignature && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Transaction
                  </Button>
                )}
              </div>
            ) : paymentStatus === PaymentStatus.FAILED ? (
              <Button
                onClick={processPayment}
                className="w-full"
                variant="destructive"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Retry Payment'
                )}
              </Button>
            ) : (
              <Badge variant="secondary" className="w-full justify-center py-2">
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Badge>
            )}
          </div>

          {/* Help Section */}
          {connected && paymentStatus === PaymentStatus.PENDING && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">How to complete payment:</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Click "Pay {formatAmount(invoice.amount, invoice.token)} {invoice.token}" button above</li>
                <li>2. Your wallet will open asking for approval</li>
                <li>3. Review the transaction details</li>
                <li>4. Click "Approve" or "Confirm" in your wallet</li>
                <li>5. Wait for transaction confirmation</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2">
                💡 If your wallet doesn't open automatically, check if it's installed and unlocked
              </p>
            </div>
          )}

          {/* Network Info */}
          {networkInfo && (
            <div className="text-xs text-center">
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {networkInfo}
              </Badge>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Powered by Solana Pay • Secure • Decentralized</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
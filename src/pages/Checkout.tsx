import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Wallet, ExternalLink, AlertCircle } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import {
  SupportedToken,
  TOKEN_REGISTRY,
  PaymentStatus,
  InvoiceStatus,
  Transaction as PaymentTransaction
} from '@/types/payment';
import {
  createSOLTransferTransaction,
  createSPLTransferTransaction,
  formatTokenAmount
} from '@/lib/solana-pay';
import { StorageService } from '@/lib/storage';

interface PaymentDetails {
  amount: number;
  token: SupportedToken;
  title: string;
  description: string;
  recipient: string;
  reference?: string;
  memo?: string;
}

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [transactionSignature, setTransactionSignature] = useState<string>('');
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    // Parse URL parameters to get payment details
    const amount = searchParams.get('amount');
    const splToken = searchParams.get('spl-token');
    const title = searchParams.get('label') || 'Payment';
    const description = searchParams.get('message') || '';
    const recipient = searchParams.get('recipient');
    const reference = searchParams.get('reference');
    const memo = searchParams.get('memo');

    if (amount && recipient) {
      // Determine token type
      let token: SupportedToken = 'SOL';
      if (splToken) {
        // Find token by mint address
        const tokenEntry = Object.entries(TOKEN_REGISTRY).find(
          ([_, info]) => info.mint.toString() === splToken
        );
        if (tokenEntry) {
          token = tokenEntry[0] as SupportedToken;
        }
      }

      setPaymentDetails({
        amount: parseFloat(amount),
        token,
        title,
        description,
        recipient,
        reference,
        memo
      });

      // Try to find the invoice if reference is provided
      if (reference) {
        const foundInvoice = StorageService.getInvoiceByReference(reference);
        if (foundInvoice) {
          setInvoice(foundInvoice);
        }
      }
    }
  }, [searchParams]);

  const processPayment = async () => {
    if (!connected || !publicKey || !paymentDetails) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to proceed with payment",
        variant: "destructive"
      });
      return;
    }

    try {
      setPaymentStatus(PaymentStatus.PROCESSING);

      const recipientPubkey = new PublicKey(paymentDetails.recipient);
      const referencePubkey = paymentDetails.reference ? new PublicKey(paymentDetails.reference) : undefined;

      let transaction;

      if (paymentDetails.token === 'SOL') {
        // Create SOL transfer transaction
        transaction = await createSOLTransferTransaction(
          connection,
          publicKey,
          recipientPubkey,
          paymentDetails.amount,
          referencePubkey!,
          paymentDetails.memo
        );
      } else {
        // Create SPL token transfer transaction
        transaction = await createSPLTransferTransaction(
          connection,
          publicKey,
          recipientPubkey,
          paymentDetails.amount,
          paymentDetails.token,
          referencePubkey!,
          paymentDetails.memo
        );
      }

      const signature = await sendTransaction(transaction, connection);
      setTransactionSignature(signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setPaymentStatus(PaymentStatus.COMPLETED);

      // Create transaction record
      const txRecord: PaymentTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceId: invoice?.id || 'direct',
        signature,
        amount: paymentDetails.amount,
        token: paymentDetails.token,
        from: publicKey,
        to: recipientPubkey,
        status: 'confirmed' as any,
        timestamp: new Date(),
        confirmations: 1,
        memo: paymentDetails.memo,
      };

      // Save transaction
      StorageService.saveTransaction(txRecord);

      // Update invoice if exists
      if (invoice) {
        StorageService.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID, signature);
        const updatedInvoice = StorageService.getInvoice(invoice.id);
        if (updatedInvoice) {
          updatedInvoice.customerWallet = publicKey;
          StorageService.saveInvoice(updatedInvoice);
        }
      }

      toast({
        title: "Payment Successful!",
        description: `Transaction confirmed: ${signature.slice(0, 8)}...`,
      });

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus(PaymentStatus.FAILED);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case PaymentStatus.PROCESSING:
        return <Clock className="h-8 w-8 text-yellow-500 animate-spin" />;
      case PaymentStatus.FAILED:
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Wallet className="h-8 w-8 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case PaymentStatus.COMPLETED:
        return 'text-green-600';
      case PaymentStatus.PROCESSING:
        return 'text-yellow-600';
      case PaymentStatus.FAILED:
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case PaymentStatus.COMPLETED:
        return 'Payment completed successfully';
      case PaymentStatus.PROCESSING:
        return 'Processing your payment...';
      case PaymentStatus.FAILED:
        return 'Payment failed. Please try again.';
      default:
        return paymentDetails?.description || 'Complete your payment below';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment completed successfully!';
      case 'processing':
        return 'Processing your payment...';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return 'Ready to process payment';
    }
  };

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Invalid payment link</p>
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
          <CardTitle className="text-2xl">{paymentDetails.title}</CardTitle>
          <CardDescription>{getStatusMessage()}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatTokenAmount(paymentDetails.amount, paymentDetails.token)}
                </div>
                {paymentDetails.token !== 'SOL' && (
                  <div className="text-xs text-muted-foreground">
                    {TOKEN_REGISTRY[paymentDetails.token].name}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-mono text-sm">{paymentDetails.recipient.slice(0, 8)}...{paymentDetails.recipient.slice(-8)}</span>
              </div>
              {paymentDetails.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-sm">{paymentDetails.description}</span>
                </div>
              )}
              {invoice && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice ID</span>
                    <span className="font-mono text-xs">{invoice.id}</span>
                  </div>
                  {invoice.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="text-xs">{invoice.expiresAt.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
              {paymentDetails.reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{paymentDetails.reference.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Connection and Payment */}
          <div className="space-y-4">
            {!connected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Connect your wallet to proceed with payment
                </p>
                <WalletMultiButton className="w-full !bg-gradient-solana !hover:shadow-glow" />
              </div>
            ) : paymentStatus === PaymentStatus.PENDING ? (
              <Button
                onClick={processPayment}
                className="w-full"
                variant="solana"
                size="lg"
              >
                Pay {formatTokenAmount(paymentDetails.amount, paymentDetails.token)}
              </Button>
            ) : paymentStatus === PaymentStatus.COMPLETED ? (
              <div className="space-y-4">
                <Badge variant="default" className="w-full justify-center py-2">
                  Payment Completed ✓
                </Badge>
                {transactionSignature && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Solana Explorer
                    </Button>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Transaction ID:</p>
                      <p className="font-mono text-xs">{transactionSignature.slice(0, 16)}...{transactionSignature.slice(-16)}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : paymentStatus === PaymentStatus.FAILED ? (
              <Button
                onClick={processPayment}
                className="w-full"
                variant="destructive"
                size="lg"
              >
                Retry Payment
              </Button>
            ) : (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Processing...
              </Badge>
            )}
          </div>

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Powered by Solana Pay • Secure • Decentralized</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
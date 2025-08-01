import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, Wallet, ExternalLink } from 'lucide-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface PaymentDetails {
  amount: number;
  token: string;
  title: string;
  description: string;
  recipient: string;
}

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [transactionSignature, setTransactionSignature] = useState<string>('');

  useEffect(() => {
    // Parse URL parameters to get payment details
    const amount = searchParams.get('amount');
    const token = searchParams.get('spl-token') || 'SOL';
    const title = searchParams.get('label') || 'Payment';
    const description = searchParams.get('message') || '';
    const recipient = searchParams.get('recipient');

    if (amount && recipient) {
      setPaymentDetails({
        amount: parseFloat(amount),
        token,
        title,
        description,
        recipient
      });
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
      setPaymentStatus('processing');
      
      const recipientPubkey = new PublicKey(paymentDetails.recipient);
      const lamports = paymentDetails.amount * 1000000000; // Convert SOL to lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      setTransactionSignature(signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      setPaymentStatus('completed');
      toast({
        title: "Payment Successful!",
        description: "Your transaction has been confirmed on the Solana blockchain",
      });

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-accent" />;
      case 'processing':
        return <Clock className="h-8 w-8 text-yellow-500 animate-spin" />;
      case 'failed':
        return <Clock className="h-8 w-8 text-destructive" />;
      default:
        return <Wallet className="h-8 w-8 text-primary" />;
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
                  {paymentDetails.amount} {paymentDetails.token}
                </div>
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
            ) : paymentStatus === 'pending' ? (
              <Button 
                onClick={processPayment}
                className="w-full"
                variant="solana"
                size="lg"
              >
                Pay {paymentDetails.amount} {paymentDetails.token}
              </Button>
            ) : paymentStatus === 'completed' ? (
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
            ) : paymentStatus === 'failed' ? (
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
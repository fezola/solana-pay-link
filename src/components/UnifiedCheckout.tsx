import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  CreditCard, 
  Shield, 
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MultiCurrencyCheckout } from './MultiCurrencyCheckout';
import { 
  createInvoice, 
  saveInvoice,
  updateInvoiceStatus,
  PaymentStatus,
  SPL_TOKENS 
} from '@/lib/payment-utils';
import { createPaymentTransaction } from '@/lib/spl-token-utils';
import { Transaction, SystemProgram } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

interface UnifiedCheckoutProps {
  storeInfo: {
    name: string;
    description: string;
    logo: string;
    walletAddress: string;
  };
  cartItems: Array<{
    product: any;
    quantity: number;
  }>;
  cartTotal: number;
  onBack: () => void;
  onSuccess: () => void;
}

export const UnifiedCheckout = ({
  storeInfo,
  cartItems,
  cartTotal,
  onBack,
  onSuccess
}: UnifiedCheckoutProps) => {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();

  console.log('UnifiedCheckout props:', { storeInfo, cartItems, cartTotal });

  const [selectedCurrency, setSelectedCurrency] = useState<string>('USDC');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'confirm' | 'processing' | 'success' | 'error'>('select');
  const [transactionSignature, setTransactionSignature] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCurrencySelect = (currency: string, amount: number) => {
    setSelectedCurrency(currency);
    setSelectedAmount(amount);
  };

  const handleProceedToPayment = () => {
    if (!connected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to proceed",
        variant: "destructive"
      });
      return;
    }
    setShowPaymentModal(true);
    setPaymentStep('confirm');
  };

  const processPayment = async () => {
    if (!connected || !publicKey) return;

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Create order summary
      const orderSummary = cartItems.map(item => 
        `${item.quantity}x ${item.product.name} ($${item.product.price})`
      ).join(', ');

      // Create invoice
      const invoice = createInvoice({
        recipient: storeInfo.walletAddress,
        amount: selectedAmount.toString(),
        token: selectedCurrency,
        title: `${storeInfo.name} - Order`,
        description: `Order: ${orderSummary} | Total: $${cartTotal} USD`,
        expiresIn: 30
      });

      // Save invoice
      saveInvoice(invoice);
      updateInvoiceStatus(invoice.id, PaymentStatus.PROCESSING);

      // Check balance first
      console.log('Checking balance before payment...');
      if (selectedCurrency === 'SOL') {
        const balance = await connection.getBalance(publicKey);
        const requiredLamports = new BigNumber(selectedAmount).multipliedBy(1000000000).toNumber();
        console.log('SOL balance:', balance / 1000000000, 'SOL');
        console.log('Required:', requiredLamports / 1000000000, 'SOL');

        if (balance < requiredLamports + 5000) { // 5000 lamports for fees
          throw new Error(`Insufficient SOL balance. You have ${(balance / 1000000000).toFixed(4)} SOL but need ${(requiredLamports / 1000000000).toFixed(4)} SOL plus fees.`);
        }
      }

      // Create transaction
      let transaction: Transaction;

      if (selectedCurrency === 'SOL') {
        const lamports = new BigNumber(selectedAmount).multipliedBy(1000000000).toNumber();
        console.log('Creating SOL transfer for', lamports, 'lamports');
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: invoice.recipient,
            lamports,
          })
        );
      } else {
        console.log('Creating SPL token transfer for', selectedAmount, selectedCurrency);
        transaction = await createPaymentTransaction(
          connection,
          publicKey,
          invoice.recipient,
          selectedCurrency,
          new BigNumber(selectedAmount),
          invoice.reference,
          invoice.id
        );
      }

      // Get recent blockhash and send transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      setTransactionSignature(signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Update invoice status
      updateInvoiceStatus(invoice.id, PaymentStatus.COMPLETED);

      setPaymentStep('success');

      toast({
        title: "Payment Successful!",
        description: `Your order has been confirmed. Transaction: ${signature.slice(0, 8)}...`,
      });

      // Auto-close modal and return to cart after 3 seconds
      setTimeout(() => {
        setShowPaymentModal(false);
        onSuccess();
      }, 3000);

    } catch (error) {
      console.error('Payment failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      setPaymentStep('error');
      
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPayment = () => {
    setPaymentStep('select');
    setErrorMessage('');
    setTransactionSignature('');
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <img
                  src={storeInfo.logo}
                  alt={storeInfo.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="font-semibold text-gray-900">{storeInfo.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Side - Payment Form */}
          <div className="lg:col-span-7">
            <div className="max-w-lg">

              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center">
                  <div className="flex items-center text-sm">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-medium">
                      1
                    </div>
                    <span className="ml-3 font-medium text-gray-900">Payment</span>
                  </div>
                  <div className="flex-1 mx-4 h-px bg-gray-200"></div>
                  <div className="flex items-center text-sm">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-500 rounded-full font-medium">
                      2
                    </div>
                    <span className="ml-3 text-gray-500">Confirmation</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-1">
                      Your payment is secure with us
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      We use blockchain encryption and never store your wallet information.
                      All transactions are verified on the Solana network.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">SOL</span>
                        </div>
                        <span className="text-xs text-green-700 font-medium">Solana</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">USDC</span>
                        </div>
                        <span className="text-xs text-green-700 font-medium">USD Coin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment method</h2>

                {!connected ? (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect your wallet</h3>
                      <p className="text-gray-600 mb-6">
                        Connect your Solana wallet to proceed with payment
                      </p>
                      <WalletMultiButton className="!bg-blue-600 !hover:bg-blue-700 !rounded-xl !px-8 !py-3 !font-semibold" />
                    </div>
                  </div>
                ) : (
                  <MultiCurrencyCheckout
                    usdTotal={cartTotal}
                    onCurrencySelect={handleCurrencySelect}
                    onProceedToPayment={handleProceedToPayment}
                    isProcessing={isProcessing}
                  />
                )}
              </div>

              {/* SolPay Branding */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Powered by SolPay</h3>
                    <p className="text-sm text-gray-600">Decentralized payment platform</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Zero fees • Instant settlement • Global accessibility
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50 rounded-2xl p-6 sticky top-8">

              {/* Order Header */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Order summary</h2>
                <p className="text-sm text-gray-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Product List */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">{item.product.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${(item.product.price * item.quantity).toFixed(2)}</div>
                      <div className="text-sm text-gray-600">${item.product.price.toFixed(2)} each</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount code"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button variant="outline" className="px-6 rounded-xl">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Order Totals */}
              <div className="space-y-3 py-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network fees</span>
                  <span className="font-medium text-green-600">$0.00</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing fees</span>
                  <span className="font-medium text-green-600">$0.00</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Including all taxes</p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <Shield className="h-6 w-6 text-green-500 mb-2" />
                    <span className="text-xs text-gray-600">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Zap className="h-6 w-6 text-blue-500 mb-2" />
                    <span className="text-xs text-gray-600">Instant Settlement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'confirm' && 'Confirm Payment'}
              {paymentStep === 'processing' && 'Processing Payment'}
              {paymentStep === 'success' && 'Payment Successful!'}
              {paymentStep === 'error' && 'Payment Failed'}
            </DialogTitle>
            <DialogDescription>
              {paymentStep === 'confirm' && 'Review and confirm your payment details'}
              {paymentStep === 'processing' && 'Please wait while we process your payment'}
              {paymentStep === 'success' && 'Your order has been confirmed'}
              {paymentStep === 'error' && 'There was an issue processing your payment'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymentStep === 'confirm' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">You will pay:</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src={SPL_TOKENS[selectedCurrency as keyof typeof SPL_TOKENS]?.logo} 
                        alt={selectedCurrency}
                        className="w-5 h-5"
                      />
                      <span className="font-semibold">
                        {selectedAmount.toFixed(selectedCurrency === 'SOL' ? 4 : 2)} {selectedCurrency}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>USD equivalent:</span>
                    <span>≈ ${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={processPayment} className="flex-1">
                    Confirm Payment
                  </Button>
                </div>
              </>
            )}

            {paymentStep === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">Processing your payment...</p>
                <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="font-semibold text-gray-900 mb-2">Payment Confirmed!</p>
                <p className="text-sm text-gray-600 mb-4">
                  Transaction: {transactionSignature.slice(0, 8)}...{transactionSignature.slice(-8)}
                </p>
                <p className="text-xs text-gray-500">Returning to cart...</p>
              </div>
            )}

            {paymentStep === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="font-semibold text-gray-900 mb-2">Payment Failed</p>
                <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={resetPayment} className="flex-1">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

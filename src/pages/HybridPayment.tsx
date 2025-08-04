import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Smartphone,
  Building,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from '@/components/Header';

interface HybridPaymentData {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  cryptoOptions: {
    wallet: string;
    supportedTokens: string[];
  };
  fiatOptions?: {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
    paymentMethods: string[];
  };
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

// Country-specific payment instructions
const PAYMENT_INSTRUCTIONS = {
  'Bank Transfer': {
    icon: <Building className="h-5 w-5" />,
    title: 'Bank Transfer',
    steps: [
      'Log into your mobile banking app',
      'Select "Transfer" or "Send Money"',
      'Enter the account details below',
      'Enter the exact amount and reference',
      'Complete the transfer'
    ]
  },
  'Mobile Money': {
    icon: <Smartphone className="h-5 w-5" />,
    title: 'Mobile Money',
    steps: [
      'Dial your mobile money code',
      'Select "Send Money" or "Pay Bill"',
      'Enter the account number',
      'Enter the exact amount',
      'Confirm the transaction'
    ]
  },
  'USSD': {
    icon: <Smartphone className="h-5 w-5" />,
    title: 'USSD Payment',
    steps: [
      'Dial the USSD code for your bank',
      'Select "Transfer" option',
      'Enter recipient account details',
      'Enter amount and confirm',
      'Complete with your PIN'
    ]
  }
};

export const HybridPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  
  const [paymentData, setPaymentData] = useState<HybridPaymentData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'crypto' | 'fiat' | null>(null);
  const [selectedFiatMethod, setSelectedFiatMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const paymentId = searchParams.get('id');

  // Load payment data
  useEffect(() => {
    if (!paymentId) {
      navigate('/');
      return;
    }

    const loadPaymentData = () => {
      try {
        const stored = localStorage.getItem(`hybrid_payment_${paymentId}`);
        if (stored) {
          const data = JSON.parse(stored);
          data.createdAt = new Date(data.createdAt);
          data.expiresAt = new Date(data.expiresAt);
          setPaymentData(data);
        } else {
          toast({
            title: "Payment Not Found",
            description: "This payment link is invalid or has expired",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading payment data:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentData();
  }, [paymentId, navigate, toast]);

  // Update countdown timer
  useEffect(() => {
    if (!paymentData) return;

    const updateTimer = () => {
      const now = new Date();
      const timeRemaining = paymentData.expiresAt.getTime() - now.getTime();
      
      if (timeRemaining <= 0) {
        setTimeLeft('Expired');
        // Update payment status
        const updatedData = { ...paymentData, status: 'expired' as const };
        localStorage.setItem(`hybrid_payment_${paymentId}`, JSON.stringify(updatedData));
        setPaymentData(updatedData);
      } else {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentData, paymentId]);

  const handleCryptoPayment = () => {
    if (!paymentData || !connected || !publicKey) return;

    // In a real implementation, this would initiate a Solana Pay transaction
    toast({
      title: "Crypto Payment",
      description: "This would initiate a Solana Pay transaction",
    });
  };

  const completeFiatPayment = () => {
    if (!paymentData) return;

    // Mark payment as completed (in production, this would be verified by the backend)
    const updatedData = { ...paymentData, status: 'completed' as const };
    localStorage.setItem(`hybrid_payment_${paymentId}`, JSON.stringify(updatedData));
    setPaymentData(updatedData);

    toast({
      title: "Payment Marked Complete",
      description: "The merchant will verify your payment",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payment details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This payment link is invalid or has expired.
              </p>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentData.status === 'completed') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Payment Completed!</h2>
              <p className="text-muted-foreground mb-4">
                Your payment of {paymentData.amount} {paymentData.currency} has been processed.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentData.status === 'expired') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Payment Expired</h2>
              <p className="text-muted-foreground mb-4">
                This payment link has expired. Please request a new payment link from the merchant.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-md mx-auto space-y-4 p-4 pt-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Payment Options</h1>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-teal-600">
              {paymentData.amount} {paymentData.currency}
            </CardTitle>
            <CardDescription className="text-base">
              {paymentData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expires in:</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="font-mono font-medium">{timeLeft}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        {!selectedMethod && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Choose Payment Method</h2>
            
            {/* Crypto Option */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-teal-200"
              onClick={() => setSelectedMethod('crypto')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Cryptocurrency</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay with {paymentData.cryptoOptions.supportedTokens.join(', ')}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700">
                    Instant
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Fiat Option */}
            {paymentData.fiatOptions && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                onClick={() => setSelectedMethod('fiat')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Traditional Payment</h3>
                      <p className="text-sm text-muted-foreground">
                        Bank transfer, mobile money, etc.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Local
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Crypto Payment Interface */}
        {selectedMethod === 'crypto' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-teal-500" />
                Cryptocurrency Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-teal-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Recipient Wallet:</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.cryptoOptions.wallet, 'Wallet address')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-mono text-xs break-all bg-white p-2 rounded">
                  {paymentData.cryptoOptions.wallet}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Supported Tokens:</Label>
                <div className="flex gap-2">
                  {paymentData.cryptoOptions.supportedTokens.map(token => (
                    <Badge key={token} variant="outline">{token}</Badge>
                  ))}
                </div>
              </div>

              {!connected ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to pay with crypto
                  </p>
                  <WalletMultiButton className="!bg-gradient-to-r !from-teal-500 !to-green-500" />
                </div>
              ) : (
                <Button 
                  onClick={handleCryptoPayment}
                  className="w-full bg-gradient-to-r from-teal-500 to-green-500"
                >
                  Pay with Crypto
                </Button>
              )}

              <Button variant="outline" onClick={() => setSelectedMethod(null)} className="w-full">
                Back to Options
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Fiat Payment Interface */}
        {selectedMethod === 'fiat' && paymentData.fiatOptions && (
          <div className="space-y-4">
            {!selectedFiatMethod ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Traditional Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentData.fiatOptions.paymentMethods.map(method => (
                    <Card
                      key={method}
                      className="cursor-pointer hover:shadow-md transition-shadow border hover:border-blue-200"
                      onClick={() => setSelectedFiatMethod(method)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {PAYMENT_INSTRUCTIONS[method as keyof typeof PAYMENT_INSTRUCTIONS]?.icon ||
                           <CreditCard className="h-5 w-5 text-blue-500" />}
                          <span className="font-medium">{method}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" onClick={() => setSelectedMethod(null)} className="w-full">
                    Back to Options
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {PAYMENT_INSTRUCTIONS[selectedFiatMethod as keyof typeof PAYMENT_INSTRUCTIONS]?.icon ||
                     <CreditCard className="h-5 w-5 text-blue-500" />}
                    {PAYMENT_INSTRUCTIONS[selectedFiatMethod as keyof typeof PAYMENT_INSTRUCTIONS]?.title || selectedFiatMethod}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Details */}
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Account Holder:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(paymentData.fiatOptions!.accountHolder, 'Account holder name')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-medium bg-white p-2 rounded text-center">
                          {paymentData.fiatOptions.accountHolder}
                        </p>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Account Number:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(paymentData.fiatOptions!.accountNumber, 'Account number')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-mono font-medium bg-white p-2 rounded text-center">
                          {paymentData.fiatOptions.accountNumber}
                        </p>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Bank:</span>
                          <span className="font-medium">{paymentData.fiatOptions.bankName}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Amount:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${paymentData.amount}`, 'Amount')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-bold text-lg bg-white p-2 rounded text-center text-blue-600">
                          {paymentData.amount} {paymentData.currency}
                        </p>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Reference:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(paymentData.id, 'Payment reference')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-mono text-sm bg-white p-2 rounded text-center">
                          {paymentData.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  {PAYMENT_INSTRUCTIONS[selectedFiatMethod as keyof typeof PAYMENT_INSTRUCTIONS] && (
                    <div className="space-y-3">
                      <h4 className="font-medium">How to Pay:</h4>
                      <ol className="space-y-2">
                        {PAYMENT_INSTRUCTIONS[selectedFiatMethod as keyof typeof PAYMENT_INSTRUCTIONS].steps.map((step, index) => (
                          <li key={index} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Important Notes */}
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Important:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Use the exact amount: {paymentData.amount} {paymentData.currency}</li>
                      <li>• Include the reference: {paymentData.id}</li>
                      <li>• Payment expires in {timeLeft}</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={completeFiatPayment}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                    >
                      I've Made the Payment
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFiatMethod('')}
                      >
                        Back
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Open banking app or USSD (platform specific)
                          toast({
                            title: "Opening Payment App",
                            description: "This would open your banking app or USSD",
                          });
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open App
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

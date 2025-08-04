import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  QrCode, 
  Smartphone, 
  DollarSign, 
  Wallet, 
  CreditCard,
  Copy,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { HybridMerchantProfile } from './HybridMerchantAuth';

interface HybridPaymentData {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  description: string;
  
  // Payment options
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
  
  // QR code data
  qrCodeUrl: string;
  paymentUrl: string;
  
  // Status
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

interface HybridPOSProps {
  merchant: HybridMerchantProfile;
}

export const HybridPOS = ({ merchant }: HybridPOSProps) => {
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(merchant.defaultCurrency);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<HybridPaymentData | null>(null);

  const generateHybridPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

      // Create hybrid payment data
      const paymentData: HybridPaymentData = {
        id: paymentId,
        merchantId: merchant.id,
        amount: parseFloat(amount),
        currency,
        description: description || 'Payment',
        cryptoOptions: {
          wallet: merchant.cryptoWallet,
          supportedTokens: merchant.supportedCryptos
        },
        fiatOptions: merchant.enableHybridPayments ? {
          accountNumber: merchant.bankAccount!,
          bankName: merchant.bankName || 'Bank',
          accountHolder: merchant.accountHolderName!,
          paymentMethods: merchant.supportedFiatMethods
        } : undefined,
        qrCodeUrl: '',
        paymentUrl: '',
        status: 'pending',
        createdAt: now,
        expiresAt
      };

      // Generate payment URL for mobile interface
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/hybrid-pay?id=${paymentId}`;
      
      // Store payment data (in production, save to database)
      localStorage.setItem(`hybrid_payment_${paymentId}`, JSON.stringify(paymentData));

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      paymentData.qrCodeUrl = qrCodeDataUrl;
      paymentData.paymentUrl = paymentUrl;

      // Update stored data
      localStorage.setItem(`hybrid_payment_${paymentId}`, JSON.stringify(paymentData));

      setCurrentPayment(paymentData);

      toast({
        title: "Hybrid Payment Created!",
        description: "Customer can scan QR code to choose payment method",
      });

    } catch (error) {
      console.error('Error generating hybrid payment:', error);
      toast({
        title: "Error",
        description: "Failed to generate payment QR code",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetPayment = () => {
    setCurrentPayment(null);
    setAmount('');
    setDescription('');
  };

  const copyPaymentUrl = () => {
    if (currentPayment) {
      navigator.clipboard.writeText(currentPayment.paymentUrl);
      toast({
        title: "Copied!",
        description: "Payment URL copied to clipboard",
      });
    }
  };

  // Check payment status (in production, use real-time updates)
  useEffect(() => {
    if (!currentPayment) return;

    const checkStatus = () => {
      const stored = localStorage.getItem(`hybrid_payment_${currentPayment.id}`);
      if (stored) {
        const updated = JSON.parse(stored);
        if (updated.status !== currentPayment.status) {
          setCurrentPayment(updated);
          if (updated.status === 'completed') {
            toast({
              title: "Payment Received!",
              description: `${updated.amount} ${updated.currency} payment completed`,
            });
          }
        }
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [currentPayment, toast]);

  if (currentPayment) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        {/* Payment Status */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {currentPayment.amount} {currentPayment.currency}
            </CardTitle>
            <CardDescription>
              {currentPayment.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* QR Code */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img 
                src={currentPayment.qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-64 h-64 mx-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Customer scans this QR code to choose payment method
            </p>
            
            {/* Payment Status */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {currentPayment.status === 'pending' && (
                <>
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">Waiting for payment</span>
                </>
              )}
              {currentPayment.status === 'completed' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Payment completed</span>
                </>
              )}
              {currentPayment.status === 'expired' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Payment expired</span>
                </>
              )}
            </div>

            {/* Payment Options Preview */}
            <div className="text-left space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-teal-500" />
                <span>Crypto: {merchant.supportedCryptos.join(', ')}</span>
              </div>
              {merchant.enableHybridPayments && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>Fiat: {merchant.supportedFiatMethods.slice(0, 2).join(', ')}</span>
                  {merchant.supportedFiatMethods.length > 2 && (
                    <span className="text-muted-foreground">+{merchant.supportedFiatMethods.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={copyPaymentUrl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={resetPayment}>
            <RefreshCw className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>

        {/* Expiry Timer */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Expires: {currentPayment.expiresAt.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Hybrid POS Terminal
          </CardTitle>
          <CardDescription>
            Generate QR codes for crypto + fiat payments
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {merchant.supportedCurrencies.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this payment for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Payment Methods Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Available Payment Methods:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-teal-50 text-teal-700">
                  Crypto
                </Badge>
                <span className="text-muted-foreground">
                  {merchant.supportedCryptos.join(', ')}
                </span>
              </div>
              {merchant.enableHybridPayments && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Fiat
                  </Badge>
                  <span className="text-muted-foreground">
                    {merchant.supportedFiatMethods.slice(0, 2).join(', ')}
                    {merchant.supportedFiatMethods.length > 2 && ` +${merchant.supportedFiatMethods.length - 2} more`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateHybridPayment}
            disabled={isGenerating || !amount}
            className="w-full bg-gradient-to-r from-teal-500 to-green-500"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate Payment QR
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

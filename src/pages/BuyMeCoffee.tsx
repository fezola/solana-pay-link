import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Coffee,
  Heart,
  Gift,
  Star,
  ExternalLink,
  Copy,
  QrCode,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createInvoice,
  generatePaymentURL,
  saveInvoice,
  SPL_TOKENS
} from '@/lib/payment-utils';
import { setupDemoMerchant } from '@/lib/demo-setup';
import { NetworkDebug } from '@/components/NetworkDebug';
import { USDCFaucet } from '@/components/USDCFaucet';
import {
  createBasePayment,
  getBasePaymentStatus,
  BASE_USDC,
  BASE_PAY_CONFIG,
  formatBaseAddress,
  createBasePayButtonData
} from '@/lib/base-pay';
// import { BasePayButton, OfficialBasePayButton } from '@/components/BasePayButton'; // Temporarily removed for demo
import QRCodeLib from 'qrcode';

// Mock merchant data - in a real app this would come from a database
const MERCHANT_DATA = {
  id: 'coffee_merchant_001',
  name: 'Alex\'s Coffee Corner',
  description: 'Supporting my coding journey, one coffee at a time! ☕',
  walletAddress: 'HH6V2MRkEbVaYwsas3YrxuhKFKWW1wvp6kbX51SA8UoU', // Solana
  baseWalletAddress: '0x4c4838D1CBeA08ad2288C5630d1953C12e32886b', // Base network (testnet)


  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=300&fit=crop',
  totalSupported: 127,
  totalAmount: 2847.50,
  recentSupporters: [
    { name: 'Anonymous', amount: 5, message: 'Keep up the great work!' },
    { name: 'CryptoFan', amount: 10, message: 'Love your tutorials!' },
    { name: 'DevSupporter', amount: 25, message: 'Thanks for the open source contributions' }
  ]
};

const COFFEE_AMOUNTS = [
  { label: '☕ Buy a Coffee', amount: 0.1, description: 'A small token of appreciation' },
  { label: '🥪 Buy Lunch', amount: 0.5, description: 'Fuel for a productive day' },
  { label: '🍕 Buy Dinner', amount: 1.0, description: 'A hearty meal to keep coding' },
  { label: '💝 Custom Amount', amount: 0, description: 'Choose your own amount' }
];

export const BuyMeCoffee = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [supporterName, setSupporterName] = useState('');
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);

  // Payment network selection
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'base'>('solana');
  const [basePaymentId, setBasePaymentId] = useState<string>('');
  const [basePaymentStatus, setBasePaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);


  // Check if we're in payment mode and setup demo merchant
  useEffect(() => {
    // Setup demo merchant on page load
    setupDemoMerchant();

    const amount = searchParams.get('amount');
    const token = searchParams.get('token');
    const msg = searchParams.get('message');

    if (amount) {
      setSelectedAmount(parseFloat(amount));
      setShowPayment(true);
    }
    if (token) setSelectedToken(token);
    if (msg) setMessage(decodeURIComponent(msg));
  }, [searchParams]);

  const handleAmountSelect = (amount: number) => {
    if (amount === 0) {
      setSelectedAmount(0);
    } else {
      setSelectedAmount(amount);
      setCustomAmount('');
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue);
    }
  };

  const generatePayment = async () => {
    const finalAmount = selectedAmount || parseFloat(customAmount);

    if (!finalAmount || finalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      if (selectedNetwork === 'solana') {
        // Solana payment flow
        const invoice = createInvoice({
          recipient: MERCHANT_DATA.walletAddress,
          amount: finalAmount.toString(),
          token: selectedToken,
          title: `${supporterName || 'Anonymous'} - Coffee Support`,
          description: message || `Supporting ${MERCHANT_DATA.name}`,
          expiresIn: 30 // 30 minutes
        });

        // Generate payment URL
        const url = generatePaymentURL(invoice);

        // Generate QR code
        const qrCodeData = await QRCodeLib.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Save invoice
        saveInvoice(invoice);

        setPaymentLink(url);
        setInvoiceId(invoice.id);
        setQrCode(qrCodeData);

      } else {
        // Base Pay flow - just show the payment interface
        setShowPayment(true);
      }

      setShowPayment(true);

      toast({
        title: "Payment Link Generated!",
        description: `Your ${selectedNetwork === 'solana' ? 'Solana' : 'Base'} payment is ready`,
      });

    } catch (error) {
      console.error('Error generating payment:', error);
      toast({
        title: "Error",
        description: "Failed to generate payment link",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Poll Base Pay payment status
  const pollBasePaymentStatus = async (paymentId: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await getBasePaymentStatus(paymentId, true);
        setBasePaymentStatus(status.status);

        if (status.status === 'completed') {
          toast({
            title: "Payment Completed!",
            description: "Your Base Pay USDC payment was successful",
          });
          return;
        } else if (status.status === 'failed') {
          toast({
            title: "Payment Failed",
            description: "Your Base Pay payment could not be completed",
            variant: "destructive"
          });
          return;
        }

        // Continue polling if pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling Base Pay status:', error);
      }
    };

    poll();
  };

  const copyPaymentLink = async () => {
    if (selectedNetwork === 'base') {
      // For Base Pay, copy the payment ID
      if (basePaymentId) {
        await navigator.clipboard.writeText(`Base Pay ID: ${basePaymentId}`);
      }
    } else {
      // For Solana payments, copy the checkout URL
      const checkoutUrl = `${window.location.origin}/checkout?invoice=${invoiceId}`;
      await navigator.clipboard.writeText(checkoutUrl);
    }
    toast({
      title: "Copied!",
      description: "Payment information copied to clipboard",
    });
  };

  const openCheckout = () => {
    if (selectedNetwork === 'base') {
      // For Base Pay, show instructions
      toast({
        title: "Base Pay Instructions",
        description: "Base Pay requires the @base-org/account SDK. Payment ID: " + basePaymentId,
      });
    } else {
      // For Solana payments, use the checkout page
      if (invoiceId) {
        window.location.href = `/checkout?invoice=${invoiceId}`;
      }
    }
  };

  const openInWallet = () => {
    if (selectedNetwork === 'base') {
      // For Base Pay, show instructions
      toast({
        title: "Base Pay",
        description: "Base Pay uses smart wallet integration. Install @base-org/account SDK.",
      });
    } else {
      // For Solana payments
      if (paymentLink) {
        window.open(paymentLink, '_self');
      }
    }
  };



  // Payment view
  if (showPayment && (paymentLink || selectedNetwork === 'base')) {
    const isBasePayment = selectedNetwork === 'base';
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setShowPayment(false)}
                className="mb-4"
              >
                ← Back to Support Page
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Support</h1>
              <p className="text-gray-600">Supporting {MERCHANT_DATA.name}</p>
            </div>

            {/* Payment Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className={`text-center text-white rounded-t-lg ${
                isBasePayment
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}>
                <div className="flex items-center justify-center gap-3">
                  <Coffee className="h-6 w-6" />
                  <div>
                    <CardTitle>
                      ${selectedAmount} USD
                      {isBasePayment && (
                        <span className="text-sm font-normal ml-2">
                          (USDC on Base)
                        </span>
                      )}
                      {!isBasePayment && (
                        <span className="text-sm font-normal ml-2">
                          ({selectedToken} on Solana)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className={isBasePayment ? 'text-blue-100' : 'text-orange-100'}>
                      {message || 'Coffee support'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {isBasePayment ? (
                  /* Base Pay Button */
                  <div className="text-center">
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center justify-center mb-4">
                        <img src={BASE_USDC.logo} alt="USDC" className="w-16 h-16" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-900 mb-2">Base Pay - USDC Payment</h3>
                      <p className="text-sm text-blue-700 mb-6">
                        Fast, secure USDC payment on Base network. No gas fees, settles in seconds.
                      </p>

                      {/* Base Pay Button - Temporarily Disabled */}
                      <div className="flex justify-center mb-4">
                        <Button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          Base Pay - Coming Soon
                        </Button>
                      </div>
                      <div className="text-center text-sm text-gray-500 mb-4">
                        Base Pay functionality is temporarily disabled for demo recording.
                      </div>

                      <div className="text-xs text-blue-600 space-y-1">
                        <p>💡 One-tap payment with Base Account</p>
                        <p>🔒 Secure USDC transfer on Base network</p>
                        <p>⚡ No gas fees for you</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Solana QR Code */
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
                      <img src={qrCode} alt="Payment QR Code" className="w-48 h-48" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        Scan with Solana Wallet
                      </p>
                      <p className="text-xs text-gray-500">
                        Phantom, Solflare, or any Solana Pay compatible wallet
                      </p>
                      <p className="text-xs text-orange-600">
                        ⚠️ If QR scanner suggests "Base", ignore it - this is a Solana payment
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={openCheckout}
                    className={`w-full ${
                      isBasePayment
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                    }`}
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Continue to {isBasePayment ? 'Base' : 'Solana'} Payment
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={openInWallet}
                      className="w-full"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Open in Wallet
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copyPaymentLink}
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{selectedAmount} {selectedToken}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">To:</span>
                    <span className="font-mono text-xs">{MERCHANT_DATA.walletAddress.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <Badge variant="outline">Solana Devnet</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Cover Image */}
      <div 
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${MERCHANT_DATA.coverImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-3xl font-bold">{MERCHANT_DATA.name}</h1>
          <p className="text-orange-200">Buy me a coffee ☕</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Card */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={MERCHANT_DATA.avatar} />
                      <AvatarFallback>AC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{MERCHANT_DATA.name}</h2>
                      <p className="text-gray-600 mt-1">{MERCHANT_DATA.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          {MERCHANT_DATA.totalSupported} supporters
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          ${MERCHANT_DATA.totalAmount.toLocaleString()} raised
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Form */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-orange-500" />
                    Support Alex
                  </CardTitle>
                  <CardDescription>
                    Show your appreciation with a crypto coffee!
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Choose an amount
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {COFFEE_AMOUNTS.map((coffee) => (
                        <Button
                          key={coffee.label}
                          variant={selectedAmount === coffee.amount && coffee.amount > 0 ? "default" : "outline"}
                          onClick={() => handleAmountSelect(coffee.amount)}
                          className="h-auto p-4 flex flex-col items-start"
                        >
                          <span className="font-medium">{coffee.label}</span>
                          <span className="text-xs text-gray-500">{coffee.description}</span>
                          {coffee.amount > 0 && (
                            <span className="text-sm font-bold mt-1">${coffee.amount}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  {selectedAmount === 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Custom Amount
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Token Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Payment Token
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(SPL_TOKENS).map(([symbol, token]) => (
                        <Button
                          key={symbol}
                          variant={selectedToken === symbol ? "default" : "outline"}
                          onClick={() => setSelectedToken(symbol)}
                          className="h-auto p-3 flex flex-col items-center gap-2"
                        >
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-6 h-6"
                            onError={(e) => {
                              // Fallback to text if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-xs font-medium">{token.symbol}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Message (Optional)
                    </label>
                    <Textarea
                      placeholder="Say something nice..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Your Name (Optional)
                    </label>
                    <Input
                      placeholder="Anonymous"
                      value={supporterName}
                      onChange={(e) => setSupporterName(e.target.value)}
                    />
                  </div>

                  {/* Payment Network Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Payment Network
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setSelectedNetwork('solana')}
                        className={`px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                          selectedNetwork === 'solana'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <img
                            src="/solana-sol-logo.png"
                            alt="Solana"
                            className="w-5 h-5"
                          />
                          <span>Solana</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">SOL, USDC</div>
                      </button>
                      <button
                        disabled
                        className="px-3 py-3 text-sm font-medium rounded-md bg-gray-200 text-gray-400 cursor-not-allowed"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <img
                            src="/usd-coin-usdc-logo.png"
                            alt="Base"
                            className="w-5 h-5 opacity-50"
                          />
                          <span>Base Pay</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Coming Soon</div>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedNetwork === 'solana'
                        ? 'Pay with SOL or USDC on Solana network. Fast and low fees.'
                        : 'Pay with USDC on Base network. One-tap payments, no gas fees.'
                      }
                    </p>
                  </div>



                  {/* Support Button */}
                  <Button
                    onClick={generatePayment}
                    disabled={isGenerating || (!selectedAmount && !customAmount)}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Coffee className="h-4 w-4 mr-2 animate-spin" />
                        Generating Payment...
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Support with {selectedAmount || customAmount} {selectedToken}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Network Debug */}
              <NetworkDebug />

              {/* USDC Faucet */}
              <USDCFaucet />

              {/* Recent Supporters */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Supporters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MERCHANT_DATA.recentSupporters.map((supporter, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{supporter.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{supporter.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            ${supporter.amount}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{supporter.message}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* How it Works */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="text-sm font-medium">Choose Amount</p>
                      <p className="text-xs text-gray-600">Select a preset amount or enter custom</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="text-sm font-medium">Generate Payment</p>
                      <p className="text-xs text-gray-600">Get QR code and payment link</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="text-sm font-medium">Connect Wallet</p>
                      <p className="text-xs text-gray-600">Use Phantom, Solflare, or any Solana wallet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <p className="text-sm font-medium">Approve Payment</p>
                      <p className="text-xs text-gray-600">Confirm transaction in your wallet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Coffee className="h-12 w-12 mx-auto mb-3 opacity-80" />
                    <h3 className="font-bold mb-2">Powered by Solana</h3>
                    <p className="text-sm opacity-90">
                      Fast, secure, and low-cost payments using cryptocurrency
                    </p>
                    <Badge variant="secondary" className="mt-3 text-orange-600">
                      Devnet (Test Network)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

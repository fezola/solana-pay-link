import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  QrCode,
  Store,
  DollarSign,
  Smartphone,
  Copy,
  RefreshCw,
  Wallet,
  Plus,
  Minus,
  CreditCard,
  Building,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { getCurrentMerchant } from '@/lib/merchant-auth';
import { createInvoice, generatePaymentURL } from '@/lib/payment-utils';
import QRCode from 'qrcode';

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CurrentPayment {
  qrCode: string;
  paymentUrl: string;
  amount: number;
  reference: string;
  isHybrid?: boolean;
}

export const MerchantPOS: React.FC = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [merchant, setMerchant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // POS State
  const [cart, setCart] = useState<POSItem[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<'fixed' | 'custom'>('custom');

  // Hybrid Payment State
  const [isHybridMode, setIsHybridMode] = useState(false);
  const [hybridConfig, setHybridConfig] = useState({
    bankAccount: '',
    bankName: '',
    accountHolder: '',
    supportedFiatMethods: ['Bank Transfer', 'Mobile Money'],
    country: 'NG', // Default to Nigeria
    localCurrency: 'NGN'
  });

  // Payment State
  const [currentPayment, setCurrentPayment] = useState<CurrentPayment | null>(null);

  // Merchant's custom menu items
  const [menuItems, setMenuItems] = useState<Array<{name: string, price: number}>>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedToken, setSelectedToken] = useState<'SOL' | 'USDC'>('SOL');

  // Load merchant data
  useEffect(() => {
    const loadMerchant = async () => {
      if (connected && publicKey) {
        try {
          const currentMerchant = await getCurrentMerchant(publicKey);
          if (currentMerchant) {
            // Ensure walletAddress is properly handled
            const safeMerchant = {
              ...currentMerchant,
              walletAddress: typeof currentMerchant.walletAddress === 'string'
                  ? currentMerchant.walletAddress
                  : currentMerchant.walletAddress.toString()
            };
            setMerchant(safeMerchant);
          }
        } catch (error) {
          console.error('Error loading merchant:', error);
        }
      } else {
        setMerchant(null);
      }
    };
    loadMerchant();
  }, [connected, publicKey]);

  const addMenuItem = () => {
    if (newItemName && newItemPrice && parseFloat(newItemPrice) > 0) {
      setMenuItems([...menuItems, {
        name: newItemName,
        price: parseFloat(newItemPrice)
      }]);
      setNewItemName('');
      setNewItemPrice('');
      toast({
        title: "Menu Item Added",
        description: `${newItemName} added to your menu`,
      });
    }
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const addToCart = (item: { name: string; price: number }) => {
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
      setCart(cart.map(cartItem =>
          cartItem.name === item.name
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
      ));
    } else {
      setCart([...cart, {
        id: Date.now().toString(),
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as POSItem[]);
  };

  const getTotalAmount = () => {
    if (paymentMode === 'custom') {
      return parseFloat(customAmount) || 0;
    }
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generatePaymentQR = async () => {
    const amount = getTotalAmount();
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount or add items to cart",
        variant: "destructive"
      });
      return;
    }

    if (!merchant) {
      toast({
        title: "Business Not Registered",
        description: "Please register your business first",
        variant: "destructive"
      });
      return;
    }

    // Check hybrid mode requirements
    if (isHybridMode && (!hybridConfig.bankAccount || !hybridConfig.accountHolder)) {
      toast({
        title: "Hybrid Setup Incomplete",
        description: "Please configure bank account details for hybrid payments",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const description = paymentMode === 'custom'
          ? customerNote || 'In-store payment'
          : cart.map(item => `${item.quantity}x ${item.name}`).join(', ');

      if (isHybridMode) {
        // Generate hybrid payment data
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const hybridPaymentData = {
          id: paymentId,
          merchantId: merchant.id || 'merchant_demo',
          amount,
          currency: hybridConfig.localCurrency,
          description,
          cryptoOptions: {
            wallet: merchant.walletAddress,
            supportedTokens: ['SOL', 'USDC', 'USDT']
          },
          fiatOptions: {
            accountNumber: hybridConfig.bankAccount,
            bankName: hybridConfig.bankName,
            accountHolder: hybridConfig.accountHolder,
            paymentMethods: hybridConfig.supportedFiatMethods
          },
          status: 'pending',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        };

        // Store payment data
        localStorage.setItem(`hybrid_payment_${paymentId}`, JSON.stringify(hybridPaymentData));

        // Generate hybrid payment URL
        const baseUrl = window.location.origin;
        const hybridPaymentUrl = `${baseUrl}/hybrid-pay?id=${paymentId}`;

        // Generate QR code for hybrid payment
        const qrCodeDataUrl = await QRCode.toDataURL(hybridPaymentUrl, {
          width: 400,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        });

        setCurrentPayment({
          qrCode: qrCodeDataUrl,
          paymentUrl: hybridPaymentUrl,
          amount,
          reference: paymentId,
          isHybrid: true
        });

      } else {
        // Original crypto-only payment
        const recipientAddress = merchant.walletAddress;

        const invoice = createInvoice({
          amount: amount.toString(),
          token: selectedToken,
          recipient: recipientAddress,
          title: paymentMode === 'custom' ? 'Custom Payment' : 'Store Purchase',
          description
        });

        // Generate Solana Pay URL
        const paymentUrl = generatePaymentURL(invoice);

        // Create explicit Solana Pay URL
        const solanaPayUrl = paymentUrl.startsWith('solana:')
            ? paymentUrl
            : `solana:${merchant.walletAddress}?amount=${amount}&reference=${invoice.reference.toString()}&label=${encodeURIComponent(invoice.title)}&message=${encodeURIComponent(invoice.description)}`;

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(solanaPayUrl, {
          width: 400,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        });

        setCurrentPayment({
          qrCode: qrCodeDataUrl,
          paymentUrl,
          amount,
          reference: invoice.reference.toString(),
          isHybrid: false
        });
      }

      toast({
        title: "Payment QR Generated",
        description: "Customer can scan the QR code to pay",
      });

    } catch (error) {
      console.error('Error generating payment QR:', error);
      toast({
        title: "Error",
        description: "Failed to generate payment QR code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPayment = () => {
    setCurrentPayment(null);
    setCart([]);
    setCustomAmount('');
    setCustomerNote('');
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

  if (!connected) {
    return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-20">
            <div className="text-center max-w-md mx-auto">
              <Wallet className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to access the Point of Sale system
              </p>
            </div>
          </div>
        </div>
    );
  }

  if (!merchant) {
    return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-20">
            <div className="text-center max-w-md mx-auto">
              <Store className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-4">Business Registration Required</h2>
              <p className="text-muted-foreground mb-6">
                Please register your business first to use the POS system
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Register Business
              </Button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Point of Sale
            </h1>
            <p className="text-muted-foreground">
              Accept Solana payments in your physical store
            </p>
          </div>

          {/* Single Page Layout */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {merchant.businessName}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>Accepting</span>
                  <img
                      src={selectedToken === 'SOL' ? '/solana-sol-logo.png' : '/usd-coin-usdc-logo.png'}
                      alt={selectedToken}
                      className="w-4 h-4"
                  />
                  <span>{selectedToken} payments</span>
                  <span>•</span>
                  <span>Wallet: {merchant.walletAddress?.slice(0, 8)}...{merchant.walletAddress?.slice(-8)}</span>
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Token Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Token</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                      variant={selectedToken === 'SOL' ? 'default' : 'outline'}
                      onClick={() => setSelectedToken('SOL')}
                      className="h-20 flex flex-col gap-2"
                  >
                    <img src="/solana-sol-logo.png" alt="Solana" className="w-8 h-8" />
                    <span className="font-medium">SOL</span>
                  </Button>
                  <Button
                      variant={selectedToken === 'USDC' ? 'default' : 'outline'}
                      onClick={() => setSelectedToken('USDC')}
                      className="h-20 flex flex-col gap-2"
                  >
                    <img src="/usd-coin-usdc-logo.png" alt="USDC" className="w-8 h-8" />
                    <span className="font-medium">USDC</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Mode & Options */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Payment Mode Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Payment Mode</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                          variant={paymentMode === 'custom' ? 'default' : 'outline'}
                          onClick={() => setPaymentMode('custom')}
                          className="h-16 flex flex-col gap-2"
                      >
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm">Custom Amount</span>
                      </Button>
                      <Button
                          variant={paymentMode === 'fixed' ? 'default' : 'outline'}
                          onClick={() => setPaymentMode('fixed')}
                          className="h-16 flex flex-col gap-2"
                      >
                        <QrCode className="w-5 h-5" />
                        <span className="text-sm">Menu Items</span>
                      </Button>
                    </div>
                  </div>

                  {/* Payment Type Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Payment Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                          variant={!isHybridMode ? 'default' : 'outline'}
                          onClick={() => setIsHybridMode(false)}
                          className="h-20 flex flex-col gap-1 p-3 justify-center items-center text-center overflow-hidden"
                      >
                        <Wallet className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium leading-tight">Crypto Only</span>
                        <span className="text-xs text-muted-foreground leading-tight">SOL, USDC</span>
                      </Button>
                      <Button
                          variant={isHybridMode ? 'default' : 'outline'}
                          onClick={() => setIsHybridMode(true)}
                          className="h-20 flex flex-col gap-1 p-3 justify-center items-center text-center overflow-hidden"
                      >
                        <CreditCard className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium leading-tight">Hybrid Payment</span>
                        <span className="text-xs text-muted-foreground leading-tight">Crypto + Fiat</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hybrid Configuration */}
            {isHybridMode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Bank Account Setup
                    </CardTitle>
                    <CardDescription>
                      Configure your bank details for traditional payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">Account Holder</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                              id="accountHolder"
                              placeholder="Full name"
                              value={hybridConfig.accountHolder}
                              onChange={(e) => setHybridConfig(prev => ({ ...prev, accountHolder: e.target.value }))}
                              className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAccount">Account Number</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                              id="bankAccount"
                              placeholder="Account number"
                              value={hybridConfig.bankAccount}
                              onChange={(e) => setHybridConfig(prev => ({ ...prev, bankAccount: e.target.value }))}
                              className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                              id="bankName"
                              placeholder="Bank name"
                              value={hybridConfig.bankName}
                              onChange={(e) => setHybridConfig(prev => ({ ...prev, bankName: e.target.value }))}
                              className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="text-sm text-teal-800">
                        <strong>Hybrid Mode:</strong> Customers will see both crypto and bank transfer options when they scan your QR code.
                      </p>
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Custom Amount Mode */}
            {paymentMode === 'custom' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount ({selectedToken})</Label>
                      <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="note">Customer Note (Optional)</Label>
                      <Input
                          id="note"
                          placeholder="e.g., Coffee and pastry"
                          value={customerNote}
                          onChange={(e) => setCustomerNote(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Menu Items Mode */}
            {paymentMode === 'fixed' && (
                <>
                  {/* Add New Menu Item */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Menu Item</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="itemName">Item Name</Label>
                          <Input
                              id="itemName"
                              placeholder="e.g., Coffee"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="itemPrice">Price ({selectedToken})</Label>
                          <Input
                              id="itemPrice"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newItemPrice}
                              onChange={(e) => setNewItemPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button onClick={addMenuItem} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Menu
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Your Menu Items */}
                  {menuItems.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Your Menu Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {menuItems.map((item, index) => (
                                <div key={index} className="relative">
                                  <Button
                                      variant="outline"
                                      onClick={() => addToCart(item)}
                                      className="h-16 w-full flex flex-col gap-1"
                                  >
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-muted-foreground">{item.price} {selectedToken}</span>
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeMenuItem(index)}
                                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  >
                                    ×
                                  </Button>
                                </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                  )}

                  {/* Shopping Cart */}
                  {cart.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Cart</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                              {item.price} {selectedToken} each
                            </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateQuantity(item.id, -1)}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateQuantity(item.id, 1)}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{getTotalAmount()} {selectedToken}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  )}
                </>
            )}

            {/* Payment Generation Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Ready to Accept Payments
                </CardTitle>
                <CardDescription>
                  Enter an amount or add items to cart, then generate a payment QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                    onClick={generatePaymentQR}
                    disabled={isLoading || getTotalAmount() <= 0}
                    className={`w-full h-12 ${
                        isHybridMode
                            ? 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                            : ''
                    }`}
                    size="lg"
                >
                  {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                  ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        {isHybridMode
                            ? `Generate Hybrid QR (${getTotalAmount()} ${hybridConfig.localCurrency})`
                            : `Generate Payment QR (${getTotalAmount()} ${selectedToken})`
                        }
                      </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Payment Display Section */}
            <div className="space-y-6">
              {currentPayment && (
                  <>
                    {/* QR Code Display */}
                    <Card className={`border-2 ${currentPayment.isHybrid ? 'border-teal-500/20' : 'border-purple-500/20'}`}>
                      <CardHeader>
                        <CardTitle className="text-center flex items-center justify-center gap-2">
                          {currentPayment.isHybrid ? (
                              <>
                                <Wallet className="w-6 h-6 text-teal-500" />
                                <span>HYBRID PAYMENT QR CODE</span>
                                <CreditCard className="w-6 h-6 text-blue-500" />
                              </>
                          ) : (
                              <>
                                <img src="/solana-sol-logo.png" alt="Solana" className="w-6 h-6" />
                                <span>{selectedToken} PAYMENT QR CODE</span>
                                <img
                                    src={selectedToken === 'SOL' ? '/solana-sol-logo.png' : '/usd-coin-usdc-logo.png'}
                                    alt={selectedToken}
                                    className="w-6 h-6"
                                />
                              </>
                          )}
                        </CardTitle>
                        <CardDescription className={`text-center font-medium ${
                            currentPayment.isHybrid ? 'text-teal-600' : 'text-purple-600'
                        }`}>
                          {currentPayment.isHybrid
                              ? '📱 SCAN TO CHOOSE: CRYPTO OR BANK TRANSFER'
                              : '📱 SCAN WITH SOLANA WALLET (Phantom, Solflare, etc.)'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <div className="bg-white p-8 rounded-xl inline-block border-2 border-gray-300">
                          <div className="relative">
                            <img
                                src={currentPayment.qrCode}
                                alt={`${selectedToken} Payment QR Code`}
                                className="w-80 h-80 mx-auto"
                            />
                            <div className="absolute top-2 left-2 bg-black text-white px-3 py-2 rounded flex items-center gap-2">
                              <img
                                  src={selectedToken === 'SOL' ? '/solana-sol-logo.png' : '/usd-coin-usdc-logo.png'}
                                  alt={selectedToken}
                                  className="w-4 h-4"
                              />
                              <span className="text-xs font-bold">{selectedToken}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Badge variant="outline" className="text-lg px-4 py-2">
                            {currentPayment.amount} {currentPayment.isHybrid ? hybridConfig.localCurrency : selectedToken}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            Reference: {currentPayment.reference}
                          </p>
                        </div>

                        {/* Payment Options Display */}
                        {currentPayment.isHybrid && (
                            <div className="space-y-3">
                              <div className="text-sm font-medium">Available Payment Methods:</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg border border-teal-200">
                                  <Wallet className="w-4 h-4 text-teal-500" />
                                  <span className="text-xs font-medium">Crypto</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                  <CreditCard className="w-4 h-4 text-blue-500" />
                                  <span className="text-xs font-medium">Bank Transfer</span>
                                </div>
                              </div>
                            </div>
                        )}

                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {currentPayment.isHybrid ? 'Hybrid Payment' : 'Solana Pay'} URL:
                            <code className="bg-muted px-1 rounded text-xs ml-1">
                              {currentPayment.paymentUrl.slice(0, 30)}...
                            </code>
                          </div>
                          <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={copyPaymentUrl}
                                className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy URL
                            </Button>
                            <Button
                                onClick={resetPayment}
                                className={`flex-1 ${
                                    currentPayment.isHybrid
                                        ? 'bg-teal-500 hover:bg-teal-600'
                                        : 'bg-purple-500 hover:bg-purple-600'
                                }`}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              New Payment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Instructions */}
                    <Alert className={`${
                        currentPayment.isHybrid
                            ? 'border-teal-500/20 bg-teal-500/5'
                            : 'border-green-500/20 bg-green-500/5'
                    }`}>
                      <Smartphone className={`h-4 w-4 ${
                          currentPayment.isHybrid ? 'text-teal-500' : 'text-green-500'
                      }`} />
                      <AlertDescription>
                        {currentPayment.isHybrid ? (
                            <>
                              <strong className="text-teal-600">📱 HYBRID PAYMENT INSTRUCTIONS:</strong><br />
                              1. <strong>Open your phone camera</strong> and scan the QR code<br />
                              2. <strong>Choose your payment method:</strong><br />
                              &nbsp;&nbsp;&nbsp;• <strong>Crypto:</strong> Pay with SOL, USDC, or USDT<br />
                              &nbsp;&nbsp;&nbsp;• <strong>Bank Transfer:</strong> Pay with {hybridConfig.localCurrency}<br />
                              3. <strong>Follow the instructions</strong> for your chosen method<br />
                              4. <strong>Payment confirmed</strong> automatically<br />
                              <br />
                              <span className="text-blue-600 font-medium">💡 One QR code, multiple payment options!</span>
                            </>
                        ) : (
                            <>
                              <strong className="text-green-600">📱 SCANNING INSTRUCTIONS:</strong><br />
                              1. <strong>Open your phone camera</strong> or Solana wallet app<br />
                              2. <strong>Point at the QR code</strong> above<br />
                              3. <strong>Tap the notification</strong> when it appears<br />
                              4. <strong>Choose Solana wallet</strong> (Phantom/Solflare)<br />
                              5. <strong>Confirm payment</strong> in your wallet<br />
                              <br />
                              <span className="text-blue-600 font-medium">💡 QR code is now HIGH CONTRAST for better camera detection!</span>
                            </>
                        )}
                      </AlertDescription>
                    </Alert>
                  </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};
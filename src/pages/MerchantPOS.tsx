import { useState, useEffect } from 'react';
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
  Minus
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

export const MerchantPOS = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [merchant, setMerchant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // POS State
  const [cart, setCart] = useState<POSItem[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<'fixed' | 'custom'>('custom');
  
  // Payment State
  const [currentPayment, setCurrentPayment] = useState<{
    qrCode: string;
    paymentUrl: string;
    amount: number;
    reference: string;
  } | null>(null);

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

    setIsLoading(true);
    try {
      // Create invoice
      const recipientAddress = merchant.walletAddress;

      const invoice = createInvoice({
        amount: amount.toString(),
        token: selectedToken,
        recipient: recipientAddress,
        title: paymentMode === 'custom' ? 'Custom Payment' : 'Store Purchase',
        description: paymentMode === 'custom'
          ? customerNote || 'In-store payment'
          : cart.map(item => `${item.quantity}x ${item.name}`).join(', ')
      });

      // Generate Solana Pay URL
      const paymentUrl = generatePaymentURL(invoice);

      // Create explicit Solana Pay URL to avoid Base wallet interference
      const solanaPayUrl = paymentUrl.startsWith('solana:')
        ? paymentUrl
        : `solana:${merchant.walletAddress}?amount=${amount}&reference=${invoice.reference.toString()}&label=${encodeURIComponent(invoice.title)}&message=${encodeURIComponent(invoice.description)}`;

      // Generate QR code with purple Solana branding
      const qrCodeDataUrl = await QRCode.toDataURL(solanaPayUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#8B5CF6', // Purple for Solana
          light: '#FFFFFF'
        }
      });

      setCurrentPayment({
        qrCode: qrCodeDataUrl,
        paymentUrl,
        amount,
        reference: invoice.reference.toString()
      });

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Point of Sale</h1>
          <p className="text-muted-foreground">
            Accept Solana payments in your physical store
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - POS Interface */}
          <div className="space-y-6">
            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {merchant.businessName}
                </CardTitle>
                <CardDescription>
                  Accepting {selectedToken} payments • Wallet: {merchant.walletAddress?.slice(0, 8)}...{merchant.walletAddress?.slice(-8)}
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
                    className="h-16 flex flex-col gap-2"
                  >
                    <span className="text-lg">◎</span>
                    <span>SOL</span>
                  </Button>
                  <Button
                    variant={selectedToken === 'USDC' ? 'default' : 'outline'}
                    onClick={() => setSelectedToken('USDC')}
                    className="h-16 flex flex-col gap-2"
                  >
                    <span className="text-lg">$</span>
                    <span>USDC</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Mode Toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={paymentMode === 'custom' ? 'default' : 'outline'}
                    onClick={() => setPaymentMode('custom')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <DollarSign className="w-6 h-6" />
                    <span>Custom Amount</span>
                  </Button>
                  <Button
                    variant={paymentMode === 'fixed' ? 'default' : 'outline'}
                    onClick={() => setPaymentMode('fixed')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <QrCode className="w-6 h-6" />
                    <span>Menu Items</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                                {item.price} SOL each
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

            {/* Generate Payment Button */}
            <Button
              onClick={generatePaymentQR}
              disabled={isLoading || getTotalAmount() <= 0}
              className="w-full h-12"
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
                  Generate Payment QR ({getTotalAmount()} {selectedToken})
                </>
              )}
            </Button>
          </div>

          {/* Right Side - Payment Display */}
          <div className="space-y-6">
            {currentPayment ? (
              <>
                {/* QR Code Display */}
                <Card className="border-2 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-center flex items-center justify-center gap-2">
                      <img src="/solana-sol-logo.png" alt="Solana" className="w-6 h-6" />
                      SOLANA PAY QR CODE
                      <img src="/solana-sol-logo.png" alt="Solana" className="w-6 h-6" />
                    </CardTitle>
                    <CardDescription className="text-center text-purple-600 font-medium">
                      ⚠️ SCAN WITH SOLANA WALLET ONLY (Phantom, Solflare, etc.)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="bg-white p-6 rounded-xl inline-block border-4 border-purple-500/30">
                      <div className="relative">
                        <img
                          src={currentPayment.qrCode}
                          alt="Solana Payment QR Code"
                          className="w-64 h-64 mx-auto"
                        />
                        <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                          SOLANA
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        {currentPayment.amount} {selectedToken}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Reference: {currentPayment.reference}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Solana Pay URL: <code className="bg-muted px-1 rounded text-xs">{currentPayment.paymentUrl.slice(0, 30)}...</code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={copyPaymentUrl}
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Solana URL
                        </Button>
                        <Button
                          onClick={resetPayment}
                          className="flex-1 bg-purple-500 hover:bg-purple-600"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          New Payment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Instructions */}
                <Alert className="border-purple-500/20 bg-purple-500/5">
                  <Smartphone className="h-4 w-4 text-purple-500" />
                  <AlertDescription>
                    <strong className="text-purple-600">SOLANA WALLET INSTRUCTIONS:</strong><br />
                    1. <strong>IGNORE Base wallet</strong> if it pops up<br />
                    2. <strong>Open Phantom or Solflare</strong> manually<br />
                    3. <strong>Use wallet's scan feature</strong> (not camera app)<br />
                    4. <strong>Confirm payment</strong> in Solana wallet<br />
                    <br />
                    <span className="text-red-600 font-medium">⚠️ If Base wallet opens, CLOSE IT and use Solana wallet instead!</span>
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Accept Payments</h3>
                  <p className="text-muted-foreground">
                    Enter an amount or add items to cart, then generate a payment QR code
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

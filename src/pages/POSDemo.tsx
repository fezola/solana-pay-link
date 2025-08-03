import { useState } from 'react';
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
  Plus,
  Minus,
  Coffee,
  Sandwich,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import QRCode from 'qrcode';

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const POSDemo = () => {
  const { toast } = useToast();
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

  // Demo store items
  const [quickItems] = useState([
    { name: 'Coffee', price: 0.05, icon: <Coffee className="w-5 h-5" /> },
    { name: 'Sandwich', price: 0.12, icon: <Sandwich className="w-5 h-5" /> },
    { name: 'Pastry', price: 0.08, icon: <Zap className="w-5 h-5" /> },
    { name: 'Drink', price: 0.03, icon: <DollarSign className="w-5 h-5" /> },
  ]);

  // Demo merchant wallet (valid Solana address for testing)
  const DEMO_MERCHANT_WALLET = "C5hSCc7zhCunF4BZ3UBJWmnT1HL6pXW9rXNoeJTzLWmT";

  // Create demo invoice without PublicKey objects
  const createDemoInvoice = (params: {
    amount: string;
    token: string;
    recipient: string;
    title: string;
    description: string;
  }) => {
    const now = new Date();
    const reference = `DEMO${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const invoiceId = `invoice_${reference}`;

    return {
      id: invoiceId,
      reference,
      recipient: params.recipient, // Keep as string for demo
      amount: params.amount, // Keep as string for demo
      token: params.token,
      title: params.title,
      description: params.description,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
    };
  };

  // Generate universal payment URL that works with multiple wallets
  const generateUniversalPaymentURL = (invoice: any) => {
    const recipient = invoice.recipient;
    const amount = invoice.amount;
    const reference = invoice.reference;
    const label = encodeURIComponent(invoice.title);
    const message = encodeURIComponent(invoice.description);

    // Create a web URL that redirects to appropriate wallet
    const baseUrl = window.location.origin;
    return `${baseUrl}/pay?recipient=${recipient}&amount=${amount}&reference=${reference}&label=${label}&message=${message}&token=SOL`;
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

    setIsLoading(true);
    try {
      // Create demo invoice
      const invoice = createDemoInvoice({
        amount: amount.toString(),
        token: 'SOL',
        recipient: DEMO_MERCHANT_WALLET,
        title: paymentMode === 'custom' ? 'Custom Payment' : 'Klyr Coffee Demo',
        description: paymentMode === 'custom'
          ? customerNote || 'Demo payment'
          : cart.map(item => `${item.quantity}x ${item.name}`).join(', ')
      });

      // Generate universal payment URL
      const paymentUrl = generateUniversalPaymentURL(invoice);

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setCurrentPayment({
        qrCode: qrCodeDataUrl,
        paymentUrl,
        amount,
        reference: invoice.reference
      });

      toast({
        title: "Demo Payment QR Generated! 📱",
        description: "Scan with your phone to test the payment flow",
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
        title: "Copied! 📋",
        description: "Payment URL copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <Badge className="mb-4 bg-teal-500/10 text-teal-500 border-teal-500/20">
            🚀 Live Demo
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Klyr POS Demo</h1>
          <p className="text-muted-foreground">
            Try our Point of Sale system - scan the QR code with your phone!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - POS Interface */}
          <div className="space-y-6">
            {/* Demo Store Info */}
            <Card className="border-teal-500/20 bg-teal-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-teal-500" />
                  Klyr Coffee Demo
                </CardTitle>
                <CardDescription>
                  Demo store accepting SOL payments • Try scanning with your phone!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">Demo payments will be sent to:</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {DEMO_MERCHANT_WALLET.slice(0, 8)}...{DEMO_MERCHANT_WALLET.slice(-8)}
                  </code>
                  <p className="mt-2 text-orange-600">
                    ⚠️ This is a real wallet address - only send test amounts!
                  </p>
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
                    <Label htmlFor="amount">Amount (SOL)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.05"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Try 0.05 SOL for testing
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="note">Customer Note (Optional)</Label>
                    <Input
                      id="note"
                      placeholder="e.g., Demo payment"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fixed Items Mode */}
            {paymentMode === 'fixed' && (
              <>
                {/* Menu Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Menu Items</CardTitle>
                    <CardDescription>Demo prices in SOL</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {quickItems.map((item, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => addToCart(item)}
                          className="h-20 flex flex-col gap-2 hover:border-teal-500/20 hover:bg-teal-500/5"
                        >
                          {item.icon}
                          <div className="text-center">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.price} SOL</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shopping Cart */}
                {cart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
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
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{getTotalAmount().toFixed(3)} SOL</span>
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
              className="w-full h-14 text-lg bg-gradient-solana hover:shadow-glow"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating QR Code...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Generate Payment QR ({getTotalAmount().toFixed(3)} SOL)
                </>
              )}
            </Button>
          </div>

          {/* Right Side - Payment Display */}
          <div className="space-y-6">
            {currentPayment ? (
              <>
                {/* QR Code Display */}
                <Card className="border-teal-500/20">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl">📱 Scan to Pay</CardTitle>
                    <CardDescription className="text-center">
                      Point your phone camera at this QR code
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    <div className="bg-white p-6 rounded-2xl inline-block shadow-lg">
                      <img 
                        src={currentPayment.qrCode} 
                        alt="Payment QR Code"
                        className="w-80 h-80 mx-auto"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Badge variant="outline" className="text-xl px-6 py-3 bg-teal-500/10 text-teal-500 border-teal-500/20">
                        💰 {currentPayment.amount.toFixed(3)} SOL
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Reference: {currentPayment.reference}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={copyPaymentUrl}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        onClick={resetPayment}
                        className="flex-1 bg-gradient-solana"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        New Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Instructions */}
                <Alert className="border-teal-500/20 bg-teal-500/5">
                  <Smartphone className="h-5 w-5 text-teal-500" />
                  <AlertDescription>
                    <strong className="text-teal-500">📱 How to Test:</strong><br />
                    1. Point your phone camera at the QR code<br />
                    2. Tap the notification to open the payment page<br />
                    3. Choose your Solana wallet (Phantom, Solflare, etc.)<br />
                    4. Your wallet will open with the payment request!<br />
                    <br />
                    <strong className="text-orange-600">⚠️ Real Payment:</strong> This creates an actual payment request to {DEMO_MERCHANT_WALLET.slice(0, 8)}...{DEMO_MERCHANT_WALLET.slice(-8)}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="text-center py-20">
                  <QrCode className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-3">Ready for Demo Payment</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a payment mode and amount, then generate a QR code to test with your phone
                  </p>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    💡 Try adding a coffee for 0.05 SOL
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-teal-500/5 to-green-500/5 border-teal-500/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">🚀 Live Demo Features</h3>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  This demo generates real Solana Pay QR codes that work with Solana wallet apps like Phantom, Solflare, and others.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-700 font-medium">
                    📱 <strong>Wallet Required:</strong> You need a Solana wallet app installed on your phone to test this.
                    The QR code will open your wallet app and show the payment request.
                  </p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <p className="text-orange-700 font-medium">
                    ⚠️ <strong>Real Payments:</strong> This creates actual Solana payment requests.
                    Only complete the payment if you want to send real SOL to the demo wallet!
                  </p>
                </div>
                <p className="text-muted-foreground">
                  <strong>What happens:</strong> Camera detects QR → Wallet app opens → Payment request appears → Customer can approve/decline
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

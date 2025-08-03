import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  ExternalLink, 
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export const PaymentRedirect = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userAgent, setUserAgent] = useState('');

  // Extract payment parameters
  const recipient = searchParams.get('recipient') || '';
  const amount = searchParams.get('amount') || '0';
  const reference = searchParams.get('reference') || '';
  const label = searchParams.get('label') || '';
  const message = searchParams.get('message') || '';
  const token = searchParams.get('token') || 'SOL';

  useEffect(() => {
    setUserAgent(navigator.userAgent);
  }, []);

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Generate wallet-specific URLs
  const generateWalletURLs = () => {
    const solanaPayURL = `solana:${recipient}?amount=${amount}&reference=${reference}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`;
    
    return {
      // Solana Pay standard
      solana: solanaPayURL,
      
      // Phantom wallet
      phantom: `https://phantom.app/ul/browse/${encodeURIComponent(solanaPayURL)}?ref=klyr`,
      
      // Solflare wallet  
      solflare: `https://solflare.com/ul/v1/browse/${encodeURIComponent(solanaPayURL)}?ref=klyr`,
      
      // Backpack wallet
      backpack: `https://backpack.app/ul/browse/${encodeURIComponent(solanaPayURL)}?ref=klyr`,
      
      // Glow wallet
      glow: `https://glow.app/ul/browse/${encodeURIComponent(solanaPayURL)}?ref=klyr`
    };
  };

  const walletURLs = generateWalletURLs();

  // Auto-redirect on mobile
  useEffect(() => {
    if (isMobile && recipient) {
      // Try to open Solana Pay URL directly first
      const timer = setTimeout(() => {
        window.location.href = walletURLs.solana;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isMobile, recipient, walletURLs.solana]);

  const openWallet = (walletType: string) => {
    const url = walletURLs[walletType as keyof typeof walletURLs];
    window.open(url, '_blank');
    
    toast({
      title: "Opening Wallet",
      description: `Redirecting to ${walletType} wallet...`,
    });
  };

  const copyPaymentURL = () => {
    navigator.clipboard.writeText(walletURLs.solana);
    toast({
      title: "Copied!",
      description: "Solana Pay URL copied to clipboard",
    });
  };

  if (!recipient) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-bold mb-4">Invalid Payment Link</h2>
            <p className="text-muted-foreground">
              This payment link is missing required information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Payment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Payment Request
              </CardTitle>
              <CardDescription>
                {label || 'Solana Payment'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {amount} {token}
                </Badge>
              </div>
              
              {message && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{decodeURIComponent(message)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">To:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {recipient.slice(0, 8)}...{recipient.slice(-8)}
                </code>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reference:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {reference}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Auto-Redirect */}
          {isMobile && (
            <Alert className="mb-6 border-blue-500/20 bg-blue-500/5">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                <strong className="text-blue-500">Mobile Detected:</strong> Attempting to open your Solana wallet automatically...
                <br />
                If it doesn't open, try the wallet buttons below.
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Options */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Solana Wallet</CardTitle>
              <CardDescription>
                Select your preferred Solana wallet to complete the payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Wallets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => openWallet('phantom')}
                  variant="outline"
                  className="h-16 flex flex-col gap-2"
                >
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span>Phantom</span>
                </Button>

                <Button
                  onClick={() => openWallet('solflare')}
                  variant="outline"
                  className="h-16 flex flex-col gap-2"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span>Solflare</span>
                </Button>

                <Button
                  onClick={() => openWallet('backpack')}
                  variant="outline"
                  className="h-16 flex flex-col gap-2"
                >
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span>Backpack</span>
                </Button>

                <Button
                  onClick={() => openWallet('glow')}
                  variant="outline"
                  className="h-16 flex flex-col gap-2"
                >
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span>Glow</span>
                </Button>
              </div>

              {/* Generic Solana Pay */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => openWallet('solana')}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open with Any Solana Wallet
                </Button>
              </div>

              {/* Copy URL */}
              <div className="pt-2">
                <Button
                  onClick={copyPaymentURL}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Solana Pay URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong><br />
              1. Click your wallet button above<br />
              2. Your wallet app will open with the payment request<br />
              3. Review the details and approve the transaction<br />
              4. Payment will be sent to the merchant's wallet
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

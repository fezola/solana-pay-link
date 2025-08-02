import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, QrCode, ExternalLink, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import {
  createInvoice,
  generatePaymentURL,
  PaymentLinkData,
  SPL_TOKENS
} from '@/lib/payment-utils';
import { PaymentLinkService, InvoiceService } from '@/lib/supabase-service';
import { getCurrentMerchant } from '@/lib/merchant-auth';

interface PaymentFormData {
  amount: string;
  token: string;
  title: string;
  description: string;
  recipientWallet: string;
  baseWallet: string; // Add Base wallet for multi-network
  expiresIn: string; // minutes
  network: 'solana' | 'base' | 'multi'; // Add multi-network option
}

interface PaymentLinkGeneratorProps {
  onLinkCreated?: () => void;
}

export const PaymentLinkGenerator = ({ onLinkCreated }: PaymentLinkGeneratorProps) => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    token: 'USDC',
    title: '',
    description: '',
    recipientWallet: '',
    baseWallet: '',
    expiresIn: '60', // 1 hour default
    network: 'multi' // Default to multi-network
  });
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePaymentLink = async () => {
    try {
      setIsGenerating(true);

      if (!connected || !publicKey) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to create payment links",
          variant: "destructive"
        });
        return;
      }

      if (!formData.recipientWallet || !formData.amount || !formData.title) {
        toast({
          title: "Missing Fields",
          description: "Please fill in recipient wallet, amount, and title",
          variant: "destructive"
        });
        return;
      }

      // Validate wallet addresses based on network
      if (formData.network === 'solana') {
        try {
          new PublicKey(formData.recipientWallet);
        } catch {
          toast({
            title: "Invalid Solana Address",
            description: "Please enter a valid Solana wallet address",
            variant: "destructive"
          });
          return;
        }
      } else if (formData.network === 'base') {
        // Validate ETH address (0x followed by 40 hex characters)
        if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipientWallet)) {
          toast({
            title: "Invalid ETH Address",
            description: "Please enter a valid Ethereum/Base wallet address (0x...)",
            variant: "destructive"
          });
          return;
        }
      } else if (formData.network === 'multi') {
        // Validate both Solana and Base addresses
        try {
          new PublicKey(formData.recipientWallet);
        } catch {
          toast({
            title: "Invalid Solana Address",
            description: "Please enter a valid Solana wallet address",
            variant: "destructive"
          });
          return;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(formData.baseWallet)) {
          toast({
            title: "Invalid Base Address",
            description: "Please enter a valid Ethereum/Base wallet address (0x...)",
            variant: "destructive"
          });
          return;
        }
      }

      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive"
        });
        return;
      }

      // Create invoice with reference
      const invoice = createInvoice({
        recipient: formData.recipientWallet,
        amount: formData.amount,
        token: formData.token,
        title: formData.title,
        description: formData.description,
        expiresIn: formData.expiresIn === 'never' ? undefined : parseInt(formData.expiresIn)
      });

      // Generate payment URL with reference
      const url = generatePaymentURL(invoice);

      // Generate QR Code
      const qrCode = await QRCode.toDataURL(url, {
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        margin: 2
      });

      // Get current merchant
      const merchant = await getCurrentMerchant(publicKey);
      if (!merchant) {
        toast({
          title: "Business Not Registered",
          description: "Please register your business first",
          variant: "destructive"
        });
        return;
      }

      // Save to Supabase (required for payment processing)
      await Promise.all([
        // Create invoice in Supabase
        InvoiceService.createInvoice({
          merchantId: merchant.id,
          reference: invoice.reference,
          amount: parseFloat(formData.amount),
          tokenSymbol: formData.token,
          recipientAddress: formData.recipientWallet,
          title: formData.title,
          description: formData.description,
          expiresAt: invoice.expiresAt
        }),

        // Create payment link in Supabase
        PaymentLinkService.createPaymentLink({
          merchantId: merchant.id,
          slug: invoice.reference, // Use reference as slug
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          tokenSymbol: formData.token,
          recipientAddress: formData.recipientWallet,
          network: formData.network === 'multi' ? 'solana' : formData.network,
          expiresAt: invoice.expiresAt
        })
      ]);

      console.log('Successfully saved to Supabase');

      // Create payment link data
      const linkData: PaymentLinkData = {
        invoice,
        url,
        qrCode
      };

      setPaymentLink(linkData);

      toast({
        title: "Payment Link Generated!",
        description: `Invoice ${invoice.id} created with reference tracking`,
      });

      // Call the callback to refresh the parent component
      onLinkCreated?.();

    } catch (error) {
      console.error('Error generating payment link:', error);

      // Determine error type for better user messaging
      const errorMessage = error instanceof Error && error.message.includes('Failed to create')
        ? "Unable to connect to payment service. Please check your connection and try again."
        : "Failed to generate payment link. Please check your inputs and try again.";

      toast({
        title: "Service Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const openCheckoutPage = () => {
    if (paymentLink) {
      const checkoutUrl = `/checkout?invoice=${paymentLink.invoice.id}`;
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Payment Link Generator
          </CardTitle>
          <CardDescription>
            Create payment links for Solana or Base networks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Selection */}
          <div className="space-y-2">
            <Label>Payment Network</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={formData.network === 'multi' ? 'default' : 'outline'}
                onClick={() => {
                  handleInputChange('network', 'multi');
                  handleInputChange('token', 'USDC'); // Reset token
                }}
                className="flex items-center gap-2"
              >
                <div className="flex -space-x-1">
                  <img src="/solana-sol-logo.png" alt="Solana" className="w-4 h-4" />
                  <img src="/base.JPG" alt="Base" className="w-4 h-4" />
                </div>
                Multi
              </Button>
              <Button
                type="button"
                variant={formData.network === 'solana' ? 'default' : 'outline'}
                onClick={() => {
                  handleInputChange('network', 'solana');
                  handleInputChange('token', 'USDC'); // Reset token
                  handleInputChange('recipientWallet', ''); // Clear wallet
                }}
                className="flex items-center gap-2"
              >
                <img src="/solana-sol-logo.png" alt="Solana" className="w-4 h-4" />
                Solana
              </Button>
              <Button
                type="button"
                variant={formData.network === 'base' ? 'default' : 'outline'}
                onClick={() => {
                  handleInputChange('network', 'base');
                  handleInputChange('token', 'USDC'); // Reset token
                  handleInputChange('recipientWallet', ''); // Clear wallet
                }}
                className="flex items-center gap-2"
              >
                <img src="/base.JPG" alt="Base" className="w-4 h-4" />
                Base
              </Button>
            </div>
          </div>

          {/* Wallet Address Fields */}
          {formData.network === 'multi' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="solana-wallet">Solana Wallet Address</Label>
                <Input
                  id="solana-wallet"
                  placeholder="Enter your Solana wallet address"
                  value={formData.recipientWallet}
                  onChange={(e) => handleInputChange('recipientWallet', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-wallet">Base/Ethereum Wallet Address</Label>
                <Input
                  id="base-wallet"
                  placeholder="Enter your ETH/Base wallet address (0x...)"
                  value={formData.baseWallet}
                  onChange={(e) => handleInputChange('baseWallet', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="recipient">
                {formData.network === 'solana' ? 'Solana Wallet Address' : 'Ethereum/Base Wallet Address'}
              </Label>
              <Input
                id="recipient"
                placeholder={formData.network === 'solana'
                  ? 'Enter your Solana wallet address'
                  : 'Enter your ETH/Base wallet address (0x...)'
                }
                value={formData.recipientWallet}
                onChange={(e) => handleInputChange('recipientWallet', e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Select value={formData.token} onValueChange={(value) => handleInputChange('token', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.network === 'solana' ? (
                    // Solana tokens
                    Object.entries(SPL_TOKENS).map(([symbol, token]) => (
                      <SelectItem key={symbol} value={symbol}>
                        <div className="flex items-center gap-2">
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-5 h-5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span>{token.symbol} - {token.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    // Base tokens (USDC only for now)
                    <SelectItem value="USDC">
                      <div className="flex items-center gap-2">
                        <img src="/usd-coin-usdc-logo.png" alt="USDC" className="w-5 h-5" />
                        <span>USDC - USD Coin</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Payment Title</Label>
            <Input
              id="title"
              placeholder="e.g., Coffee Purchase"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the payment"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresIn">Expires In (minutes)</Label>
            <Select value={formData.expiresIn} onValueChange={(value) => handleInputChange('expiresIn', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="720">12 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generatePaymentLink}
            className="w-full"
            variant="solana"
            size="lg"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Payment Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Link and QR Code */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Generated Payment Link</CardTitle>
          <CardDescription>
            Share this link or QR code with your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentLink ? (
            <>
              {/* Invoice Details */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Invoice ID</Label>
                  <span className="font-mono text-xs">{paymentLink.invoice.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Reference</Label>
                  <span className="font-mono text-xs">{paymentLink.invoice.reference.toString().slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Status</Label>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {paymentLink.invoice.status}
                  </span>
                </div>
                {paymentLink.invoice.expiresAt && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Expires</Label>
                    <span className="text-xs text-muted-foreground">
                      {paymentLink.invoice.expiresAt.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment URL */}
              <div className="space-y-2">
                <Label>Payment URL</Label>
                <div className="flex gap-2">
                  <Input value={paymentLink.url} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(paymentLink.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={openCheckoutPage}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {paymentLink.qrCode && (
                <div className="flex flex-col items-center space-y-2">
                  <Label>QR Code</Label>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <img src={paymentLink.qrCode} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Customers can scan this QR code with their mobile wallet
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(paymentLink.url)}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="solana"
                  onClick={openCheckoutPage}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Checkout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Fill out the form and click "Generate Payment Link" to create your Solana Pay link
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
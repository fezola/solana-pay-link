import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, QrCode, ExternalLink, Clock, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import {
  PaymentFormData,
  SupportedToken,
  TOKEN_REGISTRY,
  Invoice
} from '@/types/payment';
import { createInvoice, getCheckoutURL, isValidSolanaAddress } from '@/lib/solana-pay';
import { StorageService } from '@/lib/storage';

export const PaymentLinkGenerator = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    token: 'USDC' as SupportedToken,
    title: '',
    description: '',
    recipientWallet: '',
    expiresIn: 24, // 24 hours default
    webhookUrl: '',
    metadata: {}
  });
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePaymentLink = async () => {
    try {
      setIsGenerating(true);

      // Validation
      if (!formData.recipientWallet || !formData.amount || !formData.title) {
        toast({
          title: "Missing Fields",
          description: "Please fill in recipient wallet, amount, and title",
          variant: "destructive"
        });
        return;
      }

      if (!isValidSolanaAddress(formData.recipientWallet)) {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid Solana wallet address",
          variant: "destructive"
        });
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive"
        });
        return;
      }

      // Create invoice
      const invoice = await createInvoice(formData);

      // Save to storage
      StorageService.saveInvoice(invoice);

      // Generate checkout URL
      const checkoutUrl = getCheckoutURL(invoice);

      // Generate QR Code
      const qrCode = await QRCode.toDataURL(checkoutUrl, {
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        margin: 2,
      });

      setGeneratedInvoice(invoice);
      setQrCodeData(qrCode);

      toast({
        title: "Payment Link Generated!",
        description: `Invoice ${invoice.id} created successfully`,
      });

    } catch (error) {
      console.error('Error generating payment link:', error);
      toast({
        title: "Error",
        description: "Failed to generate payment link. Please check your inputs.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: string = "link") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      token: 'USDC' as SupportedToken,
      title: '',
      description: '',
      recipientWallet: '',
      expiresIn: 24,
      webhookUrl: '',
      metadata: {}
    });
    setGeneratedInvoice(null);
    setQrCodeData('');
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
            Create a Solana Pay link for your customers to send payments directly to your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Wallet Address</Label>
            <Input
              id="recipient"
              placeholder="Enter your Solana wallet address"
              value={formData.recipientWallet}
              onChange={(e) => handleInputChange('recipientWallet', e.target.value)}
            />
          </div>

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
              <Select value={formData.token} onValueChange={(value) => handleInputChange('token', value as SupportedToken)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOKEN_REGISTRY).map(([symbol, info]) => (
                    <SelectItem key={symbol} value={symbol}>
                      <div className="flex items-center gap-2">
                        <span>{info.symbol}</span>
                        <span className="text-xs text-muted-foreground">({info.name})</span>
                      </div>
                    </SelectItem>
                  ))}
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
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expires">Expires In (Hours)</Label>
              <Input
                id="expires"
                type="number"
                min="1"
                max="168"
                placeholder="24"
                value={formData.expiresIn || ''}
                onChange={(e) => handleInputChange('expiresIn', parseInt(e.target.value) || 24)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook" className="flex items-center gap-1">
                <Webhook className="h-3 w-3" />
                Webhook URL (Optional)
              </Label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://your-site.com/webhook"
                value={formData.webhookUrl || ''}
                onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generatePaymentLink}
              className="flex-1"
              variant="solana"
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Payment Link'}
            </Button>
            {generatedInvoice && (
              <Button
                onClick={resetForm}
                variant="outline"
                size="lg"
              >
                Reset
              </Button>
            )}
          </div>
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
          {generatedInvoice ? (
            <>
              {/* Invoice Details */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Invoice ID:</span>
                  <span className="font-mono text-xs">{generatedInvoice.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="font-semibold">{generatedInvoice.amount} {generatedInvoice.token}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {generatedInvoice.status}
                  </span>
                </div>
                {generatedInvoice.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {generatedInvoice.expiresAt.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Checkout URL */}
              <div className="space-y-2">
                <Label>Checkout URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={getCheckoutURL(generatedInvoice)}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getCheckoutURL(generatedInvoice), "Checkout URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(getCheckoutURL(generatedInvoice), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Solana Pay URL */}
              <div className="space-y-2">
                <Label>Solana Pay URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedInvoice.paymentUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(generatedInvoice.paymentUrl, "Solana Pay URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeData && (
                <div className="flex flex-col items-center space-y-2">
                  <Label>QR Code</Label>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <img src={qrCodeData} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Customers can scan this QR code or visit the checkout URL
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Fill out the form and click "Generate Payment Link" to create your invoice
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, QrCode, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { PublicKey } from '@solana/web3.js';
import { encodeURL, TransferRequestURLFields } from '@solana/pay';
import BigNumber from 'bignumber.js';

interface PaymentFormData {
  amount: string;
  token: string;
  title: string;
  description: string;
  recipientWallet: string;
}

export const PaymentLinkGenerator = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    token: 'USDC',
    title: '',
    description: '',
    recipientWallet: ''
  });
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePaymentLink = async () => {
    try {
      if (!formData.recipientWallet || !formData.amount) {
        toast({
          title: "Missing Fields",
          description: "Please fill in recipient wallet and amount",
          variant: "destructive"
        });
        return;
      }

      const recipient = new PublicKey(formData.recipientWallet);
      
      const urlParams: TransferRequestURLFields = {
        recipient,
        amount: new BigNumber(formData.amount),
        label: formData.title,
        message: formData.description,
      };

      // Generate Solana Pay URL
      const url = encodeURL(urlParams);
      setGeneratedUrl(url.toString());

      // Generate QR Code
      const qrCode = await QRCode.toDataURL(url.toString(), {
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });
      setQrCodeData(qrCode);

      toast({
        title: "Payment Link Generated!",
        description: "Your Solana Pay link is ready to use",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate payment link. Please check your inputs.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
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
              <Select value={formData.token} onValueChange={(value) => handleInputChange('token', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
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

          <Button 
            onClick={generatePaymentLink} 
            className="w-full" 
            variant="solana"
            size="lg"
          >
            Generate Payment Link
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
          {generatedUrl ? (
            <>
              <div className="space-y-2">
                <Label>Payment URL</Label>
                <div className="flex gap-2">
                  <Input value={generatedUrl} readOnly className="font-mono text-xs" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(generatedUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(generatedUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {qrCodeData && (
                <div className="flex flex-col items-center space-y-2">
                  <Label>QR Code</Label>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <img src={qrCodeData} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Customers can scan this QR code with their mobile wallet
                  </p>
                </div>
              )}
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
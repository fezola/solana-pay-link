import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, QrCode, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { OfficialBasePayButton } from './BasePayButton'; // Temporarily removed for demo
import { generatePaymentURL } from '@/lib/payment-utils';
import QRCodeLib from 'qrcode';

interface MultiNetworkPaymentProps {
  invoice: {
    id: string;
    title: string;
    description: string;
    amount: string;
    token: string;
    recipient: string;
    baseWallet?: string;
    expiresAt?: Date;
  };
  onPaymentComplete?: (network: 'solana' | 'base', txId: string) => void;
}

export const MultiNetworkPayment = ({ invoice, onPaymentComplete }: MultiNetworkPaymentProps) => {
  const { toast } = useToast();
  const [solanaQrCode, setSolanaQrCode] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'base'>('solana');

  // Generate Solana QR code
  const generateSolanaQR = async () => {
    try {
      const paymentUrl = generatePaymentURL({
        ...invoice,
        recipient: invoice.recipient
      });
      
      const qrCodeData = await QRCodeLib.toDataURL(paymentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setSolanaQrCode(qrCodeData);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Generate QR code when component mounts
  React.useEffect(() => {
    generateSolanaQR();
  }, []);

  const copyPaymentLink = async (network: 'solana' | 'base') => {
    let link = '';
    if (network === 'solana') {
      link = generatePaymentURL({
        ...invoice,
        recipient: invoice.recipient
      });
    } else {
      // For Base, we'll use a checkout link since Base Pay requires SDK integration
      link = `${window.location.origin}/checkout?invoice=${invoice.id}&network=base`;
    }
    
    await navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: `${network === 'solana' ? 'Solana' : 'Base'} payment link copied to clipboard`,
    });
  };

  const openInWallet = (network: 'solana' | 'base') => {
    if (network === 'solana') {
      const paymentUrl = generatePaymentURL({
        ...invoice,
        recipient: invoice.recipient
      });
      window.open(paymentUrl, '_self');
    } else {
      toast({
        title: "Base Pay",
        description: "Use the Base Pay button below to complete payment",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <div className="flex -space-x-1">
              <img src="/solana-sol-logo.png" alt="Solana" className="w-6 h-6" />
              <img src="/usd-coin-usdc-logo.png" alt="Base" className="w-6 h-6" />
            </div>
            Multi-Network Payment
          </CardTitle>
          <CardDescription>
            Choose your preferred network to complete the payment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{invoice.title}</h3>
            <p className="text-gray-600 mb-3">{invoice.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">${invoice.amount} {invoice.token}</span>
              {invoice.expiresAt && (
                <Badge variant="outline">
                  Expires: {invoice.expiresAt.toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Network Selection Tabs */}
          <Tabs value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as 'solana' | 'base')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solana" className="flex items-center gap-2">
                <img src="/solana-sol-logo.png" alt="Solana" className="w-4 h-4" />
                Solana Pay
              </TabsTrigger>
              <TabsTrigger value="base" className="flex items-center gap-2">
                <img src="/usd-coin-usdc-logo.png" alt="Base" className="w-4 h-4" />
                Base Pay
              </TabsTrigger>
            </TabsList>

            {/* Solana Payment */}
            <TabsContent value="solana" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src="/solana-sol-logo.png" alt="Solana" className="w-5 h-5" />
                    Pay with Solana
                  </CardTitle>
                  <CardDescription>
                    Scan QR code with any Solana wallet or copy the payment link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
                      {solanaQrCode ? (
                        <img src={solanaQrCode} alt="Solana Payment QR Code" className="w-48 h-48" />
                      ) : (
                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                          <QrCode className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Scan with Phantom, Solflare, or any Solana Pay wallet
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => openInWallet('solana')}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Open in Wallet
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => copyPaymentLink('solana')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>

                  {/* Recipient Info */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Recipient:</span>
                    <div className="font-mono text-xs mt-1 break-all">
                      {invoice.recipient}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Base Payment */}
            <TabsContent value="base" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src="/usd-coin-usdc-logo.png" alt="Base" className="w-5 h-5" />
                    Pay with Base
                  </CardTitle>
                  <CardDescription>
                    Pay with USDC on Base network using Base Pay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Base Pay Button - Temporarily Removed for Demo */}
                  <div className="text-center">
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-blue-800 mb-4">
                        <h4 className="font-semibold mb-2">Base Pay Integration</h4>
                        <p className="text-sm">
                          Base Pay functionality is temporarily disabled for demo recording.
                          This feature will be re-enabled after the demo.
                        </p>
                      </div>
                      <Button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Base Pay - Coming Soon
                      </Button>
                    </div>
                  </div>

                  {/* Alternative Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => copyPaymentLink('base')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://base.org/ecosystem', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Learn More
                    </Button>
                  </div>

                  {/* Recipient Info */}
                  {invoice.baseWallet && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Base Recipient:</span>
                      <div className="font-mono text-xs mt-1 break-all">
                        {invoice.baseWallet}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payment Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 mb-2">Payment Instructions</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Solana:</strong> Use any Solana wallet (Phantom, Solflare, etc.)</p>
                <p>• <strong>Base:</strong> Use Base Pay with USDC on Base network</p>
                <p>• Both networks accept the same USD amount</p>
                <p>• Payment will be confirmed automatically</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, Code, ExternalLink, Globe, Smartphone, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export const MerchantIntegration = () => {
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState('button');

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const buttonCode = `<!-- Simple Payment Button -->
<a href="https://yourpaylink.com/checkout?invoice=YOUR_INVOICE_ID" 
   target="_blank" 
   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
  Pay with Crypto
</a>`;

  const iframeCode = `<!-- Embedded Payment Form -->
<iframe 
  src="https://yourpaylink.com/checkout?invoice=YOUR_INVOICE_ID&embed=true" 
  width="400" 
  height="600" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>`;

  const jsCode = `<!-- JavaScript Integration -->
<script>
function openCryptoPayment() {
  const popup = window.open(
    'https://yourpaylink.com/checkout?invoice=YOUR_INVOICE_ID',
    'crypto-payment',
    'width=500,height=700,scrollbars=yes,resizable=yes'
  );
  
  // Listen for payment completion
  window.addEventListener('message', function(event) {
    if (event.data.type === 'PAYMENT_COMPLETE') {
      popup.close();
      alert('Payment successful! Transaction: ' + event.data.txId);
      // Redirect or update your page
      window.location.reload();
    }
  });
}
</script>

<button onclick="openCryptoPayment()" 
        style="background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
  Pay with Crypto
</button>`;

  const apiCode = `// API Integration Example
const createPayment = async () => {
  const response = await fetch('https://yourpaylink.com/api/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      amount: '29.99',
      token: 'USDC',
      title: 'Product Purchase',
      description: 'Customer order #12345',
      solanaWallet: 'YOUR_SOLANA_WALLET',
      baseWallet: 'YOUR_BASE_WALLET',
      network: 'multi', // or 'solana' or 'base'
      expiresIn: 60 // minutes
    })
  });
  
  const invoice = await response.json();
  
  // Redirect to payment page
  window.location.href = \`https://yourpaylink.com/checkout?invoice=\${invoice.id}\`;
};`;

  const webhookCode = `// Webhook Handler Example (Node.js/Express)
app.post('/webhook/payment', (req, res) => {
  const { invoiceId, status, network, txId, amount } = req.body;
  
  if (status === 'completed') {
    // Payment successful - fulfill order
    console.log(\`Payment completed: \${amount} via \${network}\`);
    console.log(\`Transaction ID: \${txId}\`);
    
    // Update your database
    updateOrderStatus(invoiceId, 'paid');
    
    // Send confirmation email
    sendConfirmationEmail(invoiceId);
  }
  
  res.status(200).send('OK');
});`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Merchant Integration Guide</h1>
            <p className="text-muted-foreground text-lg">
              Learn how to integrate crypto payments into your website or application
            </p>
          </div>

        {/* Integration Methods */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedIntegration('button')}>
            <CardContent className="p-4">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Payment Button</h3>
              <p className="text-sm text-muted-foreground">Simple link or button</p>
            </CardContent>
          </Card>

          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedIntegration('iframe')}>
            <CardContent className="p-4">
              <Globe className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Embedded Form</h3>
              <p className="text-sm text-muted-foreground">Iframe integration</p>
            </CardContent>
          </Card>

          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedIntegration('popup')}>
            <CardContent className="p-4">
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Popup Modal</h3>
              <p className="text-sm text-muted-foreground">JavaScript popup</p>
            </CardContent>
          </Card>

          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedIntegration('api')}>
            <CardContent className="p-4">
              <Code className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">API Integration</h3>
              <p className="text-sm text-muted-foreground">Full API control</p>
            </CardContent>
          </Card>
        </div>

        {/* Integration Code Examples */}
        <Tabs value={selectedIntegration} onValueChange={setSelectedIntegration}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="button">Payment Button</TabsTrigger>
            <TabsTrigger value="iframe">Embedded Form</TabsTrigger>
            <TabsTrigger value="popup">Popup Modal</TabsTrigger>
            <TabsTrigger value="api">API Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="button" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Simple Payment Button</CardTitle>
                <CardDescription>
                  The easiest way to accept crypto payments - just add a link or button to your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">HTML Code</h4>
                    <Button size="sm" variant="outline" onClick={() => copyCode(buttonCode)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto text-foreground bg-background/50 p-3 rounded border"><code>{buttonCode}</code></pre>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">How it works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Customer clicks the payment button</li>
                    <li>Opens payment page in new tab/window</li>
                    <li>Customer completes payment with their wallet</li>
                    <li>Redirected back to your success page</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Embedded Payment Form</CardTitle>
                <CardDescription>
                  Embed the payment form directly in your website for a seamless experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">HTML Code</h4>
                    <Button size="sm" variant="outline" onClick={() => copyCode(iframeCode)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto text-foreground bg-background/50 p-3 rounded border"><code>{iframeCode}</code></pre>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Payment form stays on your website</li>
                    <li>Maintains your branding and user experience</li>
                    <li>No redirects or popups needed</li>
                    <li>Mobile-responsive design</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="popup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript Popup Modal</CardTitle>
                <CardDescription>
                  Open payment form in a popup window with JavaScript event handling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">JavaScript Code</h4>
                    <Button size="sm" variant="outline" onClick={() => copyCode(jsCode)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto text-foreground bg-background/50 p-3 rounded border"><code>{jsCode}</code></pre>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Real-time payment status updates</li>
                    <li>Automatic popup closure on completion</li>
                    <li>Custom success/error handling</li>
                    <li>Perfect for single-page applications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Full API Integration</CardTitle>
                <CardDescription>
                  Create payment links programmatically and handle webhooks for complete control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Create Payment API</h4>
                    <Button size="sm" variant="outline" onClick={() => copyCode(apiCode)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto text-foreground bg-background/50 p-3 rounded border"><code>{apiCode}</code></pre>
                </div>

                <div className="bg-muted/50 border p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Webhook Handler</h4>
                    <Button size="sm" variant="outline" onClick={() => copyCode(webhookCode)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto text-foreground bg-background/50 p-3 rounded border"><code>{webhookCode}</code></pre>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">API Capabilities:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Dynamic payment link creation</li>
                    <li>Real-time webhook notifications</li>
                    <li>Multi-network support (Solana + Base)</li>
                    <li>Custom expiration and metadata</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>Get started with crypto payments in 5 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-500 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Payment Link</h3>
                <p className="text-sm text-muted-foreground">
                  Use our dashboard to create a payment link with your wallet addresses
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-500 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Add to Website</h3>
                <p className="text-sm text-muted-foreground">
                  Copy the code and add it to your website using any method above
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-500 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Receive Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Start accepting crypto payments from customers worldwide
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Networks */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <img src="/solana-sol-logo.png" alt="Solana" className="w-8 h-8" />
                <div>
                  <h4 className="font-semibold">Solana</h4>
                  <p className="text-sm text-muted-foreground">SOL, USDC, USDT and more</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <img src="/base.JPG" alt="Base" className="w-8 h-8" />
                <div>
                  <h4 className="font-semibold">Base</h4>
                  <p className="text-sm text-muted-foreground">USDC on Base network</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={() => window.location.href = '/'}>
            Create Your First Payment Link
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

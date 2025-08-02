import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Webhook, 
  Send, 
  Key, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getCurrentMerchantSync,
  updateMerchantSettings,
  MerchantSettings 
} from '@/lib/merchant-auth';

interface WebhookEvent {
  id: string;
  event: string;
  url: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  response?: string;
  error?: string;
}

export const WebhookManager = () => {
  const { toast } = useToast();
  const [merchant, setMerchant] = useState(getCurrentMerchantSync());
  const [settings, setSettings] = useState<MerchantSettings | null>(merchant?.settings || null);
  const [webhookUrl, setWebhookUrl] = useState(merchant?.settings.webhookUrl || '');
  const [webhookSecret, setWebhookSecret] = useState(merchant?.settings.webhookSecret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);

  useEffect(() => {
    const currentMerchant = getCurrentMerchantSync();
    setMerchant(currentMerchant);
    setSettings(currentMerchant?.settings || null);
    setWebhookUrl(currentMerchant?.settings.webhookUrl || '');
    setWebhookSecret(currentMerchant?.settings.webhookSecret || '');
  }, []);

  const generateWebhookSecret = () => {
    const secret = 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setWebhookSecret(secret);
  };

  const saveWebhookSettings = async () => {
    if (!merchant) return;

    try {
      const success = await updateMerchantSettings(merchant.walletAddress, {
        webhookUrl: webhookUrl || undefined,
        webhookSecret: webhookSecret || undefined
      });

      if (success) {
        // Update local state
        const updatedMerchant = getCurrentMerchantSync();
        setMerchant(updatedMerchant);
        setSettings(updatedMerchant?.settings || null);

        toast({
          title: "Settings Saved",
          description: "Webhook settings have been updated successfully",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save webhook settings",
        variant: "destructive"
      });
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "No Webhook URL",
        description: "Please enter a webhook URL first",
        variant: "destructive"
      });
      return;
    }

    setIsTestingWebhook(true);

    try {
      // Create a test payload
      const testPayload = {
        event: 'payment.completed',
        data: {
          invoice_id: 'test_invoice_123',
          amount: '10.00',
          token: 'USDC',
          customer_wallet: '7xKXt...9Qj2m',
          transaction_signature: 'test_signature_123',
          timestamp: new Date().toISOString()
        },
        webhook_id: 'test_webhook_' + Date.now()
      };

      // In a real implementation, this would be sent from the backend
      // For demo purposes, we'll simulate the webhook call
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': webhookSecret ? `sha256=${webhookSecret}` : '',
          'User-Agent': 'SolPay-Webhook/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      const newEvent: WebhookEvent = {
        id: 'test_' + Date.now(),
        event: 'payment.completed (test)',
        url: webhookUrl,
        status: response.ok ? 'success' : 'failed',
        timestamp: new Date(),
        response: response.ok ? `${response.status} ${response.statusText}` : undefined,
        error: response.ok ? undefined : `${response.status} ${response.statusText}`
      };

      setWebhookEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events

      toast({
        title: response.ok ? "Webhook Test Successful" : "Webhook Test Failed",
        description: response.ok 
          ? "Your webhook endpoint responded successfully"
          : `Webhook returned ${response.status} ${response.statusText}`,
        variant: response.ok ? "default" : "destructive"
      });

    } catch (error) {
      const newEvent: WebhookEvent = {
        id: 'test_' + Date.now(),
        event: 'payment.completed (test)',
        url: webhookUrl,
        status: 'failed',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Network error'
      };

      setWebhookEvents(prev => [newEvent, ...prev.slice(0, 9)]);

      toast({
        title: "Webhook Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test webhook",
        variant: "destructive"
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  if (!merchant) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center">
          <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please authenticate as a merchant to manage webhooks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure webhooks to receive real-time payment notifications
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              placeholder="https://your-api.com/webhooks/solpay"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your endpoint will receive POST requests when payments are completed
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateWebhookSecret}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
            <Input
              id="webhookSecret"
              type={showSecret ? "text" : "password"}
              placeholder="whsec_..."
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Used to verify webhook authenticity. Keep this secret secure.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={saveWebhookSettings} variant="solana">
              <Send className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button 
              onClick={testWebhook} 
              variant="outline"
              disabled={!webhookUrl || isTestingWebhook}
            >
              {isTestingWebhook ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Webhook
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Events */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            History of webhook deliveries and their status
          </CardDescription>
        </CardHeader>

        <CardContent>
          {webhookEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhook events yet</p>
              <p className="text-sm">Events will appear here when webhooks are sent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhookEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {event.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : event.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">{event.event}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </div>
                      {event.error && (
                        <div className="text-sm text-destructive">{event.error}</div>
                      )}
                      {event.response && (
                        <div className="text-sm text-accent">{event.response}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        event.status === 'success' ? 'default' : 
                        event.status === 'failed' ? 'destructive' : 'secondary'
                      }
                    >
                      {event.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(event.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Documentation */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Webhook Documentation</CardTitle>
          <CardDescription>
            How to handle webhook events in your application
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Event Types</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <code>payment.completed</code> - Payment successfully confirmed</li>
              <li>• <code>payment.failed</code> - Payment failed or expired</li>
              <li>• <code>invoice.created</code> - New invoice/payment link created</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Payload Example</h4>
            <Textarea
              readOnly
              value={JSON.stringify({
                event: "payment.completed",
                data: {
                  invoice_id: "inv_1234567890_abc123",
                  amount: "10.00",
                  token: "USDC",
                  customer_wallet: "7xKXt...9Qj2m",
                  transaction_signature: "5J7K8L9M...",
                  timestamp: "2024-01-01T12:00:00Z"
                },
                webhook_id: "wh_1234567890"
              }, null, 2)}
              className="font-mono text-xs"
              rows={12}
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Security</h4>
            <p className="text-sm text-muted-foreground">
              Verify webhook authenticity using the X-Webhook-Signature header with your webhook secret.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  CheckCircle,
  Bell,
  Webhook,
  Smartphone
} from 'lucide-react';

export const PaymentGuide = () => {
  return (
    <div className="space-y-6">
      {/* How It Works Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            How Payment Confirmation Works
          </CardTitle>
          <CardDescription>
            Understanding how merchants receive payment notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step by Step Process */}
          <div className="space-y-4">
            <h4 className="font-medium">The Payment Flow:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  1
                </div>
                <h5 className="font-medium text-sm">Customer Pays</h5>
                <p className="text-xs text-muted-foreground">
                  Customer scans QR or clicks payment link
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  2
                </div>
                <h5 className="font-medium text-sm">Blockchain Confirms</h5>
                <p className="text-xs text-muted-foreground">
                  Transaction is confirmed on Solana
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  3
                </div>
                <h5 className="font-medium text-sm">System Detects</h5>
                <p className="text-xs text-muted-foreground">
                  Our monitor detects the payment
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  4
                </div>
                <h5 className="font-medium text-sm">You're Notified</h5>
                <p className="text-xs text-muted-foreground">
                  Instant notification to you
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Methods */}
          <div className="space-y-4">
            <h4 className="font-medium">How You Get Notified:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <h5 className="font-medium">Real-time Dashboard</h5>
                  <Badge variant="default">Live</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep the dashboard open to see payments instantly with browser notifications and sounds
                </p>
              </div>

              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Webhook className="h-5 w-5 text-green-500" />
                  <h5 className="font-medium">Webhook Notifications</h5>
                  <Badge variant="default">Automatic</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure webhooks to send payment data to your server or third-party services
                </p>
              </div>

              <div className="border border-border rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  <h5 className="font-medium">Mobile App</h5>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Push notifications to your phone when payments are received
                </p>
              </div>

              <div className="border border-border rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-orange-500" />
                  <h5 className="font-medium">Email Alerts</h5>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Email notifications with payment details and receipts
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Key Benefits */}
          <div className="space-y-4">
            <h4 className="font-medium">Why This System is Better:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h5 className="font-medium">Instant</h5>
                <p className="text-xs text-muted-foreground">
                  Know about payments within seconds, not hours
                </p>
              </div>
              
              <div className="text-center">
                <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h5 className="font-medium">Secure</h5>
                <p className="text-xs text-muted-foreground">
                  Blockchain verification ensures payment authenticity
                </p>
              </div>
              
              <div className="text-center">
                <Globe className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h5 className="font-medium">Global</h5>
                <p className="text-xs text-muted-foreground">
                  Accept payments from anywhere in the world
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>
            Get started with payment monitoring in 3 steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h5 className="font-medium">1. Enable Monitoring</h5>
                <p className="text-sm text-muted-foreground">
                  Go to the "Payments" tab and make sure monitoring is active (green status)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h5 className="font-medium">2. Create Payment Links</h5>
                <p className="text-sm text-muted-foreground">
                  Use the "Create" tab to generate payment links for your products/services
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h5 className="font-medium">3. Share & Monitor</h5>
                <p className="text-sm text-muted-foreground">
                  Share payment links with customers and watch payments come in real-time
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Pro Tip</span>
            </div>
            <p className="text-sm text-green-700">
              Keep the dashboard open in a browser tab to receive instant notifications. 
              You can also set up webhooks to integrate with your existing systems.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

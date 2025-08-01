import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  ExternalLink,
  Webhook,
  Mail,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { getInvoices, PaymentStatus, formatAmount } from '@/lib/payment-utils';
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor';
import { useToast } from '@/hooks/use-toast';

export const PaymentConfirmationSystem = () => {
  const { toast } = useToast();
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Initialize transaction monitoring
  const { startMonitoring, stopMonitoring } = useTransactionMonitor({
    onPaymentConfirmed: (confirmation) => {
      // This is how merchants get notified of payments!
      console.log('🎉 PAYMENT RECEIVED!', confirmation);
      
      // Show notification
      toast({
        title: "💰 Payment Received!",
        description: `${formatAmount(confirmation.actualAmount, confirmation.invoice.token)} ${confirmation.invoice.token} from ${confirmation.customerWallet?.toString().slice(0, 8)}...`,
      });

      // Play notification sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(() => {}); // Ignore errors if audio fails
      } catch (error) {
        // Ignore audio errors
      }

      // Update recent payments
      loadRecentPayments();
    }
  });

  const loadRecentPayments = () => {
    const invoices = getInvoices();
    const completedToday = invoices.filter(inv => {
      const today = new Date();
      const invDate = new Date(inv.updatedAt);
      return inv.status === PaymentStatus.COMPLETED && 
             invDate.toDateString() === today.toDateString();
    });

    setRecentPayments(completedToday.slice(0, 5)); // Last 5 payments
    
    const todayTotal = completedToday.reduce((sum, inv) => 
      sum + parseFloat(inv.amount.toString()), 0
    );
    setTotalToday(todayTotal);
  };

  useEffect(() => {
    loadRecentPayments();
    setIsMonitoring(true);
  }, []);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
      setIsMonitoring(false);
      toast({
        title: "Monitoring Stopped",
        description: "You won't receive real-time payment notifications",
        variant: "destructive"
      });
    } else {
      startMonitoring();
      setIsMonitoring(true);
      toast({
        title: "Monitoring Started",
        description: "You'll receive real-time payment notifications",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Monitoring Status */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Payment Monitoring</CardTitle>
            </div>
            <Button
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              onClick={toggleMonitoring}
            >
              {isMonitoring ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-pulse" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            {isMonitoring 
              ? "🟢 Live monitoring active - you'll be notified instantly when payments arrive"
              : "🔴 Monitoring stopped - enable to receive real-time notifications"
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Today's Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            Today's Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">${totalToday.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recentPayments.length}</div>
              <div className="text-sm text-muted-foreground">Payments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest confirmed payments</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments today</p>
              <p className="text-sm">Payments will appear here when received</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <div>
                      <div className="font-medium">{payment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.updatedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatAmount(payment.amount, payment.token)} {payment.token}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.customerWallet?.toString().slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Payment Confirmation Works */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>How Payment Confirmation Works</CardTitle>
          <CardDescription>
            Multiple ways merchants get notified of payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium">Real-time Dashboard Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Keep this dashboard open to see payments instantly with notifications and sounds
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  Webhook Notifications <Webhook className="h-4 w-4" />
                </h4>
                <p className="text-sm text-muted-foreground">
                  Configure webhooks to send payment data to your server automatically
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  Email Notifications <Mail className="h-4 w-4" />
                </h4>
                <p className="text-sm text-muted-foreground">
                  Get email alerts when payments are received (coming soon)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  Mobile App Notifications <Smartphone className="h-4 w-4" />
                </h4>
                <p className="text-sm text-muted-foreground">
                  Push notifications to your phone (coming soon)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-blue-700">
              The system monitors the Solana blockchain in real-time. When someone pays, 
              the transaction is detected within seconds and you're notified immediately. 
              No need to manually check - it's all automatic!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

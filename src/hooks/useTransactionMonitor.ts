import { useEffect, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getTransactionMonitor, PaymentConfirmation } from '@/lib/transaction-monitor';
import { updateInvoiceStatus, PaymentStatus, getInvoices } from '@/lib/payment-utils';
import { useToast } from '@/hooks/use-toast';

interface UseTransactionMonitorOptions {
  onPaymentConfirmed?: (confirmation: PaymentConfirmation) => void;
  autoStart?: boolean;
}

export const useTransactionMonitor = (options: UseTransactionMonitorOptions = {}) => {
  const { connection } = useConnection();
  const { toast } = useToast();
  const monitorRef = useRef<ReturnType<typeof getTransactionMonitor> | null>(null);
  const { onPaymentConfirmed, autoStart = true } = options;

  useEffect(() => {
    if (!connection) return;

    // Initialize monitor
    monitorRef.current = getTransactionMonitor(connection);

    // Set up payment confirmation callback
    monitorRef.current.onPaymentConfirmed((confirmation) => {
      // Update invoice status
      updateInvoiceStatus(
        confirmation.invoice.id,
        PaymentStatus.COMPLETED,
        confirmation.transactionSignature,
        confirmation.customerWallet
      );

      // Show toast notification
      toast({
        title: "Payment Received!",
        description: `Payment of ${confirmation.actualAmount.toString()} ${confirmation.invoice.token} confirmed`,
      });

      // Call custom callback if provided
      if (onPaymentConfirmed) {
        onPaymentConfirmed(confirmation);
      }
    });

    // Set up payment failure callback
    monitorRef.current.onPaymentFailed((invoice, error) => {
      updateInvoiceStatus(invoice.id, PaymentStatus.FAILED);
      
      toast({
        title: "Payment Failed",
        description: `Payment for invoice ${invoice.id} failed: ${error.message}`,
        variant: "destructive"
      });
    });

    // Auto-start monitoring if enabled
    if (autoStart) {
      monitorRef.current.startMonitoring();
    }

    // Cleanup on unmount
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring();
      }
    };
  }, [connection, onPaymentConfirmed, autoStart, toast]);

  // Manual control functions
  const startMonitoring = () => {
    if (monitorRef.current) {
      monitorRef.current.startMonitoring();
    }
  };

  const stopMonitoring = () => {
    if (monitorRef.current) {
      monitorRef.current.stopMonitoring();
    }
  };

  const checkInvoicePayment = async (invoiceId: string) => {
    if (!monitorRef.current) return null;
    
    const invoices = getInvoices();
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (!invoice) return null;
    
    try {
      return await monitorRef.current.checkInvoicePayment(invoice);
    } catch (error) {
      console.error('Error checking invoice payment:', error);
      return null;
    }
  };

  return {
    startMonitoring,
    stopMonitoring,
    checkInvoicePayment,
    isMonitoring: monitorRef.current?.isMonitoring ?? false
  };
};

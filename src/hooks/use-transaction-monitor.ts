import { useEffect, useRef, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { TransactionMonitor } from '@/lib/transaction-monitor';
import { StorageService } from '@/lib/storage';
import { Invoice, Transaction, InvoiceStatus } from '@/types/payment';

export interface TransactionMonitorState {
  isMonitoring: boolean;
  pendingInvoices: Invoice[];
  recentTransactions: Transaction[];
  totalPendingAmount: number;
}

export function useTransactionMonitor() {
  const { connection } = useConnection();
  const monitorRef = useRef<TransactionMonitor | null>(null);
  const [state, setState] = useState<TransactionMonitorState>({
    isMonitoring: false,
    pendingInvoices: [],
    recentTransactions: [],
    totalPendingAmount: 0,
  });

  // Initialize monitor
  useEffect(() => {
    if (!monitorRef.current) {
      monitorRef.current = new TransactionMonitor(connection);
    }
    
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring();
      }
    };
  }, [connection]);

  // Update state periodically
  useEffect(() => {
    const updateState = () => {
      const invoices = StorageService.getInvoices();
      const transactions = StorageService.getTransactions();
      
      const pendingInvoices = invoices.filter(inv => 
        inv.status === InvoiceStatus.CREATED || inv.status === InvoiceStatus.PENDING
      );
      
      const recentTransactions = transactions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      
      setState({
        isMonitoring: monitorRef.current?.getStatus().isMonitoring || false,
        pendingInvoices,
        recentTransactions,
        totalPendingAmount,
      });
    };

    // Initial update
    updateState();

    // Update every 2 seconds
    const interval = setInterval(updateState, 2000);
    
    return () => clearInterval(interval);
  }, []);

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

  const checkInvoice = async (invoiceId: string): Promise<boolean> => {
    const invoice = StorageService.getInvoice(invoiceId);
    if (!invoice || !monitorRef.current) return false;
    
    return await monitorRef.current.checkInvoicePayment(invoice);
  };

  const refreshData = () => {
    // Force a state update
    const invoices = StorageService.getInvoices();
    const transactions = StorageService.getTransactions();
    
    const pendingInvoices = invoices.filter(inv => 
      inv.status === InvoiceStatus.CREATED || inv.status === InvoiceStatus.PENDING
    );
    
    const recentTransactions = transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    setState({
      isMonitoring: monitorRef.current?.getStatus().isMonitoring || false,
      pendingInvoices,
      recentTransactions,
      totalPendingAmount,
    });
  };

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    checkInvoice,
    refreshData,
  };
}

import { 
  Invoice, 
  Transaction, 
  Merchant, 
  InvoiceStatus, 
  TransactionStatus,
  PaymentAnalytics,
  SupportedToken 
} from '@/types/payment';
import { PublicKey } from '@solana/web3.js';

// Local storage keys
const STORAGE_KEYS = {
  INVOICES: 'solpay_invoices',
  TRANSACTIONS: 'solpay_transactions',
  MERCHANT: 'solpay_merchant',
  SETTINGS: 'solpay_settings',
} as const;

// Storage service for managing local data
export class StorageService {
  // Invoice management
  static saveInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices, this.replacer));
  }

  static getInvoices(): Invoice[] {
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored, this.reviver);
    } catch {
      return [];
    }
  }

  static getInvoice(id: string): Invoice | null {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === id) || null;
  }

  static getInvoiceByReference(reference: string): Invoice | null {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.reference.toString() === reference) || null;
  }

  static updateInvoiceStatus(id: string, status: InvoiceStatus, transactionSignature?: string): void {
    const invoice = this.getInvoice(id);
    if (!invoice) return;

    invoice.status = status;
    invoice.updatedAt = new Date();
    
    if (status === InvoiceStatus.PAID) {
      invoice.paidAt = new Date();
      if (transactionSignature) {
        invoice.transactionSignature = transactionSignature;
      }
    }
    
    this.saveInvoice(invoice);
  }

  static deleteInvoice(id: string): void {
    const invoices = this.getInvoices().filter(inv => inv.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices, this.replacer));
  }

  // Transaction management
  static saveTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    const existingIndex = transactions.findIndex(tx => tx.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions, this.replacer));
  }

  static getTransactions(): Transaction[] {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored, this.reviver);
    } catch {
      return [];
    }
  }

  static getTransaction(id: string): Transaction | null {
    const transactions = this.getTransactions();
    return transactions.find(tx => tx.id === id) || null;
  }

  static getTransactionBySignature(signature: string): Transaction | null {
    const transactions = this.getTransactions();
    return transactions.find(tx => tx.signature === signature) || null;
  }

  static getTransactionsByInvoice(invoiceId: string): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(tx => tx.invoiceId === invoiceId);
  }

  static updateTransactionStatus(id: string, status: TransactionStatus, confirmations?: number): void {
    const transaction = this.getTransaction(id);
    if (!transaction) return;

    transaction.status = status;
    if (confirmations !== undefined) {
      transaction.confirmations = confirmations;
    }
    
    this.saveTransaction(transaction);
  }

  // Merchant management
  static saveMerchant(merchant: Merchant): void {
    localStorage.setItem(STORAGE_KEYS.MERCHANT, JSON.stringify(merchant, this.replacer));
  }

  static getMerchant(): Merchant | null {
    const stored = localStorage.getItem(STORAGE_KEYS.MERCHANT);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored, this.reviver);
    } catch {
      return null;
    }
  }

  static deleteMerchant(): void {
    localStorage.removeItem(STORAGE_KEYS.MERCHANT);
  }

  // Analytics
  static getAnalytics(): PaymentAnalytics {
    const invoices = this.getInvoices();
    const transactions = this.getTransactions();
    
    const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID);
    const totalVolume = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalTransactions = paidInvoices.length;
    const successRate = invoices.length > 0 ? (totalTransactions / invoices.length) * 100 : 0;
    const averageAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    // Token distribution
    const tokenDistribution: Record<SupportedToken, number> = {
      SOL: 0,
      USDC: 0,
      USDT: 0,
      BONK: 0,
      JUP: 0,
    };

    paidInvoices.forEach(inv => {
      tokenDistribution[inv.token] += inv.amount;
    });

    // Daily volume (last 30 days)
    const dailyVolume = this.getDailyVolumeData(paidInvoices);

    return {
      totalVolume,
      totalTransactions,
      successRate,
      averageAmount,
      tokenDistribution,
      dailyVolume,
    };
  }

  private static getDailyVolumeData(paidInvoices: Invoice[]) {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayInvoices = paidInvoices.filter(inv => 
        inv.paidAt && inv.paidAt.toISOString().split('T')[0] === date
      );
      
      return {
        date,
        volume: dayInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        transactions: dayInvoices.length,
      };
    });
  }

  // Export data
  static exportToCSV(): string {
    const invoices = this.getInvoices();
    const headers = [
      'Invoice ID',
      'Status',
      'Amount',
      'Token',
      'Title',
      'Created At',
      'Paid At',
      'Transaction Signature',
      'Customer Wallet',
    ];

    const rows = invoices.map(inv => [
      inv.id,
      inv.status,
      inv.amount.toString(),
      inv.token,
      inv.title,
      inv.createdAt.toISOString(),
      inv.paidAt?.toISOString() || '',
      inv.transactionSignature || '',
      inv.customerWallet?.toString() || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Clear all data
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // JSON serialization helpers for PublicKey and Date objects
  private static replacer(key: string, value: any): any {
    if (value instanceof PublicKey) {
      return { __type: 'PublicKey', value: value.toString() };
    }
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private static reviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type) {
      switch (value.__type) {
        case 'PublicKey':
          return new PublicKey(value.value);
        case 'Date':
          return new Date(value.value);
      }
    }
    return value;
  }
}

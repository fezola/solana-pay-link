import { PublicKey, Keypair } from '@solana/web3.js';
import { encodeURL, TransferRequestURLFields } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { InvoiceService, TransactionService } from './supabase-service';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// Invoice interface
export interface Invoice {
  id: string;
  reference: PublicKey;
  recipient: PublicKey;
  amount: BigNumber;
  token: string;
  splToken?: PublicKey; // For SPL tokens
  title: string;
  description?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  transactionSignature?: string;
  customerWallet?: PublicKey;
  metadata?: Record<string, any>;
}

// Payment link data interface
export interface PaymentLinkData {
  invoice: Invoice;
  url: string;
  qrCode?: string;
}

// SPL Token definitions (using devnet addresses for testing)
export const SPL_TOKENS = {
  SOL: {
    mint: null, // Native SOL
    decimals: 9,
    symbol: 'SOL',
    name: 'Solana',
    logo: '/solana-sol-logo.png'
  },
  USDC: {
    mint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC devnet (original)
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin (Devnet)',
    logo: '/usd-coin-usdc-logo.png'
  },
  USDT: {
    mint: new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'), // USDT devnet
    decimals: 6,
    symbol: 'USDT',
    name: 'Tether USD (Devnet)',
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
  }
};

// Generate a unique reference for payment tracking
export function generatePaymentReference(): PublicKey {
  return Keypair.generate().publicKey;
}

// Generate a unique invoice ID
export function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new invoice
export function createInvoice(params: {
  recipient: string;
  amount: string;
  token: string;
  title: string;
  description?: string;
  expiresIn?: number; // minutes
}): Invoice {
  const reference = generatePaymentReference();
  const invoiceId = generateInvoiceId();
  const now = new Date();
  
  let splToken: PublicKey | undefined;
  if (params.token !== 'SOL') {
    const tokenInfo = SPL_TOKENS[params.token as keyof typeof SPL_TOKENS];
    if (tokenInfo && tokenInfo.mint) {
      splToken = tokenInfo.mint;
    }
  }

  return {
    id: invoiceId,
    reference,
    recipient: new PublicKey(params.recipient),
    amount: new BigNumber(params.amount),
    token: params.token,
    splToken,
    title: params.title,
    description: params.description,
    status: PaymentStatus.PENDING,
    createdAt: now,
    updatedAt: now,
    expiresAt: params.expiresIn ? new Date(now.getTime() + params.expiresIn * 60 * 1000) : undefined
  };
}

// Generate Solana Pay URL with reference
export function generatePaymentURL(invoice: Invoice): string {
  const urlParams: TransferRequestURLFields = {
    recipient: invoice.recipient,
    amount: invoice.amount,
    reference: invoice.reference,
    label: invoice.title,
    message: invoice.description,
  };

  // Add SPL token if specified
  if (invoice.splToken) {
    urlParams.splToken = invoice.splToken;
  }

  return encodeURL(urlParams).toString();
}

// Local storage keys
const STORAGE_KEYS = {
  INVOICES: 'klyr_invoices',
  MERCHANT_CONFIG: 'klyr_merchant_config'
};

// Save invoice to local storage
export function saveInvoice(invoice: Invoice): void {
  const invoices = getStoredInvoices();
  invoices[invoice.id] = invoice;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices, (key, value) => {
    if (value instanceof PublicKey) {
      return { _type: 'PublicKey', value: value.toString() };
    }
    if (value instanceof BigNumber) {
      return { _type: 'BigNumber', value: value.toString() };
    }
    if (value instanceof Date) {
      return { _type: 'Date', value: value.toISOString() };
    }
    return value;
  }));
}

// Get all stored invoices
export function getStoredInvoices(): Record<string, Invoice> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!stored) return {};

    const parsed = JSON.parse(stored, (key, value) => {
      if (value && typeof value === 'object' && value._type) {
        switch (value._type) {
          case 'PublicKey':
            return new PublicKey(value.value);
          case 'BigNumber':
            return new BigNumber(value.value);
          case 'Date':
            return new Date(value.value);
        }
      }
      return value;
    });

    // Ensure all amounts are BigNumber objects
    Object.values(parsed).forEach((invoice: any) => {
      if (!(invoice.amount instanceof BigNumber)) {
        invoice.amount = new BigNumber(invoice.amount);
      }
      if (typeof invoice.reference === 'string') {
        invoice.reference = new PublicKey(invoice.reference);
      }
      if (typeof invoice.recipient === 'string') {
        invoice.recipient = new PublicKey(invoice.recipient);
      }
      if (invoice.splToken && typeof invoice.splToken === 'string') {
        invoice.splToken = new PublicKey(invoice.splToken);
      }
      if (typeof invoice.createdAt === 'string') {
        invoice.createdAt = new Date(invoice.createdAt);
      }
      if (typeof invoice.updatedAt === 'string') {
        invoice.updatedAt = new Date(invoice.updatedAt);
      }
      if (invoice.expiresAt && typeof invoice.expiresAt === 'string') {
        invoice.expiresAt = new Date(invoice.expiresAt);
      }
      if (invoice.customerWallet && typeof invoice.customerWallet === 'string') {
        invoice.customerWallet = new PublicKey(invoice.customerWallet);
      }
    });

    return parsed;
  } catch (error) {
    console.error('Error loading invoices from storage:', error);
    return {};
  }
}

// Get invoice by ID
export function getInvoiceById(id: string): Invoice | null {
  const invoices = getStoredInvoices();
  return invoices[id] || null;
}

// Get invoice by reference
export function getInvoiceByReference(reference: PublicKey): Invoice | null {
  const invoices = getStoredInvoices();
  return Object.values(invoices).find(invoice => 
    invoice.reference.equals(reference)
  ) || null;
}

// Update invoice status
export function updateInvoiceStatus(
  id: string, 
  status: PaymentStatus, 
  transactionSignature?: string,
  customerWallet?: PublicKey
): void {
  const invoices = getStoredInvoices();
  if (invoices[id]) {
    invoices[id].status = status;
    invoices[id].updatedAt = new Date();
    if (transactionSignature) {
      invoices[id].transactionSignature = transactionSignature;
    }
    if (customerWallet) {
      invoices[id].customerWallet = customerWallet;
    }
    saveInvoice(invoices[id]);
  }
}

// Clear all invoices/transactions
export function clearAllInvoices(): void {
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
}

// Get invoices with filters
export function getInvoices(filters?: {
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
}): Invoice[] {
  const invoices = Object.values(getStoredInvoices());
  let filtered = invoices;

  if (filters?.status) {
    filtered = filtered.filter(invoice => invoice.status === filters.status);
  }

  // Sort by creation date (newest first)
  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (filters?.offset) {
    filtered = filtered.slice(filters.offset);
  }

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

// Check if invoice is expired
export function isInvoiceExpired(invoice: Invoice): boolean {
  if (!invoice.expiresAt) return false;
  return new Date() > invoice.expiresAt;
}

// Format amount for display
export function formatAmount(amount: BigNumber | number | string, token: string): string {
  // Convert to BigNumber if it's not already
  let bigAmount: BigNumber;
  if (amount instanceof BigNumber) {
    bigAmount = amount;
  } else {
    bigAmount = new BigNumber(amount);
  }

  const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
  if (tokenInfo) {
    // Use BigNumber's toFixed method
    return bigAmount.toFixed(Math.min(tokenInfo.decimals, 6)); // Max 6 decimal places for display
  }
  return bigAmount.toString();
}

// Convert amount to smallest unit (lamports for SOL, base units for SPL tokens)
export function amountToBaseUnits(amount: BigNumber, token: string): BigNumber {
  const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
  if (tokenInfo) {
    return amount.multipliedBy(new BigNumber(10).pow(tokenInfo.decimals));
  }
  return amount;
}

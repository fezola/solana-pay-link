import { PublicKey } from '@solana/web3.js';

// Core payment types
export interface PaymentRequest {
  id: string;
  reference: PublicKey;
  recipient: PublicKey;
  amount: number;
  token: SupportedToken;
  label: string;
  message?: string;
  memo?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface Invoice {
  id: string;
  reference: PublicKey;
  merchantId: string;
  recipient: PublicKey;
  amount: number;
  token: SupportedToken;
  title: string;
  description?: string;
  status: InvoiceStatus;
  paymentUrl: string;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  expiresAt?: Date;
  transactionSignature?: string;
  customerWallet?: PublicKey;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  signature: string;
  amount: number;
  token: SupportedToken;
  from: PublicKey;
  to: PublicKey;
  status: TransactionStatus;
  timestamp: Date;
  blockTime?: number;
  slot?: number;
  confirmations: number;
  fee?: number;
  memo?: string;
}

// Supported tokens with their mint addresses
export interface TokenInfo {
  symbol: string;
  name: string;
  mint: PublicKey;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
}

export type SupportedToken = 'SOL' | 'USDC' | 'USDT' | 'BONK' | 'JUP';

export const TOKEN_REGISTRY: Record<SupportedToken, TokenInfo> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: new PublicKey('So11111111111111111111111111111111111111112'), // Wrapped SOL
    decimals: 9,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mainnet
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT mainnet
    decimals: 6,
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'), // BONK mainnet
    decimals: 5,
  },
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'), // JUP mainnet
    decimals: 6,
  },
};

// Status enums
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum InvoiceStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized',
  FAILED = 'failed',
}

// Form data types
export interface PaymentFormData {
  amount: string;
  token: SupportedToken;
  title: string;
  description?: string;
  recipientWallet: string;
  expiresIn?: number; // hours
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

// API response types
export interface CreateInvoiceResponse {
  invoice: Invoice;
  paymentUrl: string;
  qrCode: string;
}

export interface PaymentResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

// Webhook types
export interface WebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'invoice.expired';
  invoice: Invoice;
  transaction?: Transaction;
  timestamp: Date;
}

// Merchant types
export interface Merchant {
  id: string;
  walletAddress: PublicKey;
  email?: string;
  name?: string;
  webhookUrl?: string;
  apiKey: string;
  createdAt: Date;
  isActive: boolean;
}

// Analytics types
export interface PaymentAnalytics {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  averageAmount: number;
  tokenDistribution: Record<SupportedToken, number>;
  dailyVolume: Array<{
    date: string;
    volume: number;
    transactions: number;
  }>;
}

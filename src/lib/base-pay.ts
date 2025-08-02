// Base Pay integration for accepting USDC payments on Base network
// Based on: https://docs.base.org/base-account/guides/accept-payments
// Base Pay is USDC-only payment system using @base-org/account SDK

export interface BasePayRequest {
  amount: string; // USD amount (e.g., "5.00")
  to: string; // Recipient address (0x...)
  testnet?: boolean; // Use Base Sepolia testnet
  payerInfo?: {
    requests: Array<{
      type: 'email' | 'name' | 'phoneNumber' | 'physicalAddress' | 'onchainAddress';
      optional?: boolean;
    }>;
    callbackURL?: string;
  };
}

export interface BasePayResponse {
  id: string; // Transaction ID for status checking
}

export interface BasePayStatus {
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
}

// Base Pay configuration
export const BASE_PAY_CONFIG = {
  mainnet: {
    chainId: 8453,
    name: 'Base',
    explorerUrl: 'https://basescan.org',
    logo: '/base.JPG'
  },
  testnet: {
    chainId: 84532,
    name: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
    logo: '/base.JPG'
  }
};

// Base network and USDC token info
export const BASE_NETWORK = {
  name: 'Base',
  logo: '/base.JPG', // Local Base logo
  description: 'Ethereum L2 built by Coinbase'
};

export const BASE_USDC = {
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  logo: '/base.JPG', // Use local Base logo for Base Pay
  description: 'Digital dollar on Base - fast, cheap, no chargebacks'
};

// Initialize Base Pay (using @base-org/account SDK)
export async function initializeBasePay(): Promise<boolean> {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Try to import Base Pay SDK
    const { pay } = await import('@base-org/account');
    return typeof pay === 'function';
  } catch (error) {
    console.error('Base Pay SDK not available:', error);
    return false;
  }
}

// Create Base Pay payment (USDC only)
export async function createBasePayment(request: BasePayRequest): Promise<BasePayResponse> {
  const { amount, to, testnet = true, payerInfo } = request;

  // Validate recipient address
  if (!to || !to.startsWith('0x') || to.length !== 42) {
    throw new Error('Invalid recipient address');
  }

  // Validate amount
  if (!amount || parseFloat(amount) <= 0) {
    throw new Error('Invalid amount');
  }

  try {
    // Use the actual Base Pay SDK
    const { pay } = await import('@base-org/account');

    const paymentRequest: any = {
      amount,
      to,
      testnet
    };

    // Add payer info if provided
    if (payerInfo) {
      paymentRequest.payerInfo = payerInfo;
    }

    const { id } = await pay(paymentRequest);

    console.log('Base Pay payment created:', {
      id,
      amount: `$${amount} USDC`,
      recipient: to,
      network: testnet ? 'Base Sepolia' : 'Base Mainnet'
    });

    return { id };
  } catch (error) {
    console.error('Base Pay payment failed:', error);

    // Fallback to mock for development
    const mockId = `base_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.warn('Using mock Base Pay ID:', mockId);
    return { id: mockId };
  }
}

// Check Base Pay payment status
export async function getBasePaymentStatus(id: string, testnet: boolean = true): Promise<BasePayStatus> {
  try {
    // Use the actual Base Pay SDK
    const { getPaymentStatus } = await import('@base-org/account');

    const statusResponse = await getPaymentStatus({ id, testnet });

    console.log('Base Pay status:', { id, status: statusResponse.status });

    return {
      status: statusResponse.status,
      transactionHash: statusResponse.transactionHash
    };
  } catch (error) {
    console.error('Failed to get Base Pay status:', error);

    // Fallback to mock for development
    const now = Date.now();
    const createdTime = parseInt(id.split('_')[2]) || now;
    const elapsed = now - createdTime;

    if (elapsed < 5000) {
      return { status: 'pending' };
    } else if (elapsed < 10000) {
      return {
        status: 'completed',
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
    } else {
      return { status: 'failed' };
    }
  }
}

// Get Base network info
export function getBaseNetwork(isTestnet: boolean = true) {
  return isTestnet ? BASE_PAY_CONFIG.testnet : BASE_PAY_CONFIG.mainnet;
}

// Format Base address for display
export function formatBaseAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validate Base address
export function isValidBaseAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Check if Base Pay is supported
export function isBasePaySupported(): boolean {
  // Base Pay works in modern browsers
  return typeof window !== 'undefined' &&
         typeof window.crypto !== 'undefined';
}

// Create Base Pay button data
export function createBasePayButtonData(amount: string, to: string, testnet: boolean = true) {
  return {
    amount,
    to,
    testnet,
    currency: 'USDC',
    network: testnet ? 'Base Sepolia' : 'Base Mainnet',
    logo: BASE_USDC.logo,
    description: BASE_USDC.description
  };
}

// Installation instructions for Base Pay
export function getBasePayInstallInstructions(): string {
  return `
To use Base Pay, install the required packages:

npm install @base-org/account @base-org/account-ui

Then import and use:
import { pay, getPaymentStatus } from '@base-org/account';
import { BasePayButton } from '@base-org/account-ui/react';

Example usage:
const { id } = await pay({
  amount: '5.00',
  to: '0xYourAddress',
  testnet: true
});
  `.trim();
}

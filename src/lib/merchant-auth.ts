import { PublicKey } from '@solana/web3.js';

// Merchant profile interface
export interface MerchantProfile {
  id: string;
  walletAddress: PublicKey;
  businessName: string;
  email?: string;
  website?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: MerchantSettings;
}

// Merchant settings interface
export interface MerchantSettings {
  defaultCurrency: string;
  webhookUrl?: string;
  webhookSecret?: string;
  emailNotifications: boolean;
  autoConfirmPayments: boolean;
  paymentExpiration: number; // minutes
  allowedTokens: string[];
}

// Default merchant settings
const DEFAULT_MERCHANT_SETTINGS: MerchantSettings = {
  defaultCurrency: 'USDC',
  emailNotifications: true,
  autoConfirmPayments: true,
  paymentExpiration: 60, // 1 hour
  allowedTokens: ['SOL', 'USDC', 'USDT']
};

// Storage keys
const STORAGE_KEYS = {
  CURRENT_MERCHANT: 'solpay_current_merchant',
  MERCHANT_PROFILES: 'solpay_merchant_profiles'
};

// Generate merchant ID
function generateMerchantId(): string {
  return `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create new merchant profile
export function createMerchantProfile(params: {
  walletAddress: PublicKey;
  businessName: string;
  email?: string;
  website?: string;
  description?: string;
}): MerchantProfile {
  const now = new Date();
  
  return {
    id: generateMerchantId(),
    walletAddress: params.walletAddress,
    businessName: params.businessName,
    email: params.email,
    website: params.website,
    description: params.description,
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_MERCHANT_SETTINGS }
  };
}

// Save merchant profile
export function saveMerchantProfile(profile: MerchantProfile): void {
  const profiles = getStoredMerchantProfiles();
  profiles[profile.id] = profile;
  
  localStorage.setItem(STORAGE_KEYS.MERCHANT_PROFILES, JSON.stringify(profiles, (key, value) => {
    if (value instanceof PublicKey) {
      return { _type: 'PublicKey', value: value.toString() };
    }
    if (value instanceof Date) {
      return { _type: 'Date', value: value.toISOString() };
    }
    return value;
  }));
}

// Get all stored merchant profiles
export function getStoredMerchantProfiles(): Record<string, MerchantProfile> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MERCHANT_PROFILES);
    if (!stored) return {};

    const parsed = JSON.parse(stored, (key, value) => {
      if (value && typeof value === 'object' && value._type) {
        switch (value._type) {
          case 'PublicKey':
            return new PublicKey(value.value);
          case 'Date':
            return new Date(value.value);
        }
      }
      return value;
    });

    // Ensure walletAddress is always a PublicKey object
    Object.values(parsed).forEach((profile: any) => {
      if (typeof profile.walletAddress === 'string') {
        profile.walletAddress = new PublicKey(profile.walletAddress);
      }
    });

    return parsed;
  } catch (error) {
    console.error('Error loading merchant profiles:', error);
    return {};
  }
}

// Get merchant profile by wallet address
export function getMerchantByWallet(walletAddress: PublicKey): MerchantProfile | null {
  const profiles = getStoredMerchantProfiles();
  return Object.values(profiles).find(profile => {
    // Handle case where walletAddress might be a string after deserialization
    if (typeof profile.walletAddress === 'string') {
      return profile.walletAddress === walletAddress.toString();
    }
    return profile.walletAddress.equals(walletAddress);
  }) || null;
}

// Get merchant profile by ID
export function getMerchantById(id: string): MerchantProfile | null {
  const profiles = getStoredMerchantProfiles();
  return profiles[id] || null;
}

// Set current merchant
export function setCurrentMerchant(merchantId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_MERCHANT, merchantId);
}

// Get current merchant
export function getCurrentMerchant(): MerchantProfile | null {
  try {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_MERCHANT);
    if (!currentId) return null;
    
    return getMerchantById(currentId);
  } catch (error) {
    console.error('Error getting current merchant:', error);
    return null;
  }
}

// Clear current merchant (logout)
export function clearCurrentMerchant(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_MERCHANT);
}

// Update merchant profile
export function updateMerchantProfile(
  id: string, 
  updates: Partial<Omit<MerchantProfile, 'id' | 'walletAddress' | 'createdAt'>>
): void {
  const profiles = getStoredMerchantProfiles();
  if (profiles[id]) {
    profiles[id] = {
      ...profiles[id],
      ...updates,
      updatedAt: new Date()
    };
    saveMerchantProfile(profiles[id]);
  }
}

// Update merchant settings
export function updateMerchantSettings(
  merchantId: string,
  settings: Partial<MerchantSettings>
): void {
  const merchant = getMerchantById(merchantId);
  if (merchant) {
    merchant.settings = { ...merchant.settings, ...settings };
    merchant.updatedAt = new Date();
    saveMerchantProfile(merchant);
  }
}

// Check if wallet is authenticated as merchant
export function isWalletAuthenticated(walletAddress: PublicKey): boolean {
  const currentMerchant = getCurrentMerchant();
  if (!currentMerchant) return false;

  // Handle case where walletAddress might be a string after deserialization
  if (typeof currentMerchant.walletAddress === 'string') {
    return currentMerchant.walletAddress === walletAddress.toString();
  }
  return currentMerchant.walletAddress.equals(walletAddress);
}

// Authenticate merchant with wallet
export function authenticateMerchant(walletAddress: PublicKey): MerchantProfile | null {
  const merchant = getMerchantByWallet(walletAddress);
  if (merchant) {
    setCurrentMerchant(merchant.id);
    return merchant;
  }
  return null;
}

// Register new merchant
export function registerMerchant(params: {
  walletAddress: PublicKey;
  businessName: string;
  email?: string;
  website?: string;
  description?: string;
}): MerchantProfile {
  // Check if merchant already exists
  const existingMerchant = getMerchantByWallet(params.walletAddress);
  if (existingMerchant) {
    throw new Error('Merchant already registered with this wallet');
  }

  // Create new merchant profile
  const merchant = createMerchantProfile(params);
  saveMerchantProfile(merchant);
  setCurrentMerchant(merchant.id);
  
  return merchant;
}

// Get merchant statistics
export function getMerchantStats(merchantId: string): {
  totalInvoices: number;
  completedPayments: number;
  totalRevenue: number;
  activeInvoices: number;
} {
  // This would integrate with the invoice system
  // Import here to avoid circular dependency
  try {
    const { getInvoices, PaymentStatus } = require('./payment-utils');
    const invoices = getInvoices();

    // Filter invoices for this merchant (would need to add merchant ID to invoices)
    const completedInvoices = invoices.filter((inv: any) => inv.status === PaymentStatus.COMPLETED);
    const activeInvoices = invoices.filter((inv: any) =>
      inv.status === PaymentStatus.PENDING || inv.status === PaymentStatus.PROCESSING
    );

    const totalRevenue = completedInvoices.reduce((sum: number, inv: any) =>
      sum + parseFloat(inv.amount.toString()), 0
    );

    return {
      totalInvoices: invoices.length,
      completedPayments: completedInvoices.length,
      totalRevenue,
      activeInvoices: activeInvoices.length
    };
  } catch (error) {
    return {
      totalInvoices: 0,
      completedPayments: 0,
      totalRevenue: 0,
      activeInvoices: 0
    };
  }
}

// Validate business name
export function validateBusinessName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Business name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: 'Business name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Business name must be less than 100 characters' };
  }
  
  return { isValid: true };
}

// Validate email
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) return { isValid: true }; // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
}

// Validate website URL
export function validateWebsite(website: string): { isValid: boolean; error?: string } {
  if (!website) return { isValid: true }; // Website is optional

  try {
    new URL(website);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid website URL' };
  }
}

// Clear all merchant data (for debugging/reset)
export function clearAllMerchantData(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_MERCHANT);
  localStorage.removeItem(STORAGE_KEYS.MERCHANT_PROFILES);
}

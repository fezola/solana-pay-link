import { PublicKey } from '@solana/web3.js';
import { MerchantService } from './supabase-service';

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

// In-memory current merchant (session only)
let currentMerchant: MerchantProfile | null = null;

// Convert Supabase merchant to local format
function convertSupabaseMerchant(supabaseMerchant: any, walletAddress: PublicKey): MerchantProfile {
  return {
    id: supabaseMerchant.id,
    walletAddress: walletAddress,
    businessName: supabaseMerchant.business_name,
    email: supabaseMerchant.email || undefined,
    website: supabaseMerchant.website || undefined,
    description: supabaseMerchant.description || undefined,
    createdAt: new Date(supabaseMerchant.created_at),
    updatedAt: new Date(supabaseMerchant.updated_at),
    settings: DEFAULT_MERCHANT_SETTINGS
  };
}

// Session management (in-memory only) - DEPRECATED
// Use async getCurrentMerchant(walletAddress) instead
export function getCurrentMerchantSync(): MerchantProfile | null {
  console.warn('getCurrentMerchantSync is deprecated, use async getCurrentMerchant(walletAddress) instead');
  return currentMerchant;
}

export function setCurrentMerchant(merchantId: string): void {
  // This is now just for session management
  // The actual merchant data comes from Supabase
}

export function clearCurrentMerchant(): void {
  currentMerchant = null;
}

// Get merchant profile by wallet address (async Supabase version)
export async function getMerchantByWallet(walletAddress: PublicKey): Promise<MerchantProfile | null> {
  try {
    const supabaseMerchant = await MerchantService.getMerchantByWallet(walletAddress);
    if (supabaseMerchant) {
      return convertSupabaseMerchant(supabaseMerchant, walletAddress);
    }
    return null;
  } catch (error) {
    console.error('Error getting merchant by wallet:', error);
    return null;
  }
}

// Get merchant profile by ID (async Supabase version)
export async function getMerchantById(id: string): Promise<MerchantProfile | null> {
  try {
    // This would need to be implemented in MerchantService
    // For now, return null as we primarily use wallet-based lookup
    return null;
  } catch (error) {
    console.error('Error getting merchant by ID:', error);
    return null;
  }
}

// Update merchant profile (async Supabase version)
export async function updateMerchantProfile(
  walletAddress: PublicKey,
  updates: Partial<{
    businessName: string;
    email: string;
    website: string;
    description: string;
  }>
): Promise<MerchantProfile | null> {
  try {
    const updatedMerchant = await MerchantService.updateMerchant(walletAddress, {
      business_name: updates.businessName,
      email: updates.email,
      website: updates.website,
      description: updates.description,
    });
    return convertSupabaseMerchant(updatedMerchant, walletAddress);
  } catch (error) {
    console.error('Error updating merchant profile:', error);
    return null;
  }
}

// Update merchant settings (async Supabase version)
export async function updateMerchantSettings(
  walletAddress: PublicKey,
  settings: Partial<MerchantSettings>
): Promise<boolean> {
  try {
    // For now, we'll store settings in the description field as JSON
    // In a real implementation, you'd want a separate settings table
    const merchant = await MerchantService.getMerchantByWallet(walletAddress);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Update the current merchant in memory
    if (currentMerchant && currentMerchant.walletAddress.equals(walletAddress)) {
      currentMerchant.settings = { ...currentMerchant.settings, ...settings };
    }

    // Note: In a full implementation, you'd want to add a settings table to Supabase
    // For now, this just updates the in-memory settings
    return true;
  } catch (error) {
    console.error('Error updating merchant settings:', error);
    return false;
  }
}

// Check if wallet is authenticated as merchant
export function isWalletAuthenticated(walletAddress: PublicKey): boolean {
  const current = getCurrentMerchantSync();
  if (!current) return false;
  return current.walletAddress.equals(walletAddress);
}

// Get current merchant by wallet address (Supabase-only)
export async function getCurrentMerchant(walletAddress: PublicKey | string): Promise<MerchantProfile | null> {
  try {
    const walletAddressStr = typeof walletAddress === 'string'
      ? walletAddress
      : walletAddress.toString();

    const supabaseMerchant = await MerchantService.getMerchantByWallet(walletAddressStr);

    if (supabaseMerchant) {
      const publicKey = typeof walletAddress === 'string'
        ? new PublicKey(walletAddress)
        : walletAddress;
      return convertSupabaseMerchant(supabaseMerchant, publicKey);
    }

    return null;
  } catch (error) {
    console.error('Failed to get current merchant:', error);
    return null;
  }
}

// Authenticate merchant with wallet (Supabase-only)
export async function authenticateMerchant(walletAddress: PublicKey): Promise<MerchantProfile | null> {
  try {
    const merchant = await getCurrentMerchant(walletAddress);
    if (merchant) {
      currentMerchant = merchant;
    }
    return merchant;
  } catch (error) {
    console.error('Failed to authenticate merchant:', error);
    return null;
  }
}

// Synchronous version that returns null (for backward compatibility)
export function authenticateMerchantSync(walletAddress: PublicKey): MerchantProfile | null {
  // Since we're Supabase-only now, this always returns null
  // Components should use the async version
  console.warn('authenticateMerchantSync is deprecated, use authenticateMerchant instead');
  return null;
}

// Register new merchant (Supabase-only)
export async function registerMerchant(params: {
  walletAddress: PublicKey;
  businessName: string;
  email?: string;
  website?: string;
  description?: string;
}): Promise<MerchantProfile> {
  try {
    // Check if merchant already exists
    const existingMerchant = await MerchantService.getMerchantByWallet(params.walletAddress);
    if (existingMerchant) {
      throw new Error('Merchant already registered with this wallet');
    }

    // Create in Supabase
    const supabaseMerchant = await MerchantService.createMerchant({
      walletAddress: params.walletAddress,
      businessName: params.businessName,
      email: params.email,
      website: params.website,
      description: params.description,
    });

    // Convert and set as current merchant
    const merchant = convertSupabaseMerchant(supabaseMerchant, params.walletAddress);
    currentMerchant = merchant;

    return merchant;
  } catch (error) {
    console.error('Failed to register merchant:', error);
    throw error;
  }
}

// Get merchant statistics (Supabase-only)
export async function getMerchantStats(walletAddress: PublicKey): Promise<{
  totalInvoices: number;
  completedPayments: number;
  totalRevenue: number;
  activeInvoices: number;
  pendingInvoices: number;
}> {
  try {
    const stats = await MerchantService.getMerchantStats(walletAddress);
    return {
      totalInvoices: stats.total_invoices,
      completedPayments: stats.completed_payments,
      totalRevenue: stats.total_revenue,
      activeInvoices: stats.active_invoices,
      pendingInvoices: stats.pending_invoices
    };
  } catch (error) {
    console.error('Error getting merchant stats:', error);
    return {
      totalInvoices: 0,
      completedPayments: 0,
      totalRevenue: 0,
      activeInvoices: 0,
      pendingInvoices: 0
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
  currentMerchant = null;
}

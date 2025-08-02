import { PublicKey } from '@solana/web3.js';
import { registerMerchant, getMerchantByWallet } from './merchant-auth';

// Demo merchant configuration
const DEMO_MERCHANT_CONFIG = {
  walletAddress: 'HH6V2MRkEbVaYwsas3YrxuhKFKWW1wvp6kbX51SA8UoU',
  businessName: "Alex's Coffee Corner",
  email: 'alex@coffeecorner.dev',
  website: 'https://coffeecorner.dev',
  description: 'Supporting my coding journey, one coffee at a time! Building awesome Solana dApps and sharing knowledge with the community.'
};

// Setup demo merchant account (async)
export async function setupDemoMerchant(): Promise<void> {
  try {
    const walletAddress = new PublicKey(DEMO_MERCHANT_CONFIG.walletAddress);

    // Check if merchant already exists
    const existingMerchant = await getMerchantByWallet(walletAddress);
    if (existingMerchant) {
      console.log('Demo merchant already exists:', existingMerchant.businessName);
      return;
    }

    // Register new demo merchant
    const merchant = await registerMerchant({
      walletAddress,
      businessName: DEMO_MERCHANT_CONFIG.businessName,
      email: DEMO_MERCHANT_CONFIG.email,
      website: DEMO_MERCHANT_CONFIG.website,
      description: DEMO_MERCHANT_CONFIG.description
    });

    console.log('Demo merchant created:', merchant.businessName);

    // Add some demo webhook configuration
    const { updateMerchantSettings } = await import('./merchant-auth');
    await updateMerchantSettings(walletAddress, {
      webhookUrl: 'https://webhook.site/your-unique-url',
      defaultCurrency: 'USDC',
      paymentExpiration: 30,
      allowedTokens: ['SOL', 'USDC', 'USDT']
    });

  } catch (error) {
    console.error('Error setting up demo merchant:', error);
  }
}

// Get demo merchant wallet address
export function getDemoMerchantWallet(): string {
  return DEMO_MERCHANT_CONFIG.walletAddress;
}

// Check if current wallet is the demo merchant
export function isDemoMerchant(walletAddress: PublicKey): boolean {
  return walletAddress.toString() === DEMO_MERCHANT_CONFIG.walletAddress;
}

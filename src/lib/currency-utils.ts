import BigNumber from 'bignumber.js';

// Mock exchange rates (in a real app, you'd fetch these from an API)
export const EXCHANGE_RATES = {
  // All rates relative to USD
  SOL: 20.50, // 1 SOL = $20.50
  USDC: 1.00, // 1 USDC = $1.00
  USDT: 1.00, // 1 USDT = $1.00
};

// Store's accepted currencies and preferences
export interface StoreConfig {
  acceptedCurrencies: string[];
  baseCurrency: string; // Currency for displaying prices
  preferredCurrency?: string; // Currency store prefers to receive
  conversionEnabled: boolean;
}

// Default store configuration
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  acceptedCurrencies: ['SOL', 'USDC'],
  baseCurrency: 'USD', // Display prices in USD
  preferredCurrency: 'USDC', // But prefer to receive USDC
  conversionEnabled: true
};

// Convert amount from one currency to another
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const usdAmount = fromCurrency === 'USD' 
    ? amount 
    : amount * EXCHANGE_RATES[fromCurrency as keyof typeof EXCHANGE_RATES];
  
  const targetAmount = toCurrency === 'USD'
    ? usdAmount
    : usdAmount / EXCHANGE_RATES[toCurrency as keyof typeof EXCHANGE_RATES];
  
  return Math.round(targetAmount * 1000000) / 1000000; // Round to 6 decimal places
}

// Get price in all accepted currencies
export function getPriceInAllCurrencies(
  basePrice: number,
  baseCurrency: string,
  acceptedCurrencies: string[]
): Record<string, number> {
  const prices: Record<string, number> = {};
  
  acceptedCurrencies.forEach(currency => {
    prices[currency] = convertCurrency(basePrice, baseCurrency, currency);
  });
  
  return prices;
}

// Calculate the best rate for customer (lowest cost)
export function getBestRateForCustomer(
  usdPrice: number,
  acceptedCurrencies: string[]
): { currency: string; amount: number; savings?: number } {
  const prices = getPriceInAllCurrencies(usdPrice, 'USD', acceptedCurrencies);
  
  // For demo purposes, let's say SOL has a 2% discount
  if (prices.SOL) {
    prices.SOL = prices.SOL * 0.98; // 2% discount
  }
  
  // Find the currency with the lowest USD equivalent cost
  let bestCurrency = acceptedCurrencies[0];
  let bestUsdCost = convertCurrency(prices[bestCurrency], bestCurrency, 'USD');
  
  acceptedCurrencies.forEach(currency => {
    const usdCost = convertCurrency(prices[currency], currency, 'USD');
    if (usdCost < bestUsdCost) {
      bestCurrency = currency;
      bestUsdCost = usdCost;
    }
  });
  
  const savings = usdPrice - bestUsdCost;
  
  return {
    currency: bestCurrency,
    amount: prices[bestCurrency],
    savings: savings > 0.01 ? savings : undefined
  };
}

// Format currency display
export function formatCurrencyDisplay(
  amount: number,
  currency: string,
  showUsdEquivalent: boolean = true
): string {
  const formatted = `${amount.toFixed(currency === 'SOL' ? 4 : 2)} ${currency}`;
  
  if (showUsdEquivalent && currency !== 'USD') {
    const usdValue = convertCurrency(amount, currency, 'USD');
    return `${formatted} (~$${usdValue.toFixed(2)})`;
  }
  
  return formatted;
}

// Calculate cart total in preferred currency
export function calculateCartTotal(
  items: Array<{ price: number; currency: string; quantity: number }>,
  targetCurrency: string
): { total: number; currency: string; breakdown: Array<{ originalPrice: number; originalCurrency: string; convertedPrice: number; quantity: number }> } {
  let total = 0;
  const breakdown: Array<{ originalPrice: number; originalCurrency: string; convertedPrice: number; quantity: number }> = [];
  
  items.forEach(item => {
    const convertedPrice = convertCurrency(item.price, item.currency, targetCurrency);
    const itemTotal = convertedPrice * item.quantity;
    total += itemTotal;
    
    breakdown.push({
      originalPrice: item.price,
      originalCurrency: item.currency,
      convertedPrice,
      quantity: item.quantity
    });
  });
  
  return {
    total: Math.round(total * 1000000) / 1000000,
    currency: targetCurrency,
    breakdown
  };
}

// Get current exchange rates (mock function - in real app, fetch from API)
export async function fetchCurrentRates(): Promise<typeof EXCHANGE_RATES> {
  // In a real application, you would fetch from:
  // - CoinGecko API
  // - Jupiter API (for Solana tokens)
  // - Your preferred price oracle
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Add some realistic fluctuation for demo
  const fluctuation = () => 1 + (Math.random() - 0.5) * 0.02; // ±1% fluctuation
  
  return {
    SOL: EXCHANGE_RATES.SOL * fluctuation(),
    USDC: 1.00, // Stablecoins don't fluctuate much
    USDT: 1.00,
  };
}

// Check if store accepts a specific currency
export function isAcceptedCurrency(currency: string, storeConfig: StoreConfig): boolean {
  return storeConfig.acceptedCurrencies.includes(currency);
}

// Get payment options for a USD price
export function getPaymentOptions(
  usdPrice: number,
  storeConfig: StoreConfig
): Array<{
  currency: string;
  amount: number;
  usdEquivalent: number;
  isPreferred: boolean;
  discount?: number;
  savings?: number;
}> {
  const options: Array<{
    currency: string;
    amount: number;
    usdEquivalent: number;
    isPreferred: boolean;
    discount?: number;
    savings?: number;
  }> = [];
  
  storeConfig.acceptedCurrencies.forEach(currency => {
    let amount = convertCurrency(usdPrice, 'USD', currency);
    let discount = 0;
    
    // Apply discounts for certain currencies
    if (currency === 'SOL') {
      discount = 0.02; // 2% discount for SOL payments
      amount = amount * (1 - discount);
    }
    
    const usdEquivalent = convertCurrency(amount, currency, 'USD');
    const savings = usdPrice - usdEquivalent;
    
    options.push({
      currency,
      amount,
      usdEquivalent,
      isPreferred: currency === storeConfig.preferredCurrency,
      discount: discount > 0 ? discount : undefined,
      savings: savings > 0.01 ? savings : undefined
    });
  });
  
  // Sort by savings (best deals first)
  return options.sort((a, b) => (b.savings || 0) - (a.savings || 0));
}

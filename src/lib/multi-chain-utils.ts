import { 
  SUPPORTED_CHAINS, 
  DEFAULT_MULTICHAIN_CONFIG, 
  ChainConfig, 
  TokenConfig,
  MultiChainStoreConfig 
} from './multi-chain-config';

// Multi-chain payment option interface
export interface MultiChainPaymentOption {
  chain: string;
  chainName: string;
  chainLogo: string;
  token: string;
  tokenName: string;
  tokenLogo: string;
  amount: number;
  usdEquivalent: number;
  isNative: boolean;
  isPreferred: boolean;
  discount?: number;
  savings?: number;
  estimatedGasFee?: number;
  estimatedTime?: string; // e.g., "~15 seconds", "~2 minutes"
}

// Mock price data (in production, fetch from CoinGecko, CoinMarketCap, etc.)
const MOCK_PRICES: Record<string, number> = {
  'solana': 20.50,
  'ethereum': 2400.00,
  'matic-network': 0.85,
  'avalanche-2': 35.00,
  'binancecoin': 310.00,
  'usd-coin': 1.00,
  'tether': 1.00
};

// Mock gas fees (in USD)
const ESTIMATED_GAS_FEES: Record<string, number> = {
  'solana': 0.0001,
  'ethereum': 15.00,
  'base': 0.50,
  'polygon': 0.01,
  'avalanche': 0.25,
  'bsc': 0.20
};

// Transaction time estimates
const TRANSACTION_TIMES: Record<string, string> = {
  'solana': '~400ms',
  'ethereum': '~1-2 min',
  'base': '~2-5 sec',
  'polygon': '~2-5 sec',
  'avalanche': '~1-3 sec',
  'bsc': '~3-5 sec'
};

// Get current token price
export const getTokenPrice = async (coingeckoId: string): Promise<number> => {
  // In production, fetch from CoinGecko API
  // For now, return mock data
  return MOCK_PRICES[coingeckoId] || 1.00;
};

// Generate multi-chain payment options
export const getMultiChainPaymentOptions = async (
  usdAmount: number,
  storeConfig: MultiChainStoreConfig = DEFAULT_MULTICHAIN_CONFIG
): Promise<MultiChainPaymentOption[]> => {
  const options: MultiChainPaymentOption[] = [];

  for (const chainName of storeConfig.acceptedChains) {
    const chain = SUPPORTED_CHAINS[chainName];
    if (!chain) continue;

    for (const token of chain.tokens) {
      // Skip if token not in accepted list
      if (!storeConfig.acceptedTokens.includes(token.symbol)) continue;

      try {
        const tokenPrice = await getTokenPrice(token.coingeckoId || token.symbol.toLowerCase());
        const discount = storeConfig.discounts?.[token.symbol] || 0;
        const discountedAmount = usdAmount * (1 - discount);
        const tokenAmount = discountedAmount / tokenPrice;
        const savings = usdAmount - discountedAmount;

        const option: MultiChainPaymentOption = {
          chain: chainName,
          chainName: chain.displayName,
          chainLogo: chain.logo,
          token: token.symbol,
          tokenName: token.name,
          tokenLogo: token.logo,
          amount: tokenAmount,
          usdEquivalent: discountedAmount,
          isNative: token.isNative || false,
          isPreferred: (chainName === storeConfig.preferredChain && token.symbol === storeConfig.preferredToken),
          discount: discount > 0 ? discount : undefined,
          savings: savings > 0 ? savings : undefined,
          estimatedGasFee: ESTIMATED_GAS_FEES[chainName] || 0,
          estimatedTime: TRANSACTION_TIMES[chainName] || '~30 sec'
        };

        options.push(option);
      } catch (error) {
        console.warn(`Failed to get price for ${token.symbol}:`, error);
      }
    }
  }

  // Sort options: preferred first, then by savings, then by gas fees
  return options.sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    if ((a.savings || 0) !== (b.savings || 0)) return (b.savings || 0) - (a.savings || 0);
    return (a.estimatedGasFee || 0) - (b.estimatedGasFee || 0);
  });
};

// Get supported chains for display
export const getSupportedChains = (storeConfig: MultiChainStoreConfig = DEFAULT_MULTICHAIN_CONFIG): ChainConfig[] => {
  return storeConfig.acceptedChains
    .map(chainName => SUPPORTED_CHAINS[chainName])
    .filter(Boolean);
};

// Get chain statistics
export interface ChainStats {
  totalChains: number;
  totalTokens: number;
  averageGasFee: number;
  fastestChain: string;
  cheapestChain: string;
}

export const getChainStats = (storeConfig: MultiChainStoreConfig = DEFAULT_MULTICHAIN_CONFIG): ChainStats => {
  const supportedChains = getSupportedChains(storeConfig);
  const totalTokens = supportedChains.reduce((sum, chain) => {
    return sum + chain.tokens.filter(token => storeConfig.acceptedTokens.includes(token.symbol)).length;
  }, 0);

  const gasFees = supportedChains.map(chain => ESTIMATED_GAS_FEES[chain.name] || 0);
  const averageGasFee = gasFees.reduce((sum, fee) => sum + fee, 0) / gasFees.length;

  // Find fastest and cheapest chains
  const chainsBySpeed = supportedChains.sort((a, b) => {
    const timeA = TRANSACTION_TIMES[a.name] || '~30 sec';
    const timeB = TRANSACTION_TIMES[b.name] || '~30 sec';
    return timeA.localeCompare(timeB);
  });

  const chainsByGas = supportedChains.sort((a, b) => {
    return (ESTIMATED_GAS_FEES[a.name] || 0) - (ESTIMATED_GAS_FEES[b.name] || 0);
  });

  return {
    totalChains: supportedChains.length,
    totalTokens,
    averageGasFee,
    fastestChain: chainsBySpeed[0]?.displayName || 'Unknown',
    cheapestChain: chainsByGas[0]?.displayName || 'Unknown'
  };
};

// Validate chain and token combination
export const isValidChainToken = (chainName: string, tokenSymbol: string): boolean => {
  const chain = SUPPORTED_CHAINS[chainName];
  if (!chain) return false;
  
  return chain.tokens.some(token => token.symbol === tokenSymbol);
};

// Get recommended payment option
export const getRecommendedPayment = async (
  usdAmount: number,
  storeConfig: MultiChainStoreConfig = DEFAULT_MULTICHAIN_CONFIG
): Promise<MultiChainPaymentOption | null> => {
  const options = await getMultiChainPaymentOptions(usdAmount, storeConfig);
  return options.find(option => option.isPreferred) || options[0] || null;
};

// Format amount for display
export const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  if (amount < 0.000001) return amount.toExponential(2);
  if (amount < 0.01) return amount.toFixed(6);
  if (amount < 1) return amount.toFixed(4);
  if (amount < 1000) return amount.toFixed(2);
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// Get chain color theme
export const getChainTheme = (chainName: string): { primary: string; secondary: string; accent: string } => {
  const themes: Record<string, { primary: string; secondary: string; accent: string }> = {
    'solana': { primary: '#9945FF', secondary: '#14F195', accent: '#000000' },
    'ethereum': { primary: '#627EEA', secondary: '#E7E7E7', accent: '#000000' },
    'base': { primary: '#0052FF', secondary: '#FFFFFF', accent: '#000000' },
    'polygon': { primary: '#8247E5', secondary: '#FFFFFF', accent: '#000000' },
    'avalanche': { primary: '#E84142', secondary: '#FFFFFF', accent: '#000000' },
    'bsc': { primary: '#F3BA2F', secondary: '#000000', accent: '#FFFFFF' }
  };
  
  return themes[chainName] || { primary: '#6B7280', secondary: '#F3F4F6', accent: '#000000' };
};

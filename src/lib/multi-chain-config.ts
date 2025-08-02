// Multi-Chain Payment System Configuration
export interface ChainConfig {
  id: number;
  name: string;
  displayName: string;
  symbol: string;
  logo: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  tokens: TokenConfig[];
  isTestnet?: boolean;
}

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  isNative?: boolean;
  coingeckoId?: string;
}

// Supported Blockchain Networks
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // Solana (existing)
  solana: {
    id: 101,
    name: 'solana',
    displayName: 'Solana',
    symbol: 'SOL',
    logo: '/solana-sol-logo.png',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    tokens: [
      {
        symbol: 'SOL',
        name: 'Solana',
        address: 'native',
        decimals: 9,
        logo: '/solana-sol-logo.png',
        isNative: true,
        coingeckoId: 'solana'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        coingeckoId: 'usd-coin'
      }
    ]
  },

  // Ethereum Mainnet
  ethereum: {
    id: 1,
    name: 'ethereum',
    displayName: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        address: 'native',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        isNative: true,
        coingeckoId: 'ethereum'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E6441b8435b662f0E2d0c2837c5c8b8b',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        coingeckoId: 'usd-coin'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        coingeckoId: 'tether'
      }
    ]
  },

  // Base (Coinbase L2)
  base: {
    id: 8453,
    name: 'base',
    displayName: 'Base',
    symbol: 'ETH',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        address: 'native',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        isNative: true,
        coingeckoId: 'ethereum'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        coingeckoId: 'usd-coin'
      }
    ]
  },

  // Polygon
  polygon: {
    id: 137,
    name: 'polygon',
    displayName: 'Polygon',
    symbol: 'MATIC',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    },
    tokens: [
      {
        symbol: 'MATIC',
        name: 'Polygon',
        address: 'native',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        isNative: true,
        coingeckoId: 'matic-network'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        coingeckoId: 'usd-coin'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        coingeckoId: 'tether'
      }
    ]
  },

  // Avalanche
  avalanche: {
    id: 43114,
    name: 'avalanche',
    displayName: 'Avalanche',
    symbol: 'AVAX',
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    tokens: [
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: 'native',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
        isNative: true,
        coingeckoId: 'avalanche-2'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        coingeckoId: 'usd-coin'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        decimals: 6,
        logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        coingeckoId: 'tether'
      }
    ]
  },

  // BNB Smart Chain
  bsc: {
    id: 56,
    name: 'bsc',
    displayName: 'BNB Chain',
    symbol: 'BNB',
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    tokens: [
      {
        symbol: 'BNB',
        name: 'BNB',
        address: 'native',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        isNative: true,
        coingeckoId: 'binancecoin'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        coingeckoId: 'usd-coin'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
        logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        coingeckoId: 'tether'
      }
    ]
  }
};

// Default multi-chain store configuration
export interface MultiChainStoreConfig {
  acceptedChains: string[];
  acceptedTokens: string[];
  baseCurrency: string;
  preferredChain?: string;
  preferredToken?: string;
  conversionEnabled: boolean;
  discounts?: Record<string, number>; // chain/token -> discount percentage
}

export const DEFAULT_MULTICHAIN_CONFIG: MultiChainStoreConfig = {
  acceptedChains: ['solana', 'ethereum', 'base', 'polygon', 'avalanche', 'bsc'],
  acceptedTokens: ['SOL', 'ETH', 'MATIC', 'AVAX', 'BNB', 'USDC', 'USDT'],
  baseCurrency: 'USD',
  preferredChain: 'solana',
  preferredToken: 'USDC',
  conversionEnabled: true,
  discounts: {
    'SOL': 0.02, // 2% discount for SOL payments
    'ETH': 0.01, // 1% discount for ETH payments
    'MATIC': 0.03, // 3% discount for MATIC payments
    'AVAX': 0.025, // 2.5% discount for AVAX payments
    'BNB': 0.02, // 2% discount for BNB payments
  }
};

// Helper functions
export const getChainById = (chainId: number): ChainConfig | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
};

export const getChainByName = (name: string): ChainConfig | undefined => {
  return SUPPORTED_CHAINS[name];
};

export const getAllSupportedTokens = (): TokenConfig[] => {
  return Object.values(SUPPORTED_CHAINS).flatMap(chain => chain.tokens);
};

export const getTokensByChain = (chainName: string): TokenConfig[] => {
  const chain = SUPPORTED_CHAINS[chainName];
  return chain ? chain.tokens : [];
};

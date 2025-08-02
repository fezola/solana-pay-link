// Multi-Chain Wallet Connection System

export interface WalletProvider {
  name: string;
  displayName: string;
  logo: string;
  supportedChains: string[];
  isInstalled: () => boolean;
  connect: () => Promise<string>; // Returns wallet address
  disconnect: () => Promise<void>;
  getBalance: (chainName: string, tokenAddress?: string) => Promise<number>;
  sendTransaction: (params: TransactionParams) => Promise<string>; // Returns transaction hash
}

export interface TransactionParams {
  chainName: string;
  to: string;
  amount: number;
  tokenAddress?: string; // undefined for native tokens
  data?: string;
}

// Wallet connection status
export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  chainName?: string;
  provider?: WalletProvider;
}

// Mock wallet providers (in production, integrate with actual wallet SDKs)
export const WALLET_PROVIDERS: Record<string, WalletProvider> = {
  // MetaMask - EVM chains ONLY (NOT Solana)
  metamask: {
    name: 'metamask',
    displayName: 'MetaMask',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    supportedChains: ['ethereum', 'base', 'polygon', 'avalanche', 'bsc'], // NO SOLANA
    isInstalled: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = (window as any).ethereum;
      return !!(ethereum?.isMetaMask && !ethereum?.isPhantom); // Exclude Phantom
    },
    connect: async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('MetaMask not installed');
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    },
    disconnect: async () => {
      // MetaMask doesn't have a disconnect method, user must disconnect manually
    },
    getBalance: async (chainName: string, tokenAddress?: string) => {
      // Mock implementation - in production, use ethers.js or web3.js
      return Math.random() * 10; // Random balance for demo
    },
    sendTransaction: async (params: TransactionParams) => {
      // Mock implementation - in production, use ethers.js or web3.js
      console.log('Sending EVM transaction:', params);
      return '0x' + Math.random().toString(16).substr(2, 64); // Mock transaction hash
    }
  },

  // Phantom - Solana ONLY (NOT EVM chains)
  phantom: {
    name: 'phantom',
    displayName: 'Phantom',
    logo: 'https://phantom.app/img/phantom-logo.png',
    supportedChains: ['solana'], // ONLY SOLANA
    isInstalled: () => {
      if (typeof window === 'undefined') return false;
      return !!(window as any).solana?.isPhantom;
    },
    connect: async () => {
      if (typeof window === 'undefined' || !(window as any).solana) {
        throw new Error('Phantom not installed');
      }
      const response = await (window as any).solana.connect();
      return response.publicKey.toString();
    },
    disconnect: async () => {
      if ((window as any).solana) {
        await (window as any).solana.disconnect();
      }
    },
    getBalance: async (chainName: string, tokenAddress?: string) => {
      // Mock implementation - in production, use @solana/web3.js
      return Math.random() * 5; // Random balance for demo
    },
    sendTransaction: async (params: TransactionParams) => {
      // Mock implementation - in production, use @solana/web3.js
      console.log('Sending Solana transaction:', params);
      return Math.random().toString(16).substr(2, 64); // Mock transaction hash
    }
  },

  // WalletConnect - Multi-chain
  walletconnect: {
    name: 'walletconnect',
    displayName: 'WalletConnect',
    logo: 'https://walletconnect.com/walletconnect-logo.svg',
    supportedChains: ['ethereum', 'base', 'polygon', 'avalanche', 'bsc'],
    isInstalled: () => true, // WalletConnect is always available
    connect: async () => {
      // Mock implementation - in production, use @walletconnect/client
      console.log('Connecting via WalletConnect...');
      return '0x' + Math.random().toString(16).substr(2, 40); // Mock address
    },
    disconnect: async () => {
      console.log('Disconnecting WalletConnect...');
    },
    getBalance: async (chainName: string, tokenAddress?: string) => {
      return Math.random() * 8; // Random balance for demo
    },
    sendTransaction: async (params: TransactionParams) => {
      console.log('Sending WalletConnect transaction:', params);
      return '0x' + Math.random().toString(16).substr(2, 64); // Mock transaction hash
    }
  },

  // Coinbase Wallet
  coinbase: {
    name: 'coinbase',
    displayName: 'Coinbase Wallet',
    logo: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
    supportedChains: ['ethereum', 'base', 'polygon', 'avalanche'],
    isInstalled: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isCoinbaseWallet,
    connect: async () => {
      if (typeof window === 'undefined' || !(window as any).ethereum?.isCoinbaseWallet) {
        throw new Error('Coinbase Wallet not installed');
      }
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    },
    disconnect: async () => {
      // Coinbase Wallet disconnect
    },
    getBalance: async (chainName: string, tokenAddress?: string) => {
      return Math.random() * 12; // Random balance for demo
    },
    sendTransaction: async (params: TransactionParams) => {
      console.log('Sending Coinbase Wallet transaction:', params);
      return '0x' + Math.random().toString(16).substr(2, 64); // Mock transaction hash
    }
  }
};

// Get available wallets for a specific chain
export const getAvailableWallets = (chainName: string): WalletProvider[] => {
  return Object.values(WALLET_PROVIDERS).filter(wallet => 
    wallet.supportedChains.includes(chainName) && wallet.isInstalled()
  );
};

// Get all installed wallets
export const getInstalledWallets = (): WalletProvider[] => {
  return Object.values(WALLET_PROVIDERS).filter(wallet => wallet.isInstalled());
};

// Wallet connection manager
export class MultiChainWalletManager {
  private connections: Map<string, WalletConnection> = new Map();
  private listeners: ((connections: Map<string, WalletConnection>) => void)[] = [];

  // Connect to a wallet for a specific chain
  async connect(chainName: string, walletName: string): Promise<WalletConnection> {
    const wallet = WALLET_PROVIDERS[walletName];
    if (!wallet) {
      throw new Error(`Wallet ${walletName} not found`);
    }

    if (!wallet.supportedChains.includes(chainName)) {
      throw new Error(`Wallet ${walletName} does not support chain ${chainName}`);
    }

    try {
      const address = await wallet.connect();
      const connection: WalletConnection = {
        isConnected: true,
        address,
        chainName,
        provider: wallet
      };

      this.connections.set(chainName, connection);
      this.notifyListeners();
      return connection;
    } catch (error) {
      console.error(`Failed to connect ${walletName} for ${chainName}:`, error);
      throw error;
    }
  }

  // Disconnect from a chain
  async disconnect(chainName: string): Promise<void> {
    const connection = this.connections.get(chainName);
    if (connection?.provider) {
      await connection.provider.disconnect();
    }
    this.connections.delete(chainName);
    this.notifyListeners();
  }

  // Get connection for a chain
  getConnection(chainName: string): WalletConnection | undefined {
    return this.connections.get(chainName);
  }

  // Get all connections
  getAllConnections(): Map<string, WalletConnection> {
    return new Map(this.connections);
  }

  // Check if connected to a chain
  isConnected(chainName: string): boolean {
    return this.connections.get(chainName)?.isConnected || false;
  }

  // Add connection listener
  addListener(listener: (connections: Map<string, WalletConnection>) => void): void {
    this.listeners.push(listener);
  }

  // Remove connection listener
  removeListener(listener: (connections: Map<string, WalletConnection>) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.connections));
  }
}

// Global wallet manager instance
export const walletManager = new MultiChainWalletManager();

// Helper functions
export const formatAddress = (address: string, length: number = 8): string => {
  if (address.length <= length) return address;
  const start = Math.ceil(length / 2);
  const end = Math.floor(length / 2);
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const getWalletIcon = (walletName: string): string => {
  return WALLET_PROVIDERS[walletName]?.logo || '';
};

export const isWalletInstalled = (walletName: string): boolean => {
  return WALLET_PROVIDERS[walletName]?.isInstalled() || false;
};

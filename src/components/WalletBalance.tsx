import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SPL_TOKENS } from '@/lib/payment-utils';
import { getSOLBalance, getTokenBalance, formatTokenAmount } from '@/lib/spl-token-utils';
import BigNumber from 'bignumber.js';

interface TokenBalance {
  token: string;
  balance: BigNumber;
  symbol: string;
  name: string;
}

export const WalletBalance = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError] = useState<string>('');

  const loadBalances = async () => {
    if (!connected || !publicKey) return;

    setIsLoading(true);
    setError('');

    try {
      const tokenBalances: TokenBalance[] = [];

      // Load balances for each supported token
      for (const [tokenSymbol, tokenInfo] of Object.entries(SPL_TOKENS)) {
        try {
          let balance: BigNumber;

          if (tokenSymbol === 'SOL') {
            balance = await getSOLBalance(connection, publicKey);
          } else if (tokenInfo.mint) {
            const rawBalance = await getTokenBalance(connection, publicKey, tokenInfo.mint);
            balance = rawBalance.dividedBy(new BigNumber(10).pow(tokenInfo.decimals));
          } else {
            continue;
          }

          tokenBalances.push({
            token: tokenSymbol,
            balance,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name
          });
        } catch (error) {
          console.error(`Error loading ${tokenSymbol} balance:`, error);
          // Continue loading other tokens even if one fails
        }
      }

      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error loading balances:', error);
      setError('Failed to load wallet balances');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      loadBalances();
    } else {
      setBalances([]);
    }
  }, [connected, publicKey, connection]);

  const formatBalance = (balance: BigNumber, token: string): string => {
    if (balance.isZero()) return '0';
    
    // Show more precision for smaller amounts
    if (balance.lt(0.01)) {
      return balance.toFixed(6);
    } else if (balance.lt(1)) {
      return balance.toFixed(4);
    } else {
      return balance.toFixed(2);
    }
  };

  const getBalanceColor = (balance: BigNumber, token: string): string => {
    if (balance.isZero()) return 'text-muted-foreground';
    
    // Different thresholds for different tokens
    const lowThreshold = token === 'SOL' ? 0.1 : 10;
    const mediumThreshold = token === 'SOL' ? 1 : 100;
    
    if (balance.lt(lowThreshold)) return 'text-destructive';
    if (balance.lt(mediumThreshold)) return 'text-yellow-600';
    return 'text-accent';
  };

  if (!connected) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to view balances</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Balances
            </CardTitle>
            <CardDescription>
              Your current token balances on Solana devnet
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={loadBalances}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div>
                    <div className="w-16 h-4 bg-muted rounded mb-1"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No balances to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map((tokenBalance) => (
              <div
                key={tokenBalance.token}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border">
                    <img
                      src={SPL_TOKENS[tokenBalance.token as keyof typeof SPL_TOKENS]?.logo}
                      alt={tokenBalance.symbol}
                      className="w-6 h-6"
                      onError={(e) => {
                        // Fallback to gradient background with text
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.className = "w-8 h-8 bg-gradient-solana rounded-full flex items-center justify-center";
                          parent.innerHTML = `<span class="text-white text-xs font-bold">${tokenBalance.symbol.slice(0, 2)}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{tokenBalance.symbol}</div>
                    <div className="text-sm text-muted-foreground">{tokenBalance.name}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  {showBalances ? (
                    <div className={`font-semibold ${getBalanceColor(tokenBalance.balance, tokenBalance.token)}`}>
                      {formatBalance(tokenBalance.balance, tokenBalance.token)}
                    </div>
                  ) : (
                    <div className="font-semibold text-muted-foreground">••••</div>
                  )}
                  <div className="text-xs text-muted-foreground">{tokenBalance.symbol}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Devnet Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              Devnet
            </Badge>
            <span className="text-sm text-yellow-700">
              These are test tokens on Solana devnet
            </span>
          </div>
        </div>

        {/* Wallet Address */}
        {publicKey && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
            <div className="font-mono text-sm break-all">
              {publicKey.toString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

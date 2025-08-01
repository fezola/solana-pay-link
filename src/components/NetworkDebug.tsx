import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, AlertTriangle } from 'lucide-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SPL_TOKENS } from '@/lib/payment-utils';
import { getTokenBalance } from '@/lib/spl-token-utils';
import BigNumber from 'bignumber.js';

export const NetworkDebug = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkNetwork = async () => {
    setIsLoading(true);
    try {
      // Get network info
      const version = await connection.getVersion();
      const slot = await connection.getSlot();
      const blockHeight = await connection.getBlockHeight();
      
      setNetworkInfo({
        endpoint: connection.rpcEndpoint,
        version: version['solana-core'],
        slot,
        blockHeight,
        isDevnet: connection.rpcEndpoint.includes('devnet')
      });

      // Get wallet balance if connected
      if (connected && publicKey) {
        const balanceLamports = await connection.getBalance(publicKey);
        setBalance(balanceLamports / LAMPORTS_PER_SOL);

        // Get SPL token balances
        const tokenBals: Record<string, number> = {};
        for (const [symbol, tokenInfo] of Object.entries(SPL_TOKENS)) {
          if (tokenInfo.mint) {
            try {
              console.log(`Checking ${symbol} balance for mint:`, tokenInfo.mint.toString());
              const balance = await getTokenBalance(connection, publicKey, tokenInfo.mint);
              console.log(`${symbol} raw balance:`, balance.toString());
              const formattedBalance = balance.dividedBy(new BigNumber(10).pow(tokenInfo.decimals)).toNumber();
              console.log(`${symbol} formatted balance:`, formattedBalance);
              tokenBals[symbol] = formattedBalance;
            } catch (error) {
              console.log(`Error getting ${symbol} balance:`, error);
              tokenBals[symbol] = 0;
            }
          }
        }
        setTokenBalances(tokenBals);
      }

    } catch (error) {
      console.error('Error checking network:', error);
      setNetworkInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkNetwork();
  }, [connection, connected, publicKey]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Network Debug
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={checkNetwork}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {networkInfo ? (
          <>
            {networkInfo.error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Error: {networkInfo.error}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Network:</span>
                  <Badge variant={networkInfo.isDevnet ? "default" : "destructive"}>
                    {networkInfo.isDevnet ? 'Devnet ✓' : 'Unknown Network ⚠️'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Endpoint:</span>
                  <span className="text-xs font-mono">{networkInfo.endpoint.slice(0, 30)}...</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version:</span>
                  <span className="text-xs">{networkInfo.version}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Block Height:</span>
                  <span className="text-xs">{networkInfo.blockHeight?.toLocaleString()}</span>
                </div>

                {connected && publicKey && (
                  <>
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Wallet:</span>
                        <Badge variant="outline">Connected</Badge>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">Address:</span>
                        <span className="text-xs font-mono">{publicKey.toString().slice(0, 8)}...</span>
                      </div>

                      {balance !== null && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">SOL Balance:</span>
                          <span className="text-sm font-medium">{balance.toFixed(4)} SOL</span>
                        </div>
                      )}

                      {/* SPL Token Balances */}
                      {Object.entries(tokenBalances).map(([symbol, balance]) => (
                        <div key={symbol} className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">{symbol} Balance:</span>
                          <span className="text-sm font-medium">
                            {balance.toFixed(4)} {symbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        )}

        {/* Quick Tests */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Quick Checks:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span>Network Status:</span>
              <Badge variant={networkInfo?.isDevnet ? "default" : "secondary"} className="text-xs">
                {networkInfo?.isDevnet ? "✓ Devnet" : "? Unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Wallet Connected:</span>
              <Badge variant={connected ? "default" : "secondary"} className="text-xs">
                {connected ? "✓ Yes" : "✗ No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Has SOL Balance:</span>
              <Badge variant={balance && balance > 0 ? "default" : "secondary"} className="text-xs">
                {balance && balance > 0 ? "✓ Yes" : "✗ No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Has USDC Balance:</span>
              <Badge variant={tokenBalances.USDC && tokenBalances.USDC > 0 ? "default" : "secondary"} className="text-xs">
                {tokenBalances.USDC && tokenBalances.USDC > 0 ? "✓ Yes" : "✗ No"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

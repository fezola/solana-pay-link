import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Droplets, ExternalLink, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const TokenFaucet = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState<{ [key: string]: boolean }>({});

  const requestSOL = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsRequesting(prev => ({ ...prev, SOL: true }));

    try {
      // Request SOL from devnet faucet
      const airdropSignature = await connection.requestAirdrop(
        publicKey,
        2 * LAMPORTS_PER_SOL // 2 SOL
      );

      // Wait for confirmation
      await connection.confirmTransaction(airdropSignature, 'confirmed');

      toast({
        title: "SOL Airdrop Successful!",
        description: "2 SOL has been added to your wallet",
      });

    } catch (error) {
      console.error('SOL airdrop failed:', error);
      toast({
        title: "Airdrop Failed",
        description: "Failed to request SOL. You may have reached the rate limit.",
        variant: "destructive"
      });
    } finally {
      setIsRequesting(prev => ({ ...prev, SOL: false }));
    }
  };

  const openSPLTokenFaucet = () => {
    window.open('https://spl-token-faucet.com/?token-name=USDC', '_blank');
  };

  if (!connected) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center">
          <Droplets className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to access test tokens</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          Token Faucet
        </CardTitle>
        <CardDescription>
          Get test tokens for Solana devnet
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Devnet Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Devnet Only
            </Badge>
            <span className="text-sm text-blue-700">
              These are test tokens with no real value
            </span>
          </div>
        </div>

        {/* SOL Faucet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">SOL</span>
              </div>
              <div>
                <div className="font-medium">Solana (SOL)</div>
                <div className="text-sm text-muted-foreground">Get 2 SOL for testing</div>
              </div>
            </div>
            <Button
              onClick={requestSOL}
              disabled={isRequesting.SOL}
              variant="solana"
            >
              {isRequesting.SOL ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Droplets className="h-4 w-4 mr-2" />
                  Get SOL
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* SPL Token Faucets */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">SPL Token Faucets</h4>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">USDC</span>
                </div>
                <div>
                  <div className="font-medium">USD Coin (USDC)</div>
                  <div className="text-sm text-muted-foreground">External faucet required</div>
                </div>
              </div>
              <Button
                onClick={openSPLTokenFaucet}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Faucet
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">USDT</span>
                </div>
                <div>
                  <div className="font-medium">Tether USD (USDT)</div>
                  <div className="text-sm text-muted-foreground">Coming soon</div>
                </div>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">How to get test tokens:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• SOL: Use the button above (rate limited to prevent spam)</li>
            <li>• USDC: Visit external faucet websites</li>
            <li>• USDT: Use community faucets or ask in Discord</li>
          </ul>
        </div>

        {/* Rate Limit Notice */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-700">
            <strong>Rate Limits:</strong> SOL airdrops are limited to prevent abuse. 
            If you need more tokens, try again later or use alternative faucets.
          </div>
        </div>

        {/* Useful Links */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Useful Links</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://faucet.solana.com/', '_blank')}
              className="justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Official Solana Faucet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://spl-token-faucet.com/', '_blank')}
              className="justify-start"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              SPL Token Faucet
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

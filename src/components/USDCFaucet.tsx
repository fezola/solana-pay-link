import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Droplets, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const USDCFaucet = () => {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);

  const requestUSDC = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsRequesting(true);
    
    try {
      // For now, just show instructions since we can't directly mint USDC
      toast({
        title: "USDC Faucet Instructions",
        description: "Please use external faucets to get USDC devnet tokens",
      });

      // Open external faucet
      window.open('https://spl-token-faucet.com/?token-name=USDC', '_blank');
      
    } catch (error) {
      console.error('Error requesting USDC:', error);
      toast({
        title: "Error",
        description: "Failed to request USDC tokens",
        variant: "destructive"
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          USDC Devnet Faucet
        </CardTitle>
        <CardDescription>
          Get USDC devnet tokens for testing payments
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!connected ? (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Connect your wallet to request USDC tokens
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to get USDC Devnet tokens:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Click "Request USDC" below</li>
                <li>2. External faucet will open</li>
                <li>3. Enter your wallet address</li>
                <li>4. Select "Devnet" network</li>
                <li>5. Request tokens</li>
              </ol>
            </div>

            <div className="text-center">
              <Button
                onClick={requestUSDC}
                disabled={isRequesting}
                className="w-full"
              >
                {isRequesting ? (
                  <>
                    <Droplets className="h-4 w-4 mr-2 animate-pulse" />
                    Opening Faucet...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Request USDC Tokens
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              <p>Your wallet address:</p>
              <p className="font-mono">{publicKey?.toString()}</p>
            </div>
          </div>
        )}

        {/* Alternative Faucets */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Alternative USDC Faucets:</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://spl-token-faucet.com/?token-name=USDC', '_blank')}
              className="w-full justify-start"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              SPL Token Faucet
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://faucet.quicknode.com/solana/devnet', '_blank')}
              className="w-full justify-start"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              QuickNode Faucet
            </Button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Note</span>
          </div>
          <p className="text-xs text-yellow-700">
            These are test tokens on Solana Devnet. They have no real value and are only for testing purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

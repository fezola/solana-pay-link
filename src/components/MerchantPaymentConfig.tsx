import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Coins, 
  Percent,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  SUPPORTED_CHAINS, 
  MultiChainStoreConfig,
  DEFAULT_MULTICHAIN_CONFIG 
} from '@/lib/multi-chain-config';

interface MerchantPaymentConfigProps {
  onConfigChange: (config: MultiChainStoreConfig) => void;
  initialConfig?: MultiChainStoreConfig;
}

export const MerchantPaymentConfig = ({ 
  onConfigChange, 
  initialConfig = DEFAULT_MULTICHAIN_CONFIG 
}: MerchantPaymentConfigProps) => {
  const [config, setConfig] = useState<MultiChainStoreConfig>(initialConfig);
  const [showPreview, setShowPreview] = useState(false);

  const handleChainToggle = (chainName: string, enabled: boolean) => {
    const newChains = enabled 
      ? [...config.acceptedChains, chainName]
      : config.acceptedChains.filter(c => c !== chainName);
    
    const newConfig = { ...config, acceptedChains: newChains };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleTokenToggle = (tokenSymbol: string, enabled: boolean) => {
    const newTokens = enabled 
      ? [...config.acceptedTokens, tokenSymbol]
      : config.acceptedTokens.filter(t => t !== tokenSymbol);
    
    const newConfig = { ...config, acceptedTokens: newTokens };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleDiscountChange = (tokenSymbol: string, discount: number) => {
    const newDiscounts = { 
      ...config.discounts, 
      [tokenSymbol]: discount / 100 // Convert percentage to decimal
    };
    
    const newConfig = { ...config, discounts: newDiscounts };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const setPreferredChain = (chainName: string) => {
    const newConfig = { ...config, preferredChain: chainName };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const setPreferredToken = (tokenSymbol: string) => {
    const newConfig = { ...config, preferredToken: tokenSymbol };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const getEnabledTokensForChain = (chainName: string) => {
    const chain = SUPPORTED_CHAINS[chainName];
    if (!chain) return [];
    
    return chain.tokens.filter(token => 
      config.acceptedTokens.includes(token.symbol)
    );
  };

  const getTotalEnabledOptions = () => {
    return config.acceptedChains.reduce((total, chainName) => {
      return total + getEnabledTokensForChain(chainName).length;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Configuration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose which blockchains and tokens your store accepts. 
            Customers will see these options during checkout.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {getTotalEnabledOptions()}
              </div>
              <div className="text-sm text-gray-600">Payment Options Enabled</div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide' : 'Preview'} Customer View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Supported Blockchains
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enable the blockchains you want to accept payments from
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(SUPPORTED_CHAINS).map(([chainName, chain]) => {
            const isEnabled = config.acceptedChains.includes(chainName);
            const isPreferred = config.preferredChain === chainName;
            const enabledTokens = getEnabledTokensForChain(chainName);

            return (
              <div key={chainName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={chain.logo} 
                      alt={chain.displayName}
                      className="w-8 h-8 rounded-lg"
                    />
                    <div>
                      <div className="font-medium">{chain.displayName}</div>
                      <div className="text-sm text-gray-600">
                        {chain.tokens.length} tokens available
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isPreferred && (
                      <Badge variant="default" className="text-xs">Preferred</Badge>
                    )}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleChainToggle(chainName, checked)}
                    />
                  </div>
                </div>

                {isEnabled && (
                  <div className="space-y-3">
                    <Separator />
                    
                    {/* Set as Preferred */}
                    {!isPreferred && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreferredChain(chainName)}
                        className="text-xs"
                      >
                        Set as Preferred Chain
                      </Button>
                    )}

                    {/* Token Selection */}
                    <div>
                      <div className="text-sm font-medium mb-2">Available Tokens:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chain.tokens.map((token) => {
                          const tokenEnabled = config.acceptedTokens.includes(token.symbol);
                          const isPreferredToken = config.preferredToken === token.symbol;
                          const discount = (config.discounts?.[token.symbol] || 0) * 100;

                          return (
                            <div key={token.symbol} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={token.logo} 
                                    alt={token.symbol}
                                    className="w-5 h-5"
                                  />
                                  <span className="font-medium">{token.symbol}</span>
                                  {token.isNative && (
                                    <Badge variant="secondary" className="text-xs">Native</Badge>
                                  )}
                                  {isPreferredToken && (
                                    <Badge variant="default" className="text-xs">Preferred</Badge>
                                  )}
                                </div>
                                <Switch
                                  checked={tokenEnabled}
                                  onCheckedChange={(checked) => handleTokenToggle(token.symbol, checked)}
                                />
                              </div>

                              {tokenEnabled && (
                                <div className="space-y-2">
                                  {!isPreferredToken && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPreferredToken(token.symbol)}
                                      className="text-xs w-full"
                                    >
                                      Set as Preferred Token
                                    </Button>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    <Percent className="h-3 w-3" />
                                    <span className="text-xs">Discount:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.5"
                                      value={discount}
                                      onChange={(e) => handleDiscountChange(token.symbol, parseFloat(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 text-xs border rounded"
                                    />
                                    <span className="text-xs">%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {config.acceptedChains.length}
              </div>
              <div className="text-sm text-gray-600">Chains Enabled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {config.acceptedTokens.length}
              </div>
              <div className="text-sm text-gray-600">Tokens Enabled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(config.discounts || {}).length}
              </div>
              <div className="text-sm text-gray-600">Discounts Set</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {getTotalEnabledOptions()}
              </div>
              <div className="text-sm text-gray-600">Total Options</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Shield, 
  Clock, 
  DollarSign,
  Wallet,
  ChevronDown,
  Star,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { 
  getMultiChainPaymentOptions, 
  getChainStats,
  formatTokenAmount,
  getChainTheme,
  MultiChainPaymentOption 
} from '@/lib/multi-chain-utils';
import { 
  walletManager, 
  getAvailableWallets,
  WalletProvider,
  formatAddress 
} from '@/lib/multi-chain-wallets';
import { DEFAULT_MULTICHAIN_CONFIG } from '@/lib/multi-chain-config';

interface MultiChainCheckoutProps {
  usdTotal: number;
  onPaymentSelect: (option: MultiChainPaymentOption) => void;
  onProceedToPayment: () => void;
  isProcessing: boolean;
}

export const MultiChainCheckout = ({
  usdTotal,
  onPaymentSelect,
  onProceedToPayment,
  isProcessing
}: MultiChainCheckoutProps) => {
  const [paymentOptions, setPaymentOptions] = useState<MultiChainPaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<MultiChainPaymentOption | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [connections, setConnections] = useState(new Map());
  const [showWalletSelector, setShowWalletSelector] = useState<string | null>(null);

  // Load payment options
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const options = await getMultiChainPaymentOptions(usdTotal, DEFAULT_MULTICHAIN_CONFIG);
        setPaymentOptions(options);
        
        // Auto-select preferred option
        const preferred = options.find(opt => opt.isPreferred) || options[0];
        if (preferred) {
          setSelectedOption(preferred);
          onPaymentSelect(preferred);
        }
      } catch (error) {
        console.error('Failed to load payment options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, [usdTotal, onPaymentSelect]);

  // Listen to wallet connections
  useEffect(() => {
    const handleConnectionChange = (newConnections: Map<string, any>) => {
      setConnections(new Map(newConnections));
    };

    walletManager.addListener(handleConnectionChange);
    setConnections(walletManager.getAllConnections());

    return () => {
      walletManager.removeListener(handleConnectionChange);
    };
  }, []);

  const handleOptionSelect = (option: MultiChainPaymentOption) => {
    setSelectedOption(option);
    onPaymentSelect(option);
  };

  const handleWalletConnect = async (chainName: string, walletName: string) => {
    try {
      await walletManager.connect(chainName, walletName);
      setShowWalletSelector(null);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const getConnectionStatus = (chainName: string) => {
    const connection = connections.get(chainName);
    return connection?.isConnected ? connection : null;
  };

  const chainStats = getChainStats(DEFAULT_MULTICHAIN_CONFIG);

  if (isLoadingOptions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading payment options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Multi-Chain Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{chainStats.totalChains}</div>
              <div className="text-xs text-gray-600">Blockchains</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{chainStats.totalTokens}</div>
              <div className="text-xs text-gray-600">Tokens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{chainStats.fastestChain}</div>
              <div className="text-xs text-gray-600">Fastest</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{chainStats.cheapestChain}</div>
              <div className="text-xs text-gray-600">Cheapest</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
        <div className="space-y-3">
          {paymentOptions.map((option, index) => {
            const theme = getChainTheme(option.chain);
            const connection = getConnectionStatus(option.chain);
            const isSelected = selectedOption?.chain === option.chain && selectedOption?.token === option.token;

            return (
              <div
                key={`${option.chain}-${option.token}`}
                onClick={() => handleOptionSelect(option)}
                className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Selection Indicator */}
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>

                <div className="flex items-center gap-4 pr-8">
                  {/* Chain & Token Icons */}
                  <div className="relative">
                    <img 
                      src={option.chainLogo} 
                      alt={option.chainName}
                      className="w-12 h-12 rounded-xl shadow-sm"
                    />
                    <img 
                      src={option.tokenLogo} 
                      alt={option.token}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    />
                  </div>
                  
                  {/* Payment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {formatTokenAmount(option.amount)} {option.token}
                      </span>
                      <span className="text-sm text-gray-500">on {option.chainName}</span>
                      
                      {option.isPreferred && (
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-700">
                          <Star className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      
                      {option.discount && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {(option.discount * 100).toFixed(0)}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${option.usdEquivalent.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {option.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        ${option.estimatedGasFee?.toFixed(4)} gas
                      </div>
                    </div>

                    {option.savings && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        You save ${option.savings.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Connection Status */}
                  <div className="text-right">
                    {connection ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          {formatAddress(connection.address)}
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowWalletSelector(option.chain);
                        }}
                        className="text-xs"
                      >
                        <Wallet className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {/* Wallet Selector */}
                {showWalletSelector === option.chain && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Choose Wallet:</div>
                    <div className="flex gap-2">
                      {getAvailableWallets(option.chain).map((wallet: WalletProvider) => (
                        <Button
                          key={wallet.name}
                          variant="outline"
                          size="sm"
                          onClick={() => handleWalletConnect(option.chain, wallet.name)}
                          className="flex items-center gap-2"
                        >
                          <img src={wallet.logo} alt={wallet.displayName} className="w-4 h-4" />
                          {wallet.displayName}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Summary */}
      {selectedOption && (
        <div className="space-y-4">
          <Separator />
          
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You'll pay</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatTokenAmount(selectedOption.amount)} {selectedOption.token}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${selectedOption.usdEquivalent.toFixed(2)} USD
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Network</span>
                <span className="font-medium">{selectedOption.chainName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated gas</span>
                <span className="text-green-600 font-medium">
                  ${selectedOption.estimatedGasFee?.toFixed(4)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction time</span>
                <span className="font-medium">{selectedOption.estimatedTime}</span>
              </div>
              
              {selectedOption.savings && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount applied</span>
                  <span className="font-semibold">-${selectedOption.savings.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onProceedToPayment}
              disabled={isProcessing || !getConnectionStatus(selectedOption.chain)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-lg"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </div>
              ) : !getConnectionStatus(selectedOption.chain) ? (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect {selectedOption.chainName} Wallet First
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Pay {formatTokenAmount(selectedOption.amount)} {selectedOption.token}
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => window.history.back()}
              className="w-full text-gray-600 hover:text-gray-900 py-3"
            >
              Cancel payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

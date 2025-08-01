import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  CreditCard,
  TrendingDown,
  Star,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { SPL_TOKENS } from '@/lib/payment-utils';
import { 
  getPaymentOptions, 
  formatCurrencyDisplay, 
  fetchCurrentRates,
  DEFAULT_STORE_CONFIG,
  EXCHANGE_RATES
} from '@/lib/currency-utils';

interface MultiCurrencyCheckoutProps {
  usdTotal: number;
  onCurrencySelect: (currency: string, amount: number) => void;
  onProceedToPayment: () => void;
  isProcessing?: boolean;
}

export const MultiCurrencyCheckout = ({ 
  usdTotal, 
  onCurrencySelect, 
  onProceedToPayment,
  isProcessing = false 
}: MultiCurrencyCheckoutProps) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USDC');
  const [paymentOptions, setPaymentOptions] = useState<any[]>([]);
  const [rates, setRates] = useState(EXCHANGE_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Load payment options
  useEffect(() => {
    console.log('Loading payment options for USD total:', usdTotal);
    console.log('Available SPL_TOKENS:', Object.keys(SPL_TOKENS));
    console.log('Store config:', DEFAULT_STORE_CONFIG);

    const options = getPaymentOptions(usdTotal, DEFAULT_STORE_CONFIG);
    console.log('Generated payment options:', options);
    setPaymentOptions(options);

    // Auto-select the best option (first in sorted list)
    if (options.length > 0) {
      setSelectedCurrency(options[0].currency);
      onCurrencySelect(options[0].currency, options[0].amount);
    }
  }, [usdTotal, rates]);

  // Refresh exchange rates
  const refreshRates = async () => {
    setIsLoadingRates(true);
    try {
      const newRates = await fetchCurrentRates();
      setRates(newRates);
      
      // Recalculate options with new rates
      const options = getPaymentOptions(usdTotal, DEFAULT_STORE_CONFIG);
      setPaymentOptions(options);
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    const option = paymentOptions.find(opt => opt.currency === currency);
    if (option) {
      onCurrencySelect(currency, option.amount);
    }
  };

  const selectedOption = paymentOptions.find(opt => opt.currency === selectedCurrency);

  return (
    <div className="space-y-6">
      {/* Payment Options */}
      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <div
            key={option.currency}
            onClick={() => handleCurrencyChange(option.currency)}
            className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
              selectedCurrency === option.currency
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Selection Indicator */}
            <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-colors ${
              selectedCurrency === option.currency
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {selectedCurrency === option.currency && (
                <div className="w-full h-full rounded-full bg-white scale-50"></div>
              )}
            </div>

            <div className="flex items-center gap-4 pr-8">
              {/* Currency Icon */}
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <img
                  src={SPL_TOKENS[option.currency as keyof typeof SPL_TOKENS]?.logo}
                  alt={option.currency}
                  className="w-8 h-8"
                  onError={(e) => {
                    console.log(`Failed to load logo for ${option.currency}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Currency Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{option.currency}</span>
                  {option.isPreferred && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Recommended
                    </span>
                  )}
                  {option.discount && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {(option.discount * 100).toFixed(0)}% OFF
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {SPL_TOKENS[option.currency as keyof typeof SPL_TOKENS]?.name}
                </div>

                {/* Amount Display */}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {option.amount.toFixed(option.currency === 'SOL' ? 4 : 2)} {option.currency}
                  </span>
                  <span className="text-sm text-gray-500">
                    ≈ ${option.usdEquivalent.toFixed(2)}
                  </span>
                </div>

                {option.savings && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    You save ${option.savings.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      {selectedOption && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment details</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You'll pay</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {selectedOption.amount.toFixed(selectedOption.currency === 'SOL' ? 4 : 2)} {selectedOption.currency}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${selectedOption.usdEquivalent.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {selectedOption.savings && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount applied</span>
                  <span className="font-semibold">-${selectedOption.savings.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Network fees</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Processing fees</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onProceedToPayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-lg"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  Pay {selectedOption.amount.toFixed(selectedOption.currency === 'SOL' ? 4 : 2)} {selectedOption.currency}
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

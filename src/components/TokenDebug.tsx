import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SPL_TOKENS } from '@/lib/payment-utils';
import { DEFAULT_STORE_CONFIG, getPaymentOptions } from '@/lib/currency-utils';

export const TokenDebug = () => {
  const testAmount = 2; // $2 USD (affordable for testing)
  const paymentOptions = getPaymentOptions(testAmount, DEFAULT_STORE_CONFIG);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Token Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Available SPL Tokens:</h4>
          <div className="space-y-2">
            {Object.entries(SPL_TOKENS).map(([symbol, token]) => (
              <div key={symbol} className="flex items-center gap-3 p-2 border rounded">
                <img 
                  src={token.logo} 
                  alt={symbol}
                  className="w-6 h-6"
                  onError={(e) => {
                    console.log(`Logo failed for ${symbol}:`, token.logo);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">{symbol}</div>
                  <div className="text-sm text-gray-600">{token.name}</div>
                </div>
                <Badge variant="outline">{token.decimals} decimals</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Store Configuration:</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div>Accepted Currencies: {DEFAULT_STORE_CONFIG.acceptedCurrencies.join(', ')}</div>
            <div>Base Currency: {DEFAULT_STORE_CONFIG.baseCurrency}</div>
            <div>Preferred Currency: {DEFAULT_STORE_CONFIG.preferredCurrency}</div>
            <div>Conversion Enabled: {DEFAULT_STORE_CONFIG.conversionEnabled ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Payment Options for $2 USD (SOL + USDC only):</h4>
          <div className="space-y-2">
            {paymentOptions.length === 0 ? (
              <div className="text-red-600">No payment options generated!</div>
            ) : (
              paymentOptions.map((option) => (
                <div key={option.currency} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <img 
                      src={SPL_TOKENS[option.currency as keyof typeof SPL_TOKENS]?.logo} 
                      alt={option.currency}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">{option.currency}</span>
                    {option.isPreferred && <Badge variant="default" className="text-xs">Preferred</Badge>}
                    {option.discount && <Badge variant="secondary" className="text-xs">Discount</Badge>}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {option.amount.toFixed(option.currency === 'SOL' ? 4 : 2)} {option.currency}
                    </div>
                    <div className="text-xs text-gray-600">
                      ≈ ${option.usdEquivalent.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

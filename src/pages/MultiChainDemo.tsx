import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Settings, 
  Wallet,
  CreditCard,
  Globe,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';
import { MerchantPaymentConfig } from '@/components/MerchantPaymentConfig';
import { MultiChainCheckout } from '@/components/MultiChainCheckout';
import { 
  MultiChainStoreConfig, 
  DEFAULT_MULTICHAIN_CONFIG 
} from '@/lib/multi-chain-config';
import { MultiChainPaymentOption } from '@/lib/multi-chain-utils';

export const MultiChainDemo = () => {
  const [merchantConfig, setMerchantConfig] = useState<MultiChainStoreConfig>(DEFAULT_MULTICHAIN_CONFIG);
  const [selectedPayment, setSelectedPayment] = useState<MultiChainPaymentOption | null>(null);
  const [currentStep, setCurrentStep] = useState<'config' | 'customer' | 'payment'>('config');

  // Demo product
  const demoProduct = {
    name: 'Premium Wireless Headphones',
    price: 25, // $25 USD - affordable for testing
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    description: 'High-quality wireless headphones with noise cancellation'
  };

  const handlePaymentSelect = (option: MultiChainPaymentOption) => {
    setSelectedPayment(option);
  };

  const handleProceedToPayment = () => {
    console.log('Processing payment:', selectedPayment);
    // In real implementation, this would process the payment
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Multi-Chain Payment Demo</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                6 Blockchains
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                15+ Tokens
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                5+ Wallets
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <Settings className="h-4 w-4" />
              </div>
              <span className="font-medium">1. Merchant Setup</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className={`flex items-center gap-2 ${currentStep === 'customer' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="font-medium">2. Customer Shopping</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className={`flex items-center gap-2 ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="font-medium">3. Multi-Chain Payment</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)} className="space-y-6">

          {/* Step 1: Merchant Configuration */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Step 1: Merchant Configuration
                </CardTitle>
                <p className="text-gray-600">
                  As a merchant, configure which blockchains and tokens you want to accept. 
                  Set discounts to incentivize certain payment methods.
                </p>
              </CardHeader>
              <CardContent>
                <MerchantPaymentConfig 
                  onConfigChange={setMerchantConfig}
                  initialConfig={merchantConfig}
                />
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep('customer')}
                    className="flex items-center gap-2"
                  >
                    Continue to Customer View
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Customer Shopping */}
          <TabsContent value="customer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Product Display */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Step 2: Customer Shopping Experience
                    </CardTitle>
                    <p className="text-gray-600">
                      This is what your customers see when shopping on your store.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex gap-6">
                        <img 
                          src={demoProduct.image}
                          alt={demoProduct.name}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {demoProduct.name}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {demoProduct.description}
                          </p>
                          <div className="text-2xl font-bold text-blue-600 mb-4">
                            ${demoProduct.price} USD
                          </div>
                          <Button 
                            onClick={() => setCurrentStep('payment')}
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Buy Now - See Multi-Chain Options
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Configuration Preview */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Accepted Chains:</span>
                        <div className="mt-1">
                          {merchantConfig.acceptedChains.map(chain => (
                            <Badge key={chain} variant="outline" className="mr-1 mb-1 text-xs">
                              {chain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Accepted Tokens:</span>
                        <div className="mt-1">
                          {merchantConfig.acceptedTokens.map(token => (
                            <Badge key={token} variant="outline" className="mr-1 mb-1 text-xs">
                              {token}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Preferred:</span>
                        <div className="mt-1">
                          <Badge variant="default" className="text-xs">
                            {merchantConfig.preferredChain} / {merchantConfig.preferredToken}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Step 3: Multi-Chain Payment */}
          <TabsContent value="payment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Payment Interface */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Step 3: Multi-Chain Payment Options
                    </CardTitle>
                    <p className="text-gray-600">
                      This is the multi-chain checkout your customers see. 
                      They can pay with any supported blockchain and token.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <MultiChainCheckout
                      usdTotal={demoProduct.price}
                      onPaymentSelect={handlePaymentSelect}
                      onProceedToPayment={handleProceedToPayment}
                      isProcessing={false}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Payment Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">{demoProduct.name}</span>
                        <span className="text-sm font-medium">${demoProduct.price}</span>
                      </div>
                      
                      {selectedPayment && (
                        <>
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium mb-2">Selected Payment:</div>
                            <div className="flex items-center gap-2 mb-1">
                              <img 
                                src={selectedPayment.chainLogo} 
                                alt={selectedPayment.chainName}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{selectedPayment.chainName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <img 
                                src={selectedPayment.tokenLogo} 
                                alt={selectedPayment.token}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium">
                                {selectedPayment.amount.toFixed(4)} {selectedPayment.token}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${demoProduct.price}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Features */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Multi-Chain Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-green-500" />
                        <span>Secure blockchain payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-blue-500" />
                        <span>Fast transaction times</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-purple-500" />
                        <span>Global accessibility</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3 text-orange-500" />
                        <span>Multiple payment options</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Navigation */}
          <div className="mt-8 flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="config" className="text-xs">Merchant Setup</TabsTrigger>
              <TabsTrigger value="customer" className="text-xs">Customer View</TabsTrigger>
              <TabsTrigger value="payment" className="text-xs">Multi-Chain Pay</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Store, 
  User, 
  Mail, 
  Globe, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Wallet,
  CreditCard,
  MapPin,
  Phone,
  Building,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Enhanced merchant profile for hybrid payments
export interface HybridMerchantProfile {
  id: string;
  walletAddress: string;
  businessName: string;
  email?: string;
  website?: string;
  description?: string;
  
  // Business details
  businessType: string;
  country: string;
  city: string;
  address?: string;
  phone?: string;
  
  // Payment configuration
  cryptoWallet: string; // Solana wallet
  bankAccount?: string;
  bankName?: string;
  accountHolderName?: string;
  
  // Supported currencies and payment methods
  supportedCurrencies: string[];
  supportedCryptos: string[];
  supportedFiatMethods: string[];
  
  // Settings
  defaultCurrency: string;
  enableHybridPayments: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Country-specific payment methods
const PAYMENT_METHODS_BY_COUNTRY = {
  'NG': { // Nigeria
    name: 'Nigeria',
    currency: 'NGN',
    fiatMethods: ['Bank Transfer', 'USSD', 'Mobile Money', 'Card Payment'],
    popularBanks: ['GTBank', 'Access Bank', 'First Bank', 'UBA', 'Zenith Bank', 'Fidelity Bank']
  },
  'KE': { // Kenya
    name: 'Kenya',
    currency: 'KES',
    fiatMethods: ['M-Pesa', 'Bank Transfer', 'Airtel Money'],
    popularBanks: ['KCB', 'Equity Bank', 'Cooperative Bank', 'Standard Chartered']
  },
  'GH': { // Ghana
    name: 'Ghana',
    currency: 'GHS',
    fiatMethods: ['Mobile Money', 'Bank Transfer', 'MTN MoMo', 'AirtelTigo Money'],
    popularBanks: ['GCB Bank', 'Ecobank', 'Standard Chartered', 'Fidelity Bank']
  },
  'ZA': { // South Africa
    name: 'South Africa',
    currency: 'ZAR',
    fiatMethods: ['EFT', 'Instant EFT', 'SnapScan', 'Zapper'],
    popularBanks: ['Standard Bank', 'FNB', 'ABSA', 'Nedbank', 'Capitec']
  },
  'US': { // United States
    name: 'United States',
    currency: 'USD',
    fiatMethods: ['ACH Transfer', 'Wire Transfer', 'Zelle', 'Venmo', 'PayPal'],
    popularBanks: ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'US Bank']
  }
};

const BUSINESS_TYPES = [
  'Retail Store',
  'Restaurant/Cafe',
  'E-commerce',
  'Service Provider',
  'Freelancer',
  'Marketplace',
  'Subscription Business',
  'Non-profit',
  'Other'
];

const SUPPORTED_CRYPTOS = ['SOL', 'USDC', 'USDT'];

interface HybridMerchantAuthProps {
  onAuthSuccess: (merchant: HybridMerchantProfile) => void;
}

export const HybridMerchantAuth = ({ onAuthSuccess }: HybridMerchantAuthProps) => {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  
  const [currentMerchant, setCurrentMerchant] = useState<HybridMerchantProfile | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic info
    businessName: '',
    email: '',
    website: '',
    description: '',
    businessType: '',
    
    // Location
    country: '',
    city: '',
    address: '',
    phone: '',
    
    // Payment setup
    cryptoWallet: '',
    bankAccount: '',
    bankName: '',
    accountHolderName: '',
    
    // Configuration
    supportedCurrencies: [] as string[],
    supportedCryptos: ['SOL', 'USDC'] as string[],
    supportedFiatMethods: [] as string[],
    defaultCurrency: '',
    enableHybridPayments: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set crypto wallet when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      setFormData(prev => ({
        ...prev,
        cryptoWallet: publicKey.toString()
      }));
    }
  }, [connected, publicKey]);

  // Update supported currencies and methods when country changes
  useEffect(() => {
    if (formData.country && PAYMENT_METHODS_BY_COUNTRY[formData.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY]) {
      const countryData = PAYMENT_METHODS_BY_COUNTRY[formData.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY];
      setFormData(prev => ({
        ...prev,
        supportedCurrencies: [countryData.currency, 'USDC'],
        supportedFiatMethods: countryData.fiatMethods,
        defaultCurrency: countryData.currency
      }));
    }
  }, [formData.country]);

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (step === 2) {
      if (!formData.country) {
        newErrors.country = 'Country is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
    }

    if (step === 3) {
      if (!formData.cryptoWallet) {
        newErrors.cryptoWallet = 'Crypto wallet is required';
      }
      if (formData.enableHybridPayments && !formData.bankAccount.trim()) {
        newErrors.bankAccount = 'Bank account is required for hybrid payments';
      }
      if (formData.enableHybridPayments && !formData.accountHolderName.trim()) {
        newErrors.accountHolderName = 'Account holder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleRegister = async () => {
    if (!validateStep(3)) return;

    try {
      // Create hybrid merchant profile
      const merchant: HybridMerchantProfile = {
        id: `merchant_${Date.now()}`,
        walletAddress: formData.cryptoWallet,
        businessName: formData.businessName,
        email: formData.email || undefined,
        website: formData.website || undefined,
        description: formData.description || undefined,
        businessType: formData.businessType,
        country: formData.country,
        city: formData.city,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        cryptoWallet: formData.cryptoWallet,
        bankAccount: formData.bankAccount || undefined,
        bankName: formData.bankName || undefined,
        accountHolderName: formData.accountHolderName || undefined,
        supportedCurrencies: formData.supportedCurrencies,
        supportedCryptos: formData.supportedCryptos,
        supportedFiatMethods: formData.supportedFiatMethods,
        defaultCurrency: formData.defaultCurrency,
        enableHybridPayments: formData.enableHybridPayments,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to localStorage for demo (in production, save to Supabase)
      localStorage.setItem('hybrid_merchant_profile', JSON.stringify(merchant));
      
      setCurrentMerchant(merchant);
      setIsRegistering(false);
      onAuthSuccess(merchant);

      toast({
        title: "Registration Successful!",
        description: "Your hybrid payment merchant account has been created",
      });

    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register merchant account",
        variant: "destructive"
      });
    }
  };

  // Check for existing merchant
  useEffect(() => {
    const checkExistingMerchant = () => {
      try {
        const stored = localStorage.getItem('hybrid_merchant_profile');
        if (stored) {
          const merchant = JSON.parse(stored);
          if (merchant.walletAddress === publicKey?.toString()) {
            setCurrentMerchant(merchant);
            onAuthSuccess(merchant);
          }
        }
      } catch (error) {
        console.error('Error loading merchant profile:', error);
      }
    };

    if (connected && publicKey) {
      checkExistingMerchant();
    } else {
      setCurrentMerchant(null);
    }
  }, [connected, publicKey, onAuthSuccess]);

  // If merchant is authenticated, show profile
  if (currentMerchant) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>{currentMerchant.businessName}</CardTitle>
                <CardDescription>Hybrid Payment Merchant</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Business Type</Label>
              <p className="text-sm">{currentMerchant.businessType}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Location</Label>
              <p className="text-sm">{currentMerchant.city}, {PAYMENT_METHODS_BY_COUNTRY[currentMerchant.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY]?.name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Supported Currencies</Label>
              <div className="flex gap-1 mt-1">
                {currentMerchant.supportedCurrencies.map(currency => (
                  <Badge key={currency} variant="outline" className="text-xs">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Payment Methods</Label>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700">
                  Crypto
                </Badge>
                {currentMerchant.enableHybridPayments && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    Fiat
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Registered: {new Date(currentMerchant.createdAt).toLocaleDateString()}
            </div>
            <Button variant="outline" onClick={() => {
              localStorage.removeItem('hybrid_merchant_profile');
              setCurrentMerchant(null);
            }}>
              Switch Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If not connected, show wallet connection
  if (!connected) {
    return (
      <Card className="shadow-card">
        <CardHeader className="text-center">
          <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Hybrid Payment Setup</CardTitle>
          <CardDescription>
            Connect your wallet to set up hybrid crypto + fiat payments
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <WalletMultiButton className="!bg-gradient-to-r !from-teal-500 !to-green-500" />
        </CardContent>
      </Card>
    );
  }

  // Registration form
  return (
    <Card className="shadow-card max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Setup Hybrid Payment Merchant
        </CardTitle>
        <CardDescription>
          Step {currentStep} of 3: {
            currentStep === 1 ? 'Business Information' :
            currentStep === 2 ? 'Location & Contact' :
            'Payment Configuration'
          }
        </CardDescription>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div
            className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Business Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={`pl-10 ${errors.businessName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.businessName && (
                <p className="text-sm text-destructive">{errors.businessName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                <SelectTrigger className={errors.businessType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.businessType && (
                <p className="text-sm text-destructive">{errors.businessType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  placeholder="https://your-website.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your business"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: Payment Configuration */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cryptoWallet">Solana Wallet Address *</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cryptoWallet"
                  placeholder="Your Solana wallet address"
                  value={formData.cryptoWallet}
                  onChange={(e) => handleInputChange('cryptoWallet', e.target.value)}
                  className={`pl-10 font-mono text-sm ${errors.cryptoWallet ? 'border-destructive' : ''}`}
                  disabled
                />
              </div>
              {errors.cryptoWallet && (
                <p className="text-sm text-destructive">{errors.cryptoWallet}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This is your connected wallet address for receiving crypto payments
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableHybridPayments"
                  checked={formData.enableHybridPayments}
                  onCheckedChange={(checked) => handleInputChange('enableHybridPayments', checked as boolean)}
                />
                <Label htmlFor="enableHybridPayments" className="text-sm font-medium">
                  Enable Hybrid Payments (Crypto + Fiat)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Allow customers to pay with both cryptocurrency and traditional payment methods
              </p>
            </div>

            {formData.enableHybridPayments && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Traditional Payment Setup</h4>

                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="accountHolderName"
                        placeholder="Full name on bank account"
                        value={formData.accountHolderName}
                        onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                        className={`pl-10 ${errors.accountHolderName ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.accountHolderName && (
                      <p className="text-sm text-destructive">{errors.accountHolderName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Bank Account Number *</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="bankAccount"
                        placeholder="Your bank account number"
                        value={formData.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                        className={`pl-10 ${errors.bankAccount ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.bankAccount && (
                      <p className="text-sm text-destructive">{errors.bankAccount}</p>
                    )}
                  </div>

                  {formData.country && PAYMENT_METHODS_BY_COUNTRY[formData.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY] && (
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS_BY_COUNTRY[formData.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY].popularBanks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Supported Cryptocurrencies</h4>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_CRYPTOS.map(crypto => (
                  <div key={crypto} className="flex items-center space-x-2">
                    <Checkbox
                      id={`crypto-${crypto}`}
                      checked={formData.supportedCryptos.includes(crypto)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange('supportedCryptos', [...formData.supportedCryptos, crypto]);
                        } else {
                          handleInputChange('supportedCryptos', formData.supportedCryptos.filter(c => c !== crypto));
                        }
                      }}
                    />
                    <Label htmlFor={`crypto-${crypto}`} className="text-sm">
                      {crypto}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {formData.country && (
              <div className="p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border border-teal-200">
                <h4 className="font-medium text-sm mb-2 text-teal-800">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Currency:</span>
                    <span className="font-medium">{formData.defaultCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crypto Support:</span>
                    <span className="font-medium">{formData.supportedCryptos.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hybrid Payments:</span>
                    <span className="font-medium">{formData.enableHybridPayments ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location & Contact */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS_BY_COUNTRY).map(([code, data]) => (
                    <SelectItem key={code} value={code}>{data.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`pl-10 ${errors.city ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address (Optional)</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Enter your business address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {formData.country && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Available Payment Methods in {PAYMENT_METHODS_BY_COUNTRY[formData.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY]?.name}:</h4>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS_BY_COUNTRY[formData.country as keyof typeof PAYMENT_METHODS_BY_COUNTRY]?.fiatMethods.map(method => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700">
                    SOL/USDC
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleRegister} className="bg-gradient-to-r from-teal-500 to-green-500">
              Complete Setup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
import { 
  Store, 
  User, 
  Mail, 
  Globe, 
  FileText, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getCurrentMerchant,
  authenticateMerchant,
  registerMerchant,
  clearCurrentMerchant,
  validateBusinessName,
  validateEmail,
  validateWebsite,
  MerchantProfile
} from '@/lib/merchant-auth';

interface MerchantAuthProps {
  onAuthSuccess: (merchant: MerchantProfile) => void;
}

export const MerchantAuth = ({ onAuthSuccess }: MerchantAuthProps) => {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  
  const [currentMerchant, setCurrentMerchant] = useState<MerchantProfile | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    website: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for existing merchant on wallet connection
  useEffect(() => {
    try {
      if (connected && publicKey) {
        const merchant = authenticateMerchant(publicKey);
        if (merchant) {
          setCurrentMerchant(merchant);
          onAuthSuccess(merchant);
        } else {
          // Check if there's a stored current merchant
          const storedMerchant = getCurrentMerchant();
          if (storedMerchant) {
            // Handle case where walletAddress might be a string
            const walletMatches = typeof storedMerchant.walletAddress === 'string'
              ? storedMerchant.walletAddress === publicKey.toString()
              : storedMerchant.walletAddress.equals(publicKey);

            if (walletMatches) {
              setCurrentMerchant(storedMerchant);
              onAuthSuccess(storedMerchant);
            }
          }
        }
      } else {
        setCurrentMerchant(null);
        clearCurrentMerchant();
      }
    } catch (error) {
      console.error('Error in merchant authentication:', error);
      setCurrentMerchant(null);
      clearCurrentMerchant();
    }
  }, [connected, publicKey, onAuthSuccess]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const businessNameValidation = validateBusinessName(formData.businessName);
    if (!businessNameValidation.isValid) {
      newErrors.businessName = businessNameValidation.error!;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!;
    }

    const websiteValidation = validateWebsite(formData.website);
    if (!websiteValidation.isValid) {
      newErrors.website = websiteValidation.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const merchant = registerMerchant({
        walletAddress: publicKey,
        businessName: formData.businessName,
        email: formData.email || undefined,
        website: formData.website || undefined,
        description: formData.description || undefined
      });

      setCurrentMerchant(merchant);
      setIsRegistering(false);
      onAuthSuccess(merchant);

      toast({
        title: "Registration Successful!",
        description: "Your merchant account has been created",
      });

    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register merchant account",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    clearCurrentMerchant();
    setCurrentMerchant(null);
    setIsRegistering(false);
    setFormData({
      businessName: '',
      email: '',
      website: '',
      description: ''
    });
  };

  // If merchant is authenticated, show profile
  if (currentMerchant) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-solana rounded-full flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>{currentMerchant.businessName}</CardTitle>
                <CardDescription>Merchant Account</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-accent">
              <CheckCircle className="h-3 w-3 mr-1" />
              Authenticated
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Merchant ID</Label>
              <p className="font-mono text-sm">{currentMerchant.id}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Wallet Address</Label>
              <p className="font-mono text-sm">{currentMerchant.walletAddress.toString().slice(0, 8)}...</p>
            </div>
            {currentMerchant.email && (
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm">{currentMerchant.email}</p>
              </div>
            )}
            {currentMerchant.website && (
              <div>
                <Label className="text-sm text-muted-foreground">Website</Label>
                <p className="text-sm">{currentMerchant.website}</p>
              </div>
            )}
          </div>

          {currentMerchant.description && (
            <div>
              <Label className="text-sm text-muted-foreground">Description</Label>
              <p className="text-sm">{currentMerchant.description}</p>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Registered: {currentMerchant.createdAt.toLocaleDateString()}
            </div>
            <Button variant="outline" onClick={handleLogout}>
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
          <CardTitle>Merchant Authentication</CardTitle>
          <CardDescription>
            Connect your wallet to access your merchant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <WalletMultiButton className="!bg-gradient-solana !hover:shadow-glow" />
        </CardContent>
      </Card>
    );
  }

  // If connected but not registered, show registration form
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {isRegistering ? 'Register Merchant Account' : 'Welcome to SolPay'}
        </CardTitle>
        <CardDescription>
          {isRegistering 
            ? 'Create your merchant profile to start accepting payments'
            : 'No merchant account found for this wallet'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isRegistering ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm text-muted-foreground">
                This wallet is not registered as a merchant. Would you like to create a merchant account?
              </p>
            </div>
            <Button 
              onClick={() => setIsRegistering(true)}
              variant="solana"
              size="lg"
              className="w-full"
            >
              Create Merchant Account
            </Button>
          </div>
        ) : (
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
                  className={`pl-10 ${errors.website ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="description"
                  placeholder="Brief description of your business"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsRegistering(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRegister}
                variant="solana"
                className="flex-1"
              >
                Register
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

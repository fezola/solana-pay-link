import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Wallet, Shield, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { MerchantService } from '@/lib/supabase-service';

export const AccountRecovery = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundMerchant, setFoundMerchant] = useState<any>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [step, setStep] = useState<'search' | 'found' | 'recovered'>('search');

  const searchByEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const merchant = await MerchantService.findMerchantByEmail(email);
      
      if (merchant) {
        setFoundMerchant(merchant);
        setStep('found');
        toast({
          title: "Account Found!",
          description: `Found business account: ${merchant.business_name}`,
        });
      } else {
        toast({
          title: "Account Not Found",
          description: "No business account found with this email address",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching for account:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search for account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const recoverAccount = async () => {
    if (!connected || !publicKey || !foundMerchant) {
      toast({
        title: "Error",
        description: "Please connect your new wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsRecovering(true);
    try {
      await MerchantService.addWalletToMerchant(foundMerchant.id, publicKey.toString());
      
      setStep('recovered');
      toast({
        title: "Account Recovered!",
        description: "Your new wallet has been linked to your business account",
      });
    } catch (error: any) {
      console.error('Error recovering account:', error);
      toast({
        title: "Recovery Failed",
        description: error.message || "Unable to recover account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Recovery</h1>
            <p className="text-muted-foreground">
              Recover access to your business account using your registered email
            </p>
          </div>

          {step === 'search' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Find Your Account
                </CardTitle>
                <CardDescription>
                  Enter the email address you used when registering your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchByEmail()}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will search for your business account using the email address you provided during registration.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={searchByEmail}
                  disabled={isSearching || !email.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Find My Account
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'found' && foundMerchant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Account Found
                </CardTitle>
                <CardDescription>
                  We found your business account. Connect your new wallet to recover access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Business Account Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Business Name:</span> {foundMerchant.business_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {foundMerchant.email}</p>
                    <p><span className="text-muted-foreground">Registered:</span> {new Date(foundMerchant.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Recovery Steps:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <span>Account found ✓</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        connected ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>2</div>
                      <span>Connect your new wallet {connected ? '✓' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold">3</div>
                      <span>Link wallet to account</span>
                    </div>
                  </div>
                </div>

                {!connected ? (
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                      Please connect your new wallet using the wallet button in the top right corner.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Wallet connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-6)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setStep('search');
                      setFoundMerchant(null);
                      setEmail('');
                    }}
                    className="flex-1"
                  >
                    Search Again
                  </Button>
                  <Button 
                    onClick={recoverAccount}
                    disabled={isRecovering || !connected}
                    className="flex-1"
                  >
                    {isRecovering ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Recovering...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Recover Account
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'recovered' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Account Recovered Successfully!
                </CardTitle>
                <CardDescription>
                  Your new wallet has been linked to your business account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You now have full access to your business account, payment links, and client data.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">What's Next?</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Access your merchant dashboard</li>
                    <li>• View all your existing payment links</li>
                    <li>• Monitor your transactions and clients</li>
                    <li>• Create new payment links</li>
                  </ul>
                </div>

                <Button 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  size="lg"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-medium text-foreground mb-1">Security Notice</h4>
                  <p className="text-muted-foreground">
                    Account recovery links your new wallet to your existing business data. 
                    Your payment links and client information remain secure and unchanged.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

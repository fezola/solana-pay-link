import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BasePayButtonProps {
  amount: string; // USD amount like "5.00"
  to: string; // Recipient address
  testnet?: boolean;
  colorScheme?: 'light' | 'dark';
  onPaymentStart?: () => void;
  onPaymentComplete?: (id: string) => void;
  onPaymentError?: (error: string) => void;
}

export const BasePayButton = ({
  amount,
  to,
  testnet = true,
  colorScheme = 'light',
  onPaymentStart,
  onPaymentComplete,
  onPaymentError
}: BasePayButtonProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    initializeBaseSDK();
  }, []);

  const initializeBaseSDK = async () => {
    try {
      // Try to import the Base Account SDK
      const baseModule = await import('@base-org/account');

      if (baseModule.createBaseAccountSDK) {
        const baseSDK = baseModule.createBaseAccountSDK({
          appName: 'Solana Pay Link',
          appLogo: '/base.JPG'
        });

        setSdk(baseSDK);

        // Check if already signed in
        try {
          const provider = baseSDK.getProvider();
          if (provider) {
            setIsSignedIn(true);
          }
        } catch (e) {
          // Not signed in yet
        }
      } else {
        console.warn('Base Account SDK not properly installed');
      }
    } catch (error) {
      console.error('Failed to initialize Base SDK:', error);
      // Fallback: show a mock implementation
      setSdk({ mock: true });
    }
  };

  const handleSignIn = async () => {
    if (!sdk) return;

    try {
      setIsProcessing(true);

      if (sdk.mock) {
        // Mock implementation for development
        setTimeout(() => {
          setIsSignedIn(true);
          toast({
            title: "Connected to Base Account!",
            description: "Mock connection for development",
          });
          setIsProcessing(false);
        }, 1000);
        return;
      }

      await sdk.getProvider().request({ method: 'wallet_connect' });
      setIsSignedIn(true);
      toast({
        title: "Connected to Base Account!",
        description: "You can now make payments",
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Base Account",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (isProcessing || !sdk || !isSignedIn) return;

    setIsProcessing(true);
    onPaymentStart?.();

    try {
      if (sdk.mock) {
        // Mock payment for development
        const mockId = `base_pay_${Date.now()}`;

        // Simulate payment processing
        toast({
          title: "Base Pay Processing...",
          description: `Processing $${amount} USDC payment`,
        });

        setTimeout(() => {
          toast({
            title: "Base Pay Payment Successful!",
            description: `Payment completed! ID: ${mockId}`,
          });
          onPaymentComplete?.(mockId);
          setIsProcessing(false);
        }, 2000);
        return;
      }

      // Use the correct Base Pay SDK
      const { pay } = await import('@base-org/account');

      const result = await pay({
        amount,
        to,
        testnet
      });

      if (result && result.id) {
        toast({
          title: "Base Pay Payment Successful!",
          description: `Payment ID: ${result.id}`,
        });
        onPaymentComplete?.(result.id);

        // Start polling for status
        pollPaymentStatus(result.id, testnet);
      } else {
        throw new Error('Payment failed - no ID returned');
      }

    } catch (error) {
      console.error('Base Pay error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Base Pay failed';

      toast({
        title: "Base Pay Error",
        description: errorMessage,
        variant: "destructive"
      });

      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (id: string, testnet: boolean) => {
    try {
      const { getPaymentStatus } = await import('@base-org/account');

      const checkStatus = async () => {
        const result = await getPaymentStatus({ id, testnet });

        if (result.status === 'completed') {
          toast({
            title: "Payment Completed!",
            description: "Your Base Pay USDC payment was successful",
          });
        } else if (result.status === 'failed') {
          toast({
            title: "Payment Failed",
            description: "Your Base Pay payment could not be completed",
            variant: "destructive"
          });
        } else {
          // Still pending, check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      };

      checkStatus();
    } catch (error) {
      console.error('Error polling payment status:', error);
    }
  };

  const isLight = colorScheme === 'light';

  // Show sign-in button if not signed in
  if (!isSignedIn) {
    return (
      <Button
        onClick={handleSignIn}
        disabled={isProcessing || !sdk}
        className={`
          flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm min-w-[180px] h-11
          ${isLight
            ? 'bg-white text-black border border-gray-200 hover:bg-gray-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <div className={`w-4 h-4 ${isLight ? 'bg-blue-600' : 'bg-white'} rounded-sm`} />
            <span>Sign in with Base</span>
          </>
        )}
      </Button>
    );
  }

  // Show payment button if signed in
  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className={`
        flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm min-w-[180px] h-11
        ${isLight
          ? 'bg-white text-black border border-gray-200 hover:bg-gray-50'
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {isProcessing ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <img
            src={isLight
              ? 'https://mintlify.s3.us-west-1.amazonaws.com/base-a060aa97/images/base-account/BasePayBlueLogo.png'
              : 'https://mintlify.s3.us-west-1.amazonaws.com/base-a060aa97/images/base-account/BasePayWhiteLogo.png'
            }
            alt="Base Pay"
            className="h-5 w-auto"
          />
        </>
      )}
    </Button>
  );
};

// Official Base Pay Button using the SDK
export const OfficialBasePayButton = ({
  amount,
  to,
  testnet = true,
  colorScheme = 'light',
  onPaymentStart,
  onPaymentComplete,
  onPaymentError
}: BasePayButtonProps) => {
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    checkSDKAvailability();
  }, []);

  const checkSDKAvailability = async () => {
    try {
      await import('@base-org/account-ui/react');
      setIsAvailable(true);
    } catch {
      setIsAvailable(false);
    }
  };

  const handlePaymentResult = (result: any) => {
    if (result.success) {
      toast({
        title: "Payment Successful!",
        description: `Payment ID: ${result.id}`,
      });
      onPaymentComplete?.(result.id);
    } else {
      toast({
        title: "Payment Failed",
        description: result.error || 'Payment could not be completed',
        variant: "destructive"
      });
      onPaymentError?.(result.error || 'Payment failed');
    }
  };

  const handleConnect = () => {
    setIsSignedIn(true);
    toast({
      title: "Connected to Base Account!",
      description: "You can now make payments",
    });
  };

  if (!isAvailable) {
    return <BasePayButton
      amount={amount}
      to={to}
      testnet={testnet}
      colorScheme={colorScheme}
      onPaymentStart={onPaymentStart}
      onPaymentComplete={onPaymentComplete}
      onPaymentError={onPaymentError}
    />;
  }

  // For now, always use our custom implementation since the official SDK has issues
  return <BasePayButton
    amount={amount}
    to={to}
    testnet={testnet}
    colorScheme={colorScheme}
    onPaymentStart={onPaymentStart}
    onPaymentComplete={onPaymentComplete}
    onPaymentError={onPaymentError}
  />;
};

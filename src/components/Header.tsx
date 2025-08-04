import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Zap, LifeBuoy } from 'lucide-react';

export const Header = () => {
  const { connected } = useWallet();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo - Left Side */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <h1 className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
              Klyr
            </h1>
          </Link>
        </div>

        {/* Centered Navigation */}
        <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
          {!isLandingPage && (
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Home
            </Link>
          )}
          <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/payment-links" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Payment Links
          </Link>
          <Link to="/transactions" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Transactions
          </Link>
          <Link to="/pos" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            POS
          </Link>
          <Link to="/integration" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Integration
          </Link>
        </nav>

        {/* Right Side - Wallet & Actions */}
        <div className="flex items-center gap-4">



          {!connected && (
            <Link to="/recover">
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-orange-500/20 text-orange-500 hover:bg-orange-500/10 rounded-xl">
                <LifeBuoy className="w-4 h-4" />
                Recover
              </Button>
            </Link>
          )}

          <WalletMultiButton
            className="!bg-gradient-solana !hover:shadow-glow !transition-all !duration-300 !rounded-xl"
          >
            {connected ? 'Connected' : 'Connect'}
          </WalletMultiButton>
        </div>
      </div>
    </header>
  );
};
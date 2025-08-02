import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Wallet, Zap, Coffee, ExternalLink, ShoppingBag } from 'lucide-react';

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-solana p-2 rounded-lg shadow-glow">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-solana bg-clip-text text-transparent">
              SolPay
            </h1>
            <p className="text-xs text-muted-foreground">Decentralized Payments</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/payment-links" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Payment Links
            </Link>
            <Link to="/transactions" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Transactions
            </Link>
            <Link to="/integration" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Integration
            </Link>
          </nav>

          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/coffee', '_blank')}
            >
              <Coffee className="h-4 w-4 mr-2" />
              Coffee Demo
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/shop', '_blank')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Shop Demo
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <WalletMultiButton className="!bg-gradient-solana !hover:shadow-glow !transition-all !duration-300" />
        </div>
      </div>
    </header>
  );
};
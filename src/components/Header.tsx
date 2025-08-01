import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, Zap } from 'lucide-react';

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
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Dashboard
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Payment Links
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Transactions
            </a>
          </nav>
          
          <WalletMultiButton className="!bg-gradient-solana !hover:shadow-glow !transition-all !duration-300" />
        </div>
      </div>
    </header>
  );
};
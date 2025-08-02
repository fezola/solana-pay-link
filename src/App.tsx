import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletContextProvider } from "@/contexts/WalletContextProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Checkout } from "./pages/Checkout";
import { BuyMeCoffee } from "./pages/BuyMeCoffee";
import { EcommerceDemo } from "./pages/EcommerceDemo";
import { MultiChainDemo } from "./pages/MultiChainDemo";
import { PaymentLinks } from "./pages/PaymentLinks";
import { Transactions } from "./pages/Transactions";
import { MerchantIntegration } from "./pages/MerchantIntegration";
import { MerchantDashboard } from "./pages/MerchantDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MerchantDashboard />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-links" element={<PaymentLinks />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/integration" element={<MerchantIntegration />} />
              {/* Demo routes - hidden from main navigation */}
              <Route path="/coffee" element={<BuyMeCoffee />} />
              <Route path="/shop" element={<EcommerceDemo />} />
              <Route path="/multichain" element={<MultiChainDemo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletContextProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

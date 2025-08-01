import { Header } from '@/components/Header';
import { MerchantDashboard } from '@/components/MerchantDashboard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MerchantDashboard />
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import {
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Wallet,
  QrCode,
  Link as LinkIcon,
  Store
} from 'lucide-react';

const SUPPORTED_NETWORKS = [
  { name: 'Solana', logo: '/solana-sol-logo.png', color: 'bg-teal-500', symbol: 'SOL' },
  { name: 'Ethereum', logo: '/ethereum-eth-logo.png', color: 'bg-gray-700', symbol: 'ETH' },
  { name: 'Base', logo: '/base.JPG', color: 'bg-blue-500', symbol: 'BASE' },
  { name: 'Polygon', logo: '/polygon-matic-logo.png', color: 'bg-purple-500', symbol: 'MATIC' },
  { name: 'Arbitrum', logo: '/arbitrum-arb-logo.png', color: 'bg-blue-600', symbol: 'ARB' },
  { name: 'Avalanche', logo: '/avalanche-avax-logo.png', color: 'bg-red-500', symbol: 'AVAX' },
  { name: 'BNB Chain', logo: '/bnb-bnb-logo.png', color: 'bg-yellow-500', symbol: 'BNB' },
];

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Payments",
    description: "Accept crypto payments in seconds with real-time settlement"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Trustless",
    description: "Non-custodial payments with blockchain-level security"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Multi-Chain Support",
    description: "Accept payments across multiple blockchain networks"
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    title: "QR Code Payments",
    description: "Generate scannable QR codes for easy mobile payments"
  },
  {
    icon: <LinkIcon className="w-6 h-6" />,
    title: "Payment Links",
    description: "Share payment links via email, SMS, or social media"
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Analytics Dashboard",
    description: "Track payments, revenue, and customer insights"
  }
];

const STATS = [
  { label: "Networks Supported", value: "7+", icon: <Globe className="w-5 h-5" /> },
  { label: "Zero Setup Fees", value: "$0", icon: <DollarSign className="w-5 h-5" /> },
  { label: "Settlement Time", value: "<5s", icon: <Clock className="w-5 h-5" /> },
  { label: "Active Merchants", value: "1K+", icon: <Users className="w-5 h-5" /> }
];

const CUSTOMER_EXPECTATIONS = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast Payments",
    description: "Receive payments in under 5 seconds with instant blockchain confirmation"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Bank-Level Security",
    description: "Your funds are secured by blockchain technology - no intermediaries, no risks"
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Transparent Pricing",
    description: "No hidden fees, no setup costs. Only pay minimal network fees when you receive payments"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Accessibility",
    description: "Accept payments from anywhere in the world, 24/7, without geographical restrictions"
  }
];

const SERVICES = [
  {
    icon: <QrCode className="w-8 h-8" />,
    title: "QR Code Payments",
    description: "Generate scannable QR codes for in-person payments",
    features: ["Mobile-optimized", "Instant generation", "Custom amounts"]
  },
  {
    icon: <LinkIcon className="w-8 h-8" />,
    title: "Payment Links",
    description: "Share payment links via email, SMS, or social media",
    features: ["Shareable URLs", "Custom expiry", "Real-time tracking"]
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Analytics Dashboard",
    description: "Track your revenue, customers, and payment patterns",
    features: ["Revenue insights", "Customer analytics", "Export reports"]
  },
  {
    icon: <Wallet className="w-8 h-8" />,
    title: "Multi-Wallet Support",
    description: "Accept payments from any crypto wallet",
    features: ["Universal compatibility", "Auto-detection", "Seamless UX"]
  },
  {
    icon: <Store className="w-8 h-8" />,
    title: "Point of Sale (POS)",
    description: "Accept in-person payments at your physical store",
    features: ["QR code generation", "Custom amounts", "Instant settlement"]
  }
];

export const LandingPage = () => {
  const [currentNetworkIndex, setCurrentNetworkIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-rotate network logos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNetworkIndex((prev) => (prev + 1) % SUPPORTED_NETWORKS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        {/* Floating animation elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-teal-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-green-500/10 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-blue-500/10 rounded-full animate-ping delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <Badge className="mb-6 bg-teal-500/10 text-teal-500 border-teal-500/20 animate-fade-in">
              ✨ Multi-Chain Payment Platform
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Accept Crypto
              <span className="bg-gradient-solana bg-clip-text text-transparent block">
                Payments Instantly
              </span>
            </h1>

            {/* Powered by Solana */}
            <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in delay-500">
              <span className="text-sm text-muted-foreground">Powered by</span>
              <img src="/solana-sol-logo.png" alt="Solana" className="w-5 h-5" />
              <span className="text-sm font-semibold bg-gradient-solana bg-clip-text text-transparent">Solana</span>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create payment links, generate QR codes, and accept cryptocurrency payments 
              across multiple blockchain networks with zero setup fees.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/dashboard">
                <Button size="xl" className="bg-gradient-solana hover:shadow-glow">
                  Start Accepting Payments
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/pos-demo">
                <Button variant="outline" size="xl">
                  Try POS Demo
                </Button>
              </Link>
            </div>

            {/* Enhanced Network Ticker */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8 animate-fade-in delay-700">
              <span>Supported on:</span>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {SUPPORTED_NETWORKS.map((network, index) => (
                  <div
                    key={network.name}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-700 transform hover:scale-105 cursor-pointer ${
                      index === currentNetworkIndex
                        ? 'bg-teal-500/10 text-teal-500 scale-110 shadow-lg border border-teal-500/20'
                        : 'opacity-60 hover:opacity-100 hover:bg-muted/50'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: index === currentNetworkIndex ? 'pulse 2s infinite' : 'none'
                    }}
                  >
                    <img src={network.logo} alt={network.name} className="w-5 h-5" />
                    <span className="font-medium">{network.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div
                key={index}
                className="text-center group hover:-translate-y-2 transition-all duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500 group-hover:bg-teal-500/20 group-hover:scale-110 transition-all duration-300">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 group-hover:text-teal-500 transition-colors duration-300">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to accept
              <span className="bg-gradient-solana bg-clip-text text-transparent"> crypto payments</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for businesses of all sizes, from freelancers to enterprises
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-2 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500 w-fit mb-4 group-hover:bg-teal-500/20 transition-all duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl group-hover:text-teal-500 transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Our Customers Should Expect */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              What Our Customers
              <span className="bg-gradient-solana bg-clip-text text-transparent"> Should Expect</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to delivering an exceptional payment experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {CUSTOMER_EXPECTATIONS.map((expectation, index) => (
              <div
                key={index}
                className="flex gap-4 p-6 bg-background rounded-xl border border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500 group-hover:bg-teal-500/20 transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                  {expectation.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-500 transition-colors duration-300">
                    {expectation.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {expectation.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Our
              <span className="bg-gradient-solana bg-clip-text text-transparent"> Services</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive payment solutions for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {SERVICES.map((service, index) => (
              <Card
                key={index}
                className="p-6 border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-2 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500 group-hover:bg-teal-500/20 transition-all duration-300 group-hover:scale-110">
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-500 transition-colors duration-300">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-1">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-teal-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hear from the Founder */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Hear from the
              <span className="bg-gradient-solana bg-clip-text text-transparent"> Founder</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-solana rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <blockquote className="text-xl md:text-2xl text-foreground mb-6 italic leading-relaxed">
                  "We built Klyr because we believe the future of payments should be instant, secure, and accessible to everyone.
                  Traditional payment systems are slow, expensive, and exclude billions of people worldwide.
                  With blockchain technology, we can create a payment infrastructure that works for everyone -
                  from freelancers in developing countries to enterprises in major cities.
                  Our mission is to make crypto payments as simple as sending a text message."
                </blockquote>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Founder & CEO, Klyr
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How Klyr Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-solana rounded-xl flex items-center justify-center mx-auto mb-6 animate-float group-hover:animate-glow transition-all duration-300 hover:scale-110">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-500 transition-colors duration-300">1. Connect Wallet</h3>
              <p className="text-muted-foreground">
                Connect your crypto wallet to get started. No lengthy registration process.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-solana rounded-xl flex items-center justify-center mx-auto mb-6 animate-float delay-500 group-hover:animate-glow transition-all duration-300 hover:scale-110">
                <LinkIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-500 transition-colors duration-300">2. Create Payment Link</h3>
              <p className="text-muted-foreground">
                Generate payment links or QR codes in seconds. Set amount, description, and expiry.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-solana rounded-xl flex items-center justify-center mx-auto mb-6 animate-float delay-1000 group-hover:animate-glow transition-all duration-300 hover:scale-110">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-500 transition-colors duration-300">3. Get Paid</h3>
              <p className="text-muted-foreground">
                Share the link and receive instant payments. Track everything in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Ready to start accepting
              <span className="bg-gradient-solana bg-clip-text text-transparent"> crypto payments?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses already using Klyr to accept cryptocurrency payments
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="xl" className="bg-gradient-solana hover:shadow-glow">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/pos-demo">
                <Button variant="outline" size="xl">
                  Try POS Demo
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Instant settlement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Multi-chain support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

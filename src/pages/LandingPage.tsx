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
  Store,
  Play,
  Award,
  Target,
  Sparkles,
  Timer,
  CreditCard,
  Smartphone,
  BarChart3,
  Lock,
  Rocket,
  Heart,
  Eye,
  MessageCircle,
  ThumbsUp,
  AlertCircle,
  Gift
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

// Social proof data
const SOCIAL_PROOF = {
  totalUsers: "12,847",
  totalTransactions: "$2.4M",
  averageRating: "4.9",
  reviewCount: "1,247"
};

// Urgency and scarcity elements
const LIMITED_TIME_OFFER = {
  isActive: true,
  title: "🔥 Early Adopter Bonus",
  description: "First 1,000 merchants get premium features FREE for 6 months",
  spotsLeft: 127,
  expiresIn: "2 days"
};

// Trust indicators
const TRUST_INDICATORS = [
  { icon: <Shield className="w-5 h-5" />, text: "Bank-level security" },
  { icon: <Award className="w-5 h-5" />, text: "SOC 2 compliant" },
  { icon: <Lock className="w-5 h-5" />, text: "Non-custodial" },
  { icon: <Zap className="w-5 h-5" />, text: "99.9% uptime" }
];

// Customer testimonials
const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "E-commerce Owner",
    avatar: "SC",
    rating: 5,
    text: "Klyr transformed my online store. I'm now accepting crypto payments from customers worldwide with zero hassle. Revenue increased 40% in just 2 months!",
    revenue: "+40% revenue"
  },
  {
    name: "Marcus Rodriguez",
    role: "Freelance Designer",
    avatar: "MR",
    rating: 5,
    text: "As a freelancer working with international clients, Klyr solved my payment headaches. No more waiting weeks for bank transfers. Instant payments, every time.",
    benefit: "Instant payments"
  },
  {
    name: "Lisa Thompson",
    role: "Coffee Shop Owner",
    avatar: "LT",
    rating: 5,
    text: "Our customers love paying with crypto! The QR code system is so simple. We've processed over $50k in crypto payments this quarter alone.",
    volume: "$50k processed"
  }
];

// Pain points and solutions
const PAIN_POINTS = [
  {
    pain: "Traditional payment processors take 3-5 business days",
    solution: "Get paid instantly with crypto - funds available in seconds",
    icon: <Timer className="w-6 h-6" />,
    color: "text-red-500"
  },
  {
    pain: "High fees eating into your profits (3-5% + fixed fees)",
    solution: "Pay only minimal network fees (typically under $0.50)",
    icon: <DollarSign className="w-6 h-6" />,
    color: "text-green-500"
  },
  {
    pain: "Complex setup and lengthy approval processes",
    solution: "Start accepting payments in under 2 minutes",
    icon: <Rocket className="w-6 h-6" />,
    color: "text-blue-500"
  },
  {
    pain: "Limited to local customers due to payment restrictions",
    solution: "Accept payments from anywhere in the world, 24/7",
    icon: <Globe className="w-6 h-6" />,
    color: "text-purple-500"
  }
];

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast Settlements",
    description: "Get paid in seconds, not days. No more waiting for bank transfers.",
    benefit: "Save 3-5 days per transaction"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Military-Grade Security",
    description: "Your funds are protected by blockchain technology. No intermediaries, no risks.",
    benefit: "100% secure & non-custodial"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Reach",
    description: "Accept payments from customers worldwide without geographical restrictions.",
    benefit: "Expand to 195+ countries"
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile-First Design",
    description: "Perfect for on-the-go payments. QR codes work with any smartphone.",
    benefit: "80% of payments via mobile"
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Real-Time Analytics",
    description: "Track every payment, customer, and revenue stream in real-time.",
    benefit: "Make data-driven decisions"
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Multi-Token Support",
    description: "Accept SOL, USDC, ETH, and 50+ other cryptocurrencies.",
    benefit: "Maximize payment options"
  }
];

const STATS = [
  {
    label: "Happy Merchants",
    value: SOCIAL_PROOF.totalUsers,
    icon: <Users className="w-5 h-5" />,
    description: "Businesses trust us"
  },
  {
    label: "Processed Volume",
    value: SOCIAL_PROOF.totalTransactions,
    icon: <DollarSign className="w-5 h-5" />,
    description: "In crypto payments"
  },
  {
    label: "Average Rating",
    value: SOCIAL_PROOF.averageRating + "/5",
    icon: <Star className="w-5 h-5" />,
    description: "From verified users"
  },
  {
    label: "Settlement Time",
    value: "<5s",
    icon: <Clock className="w-5 h-5" />,
    description: "Lightning fast"
  }
];



export const LandingPage = () => {
  const [currentNetworkIndex, setCurrentNetworkIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 23, seconds: 45 });
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  // Auto-rotate network logos with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNetworkIndex((prev) => (prev + 1) % SUPPORTED_NETWORKS.length);
    }, 3000); // Slower for better visibility
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for urgency
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tracking for interactive elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Observe all sections
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Trigger initial animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Limited Time Offer Banner - Simplified */}
      {LIMITED_TIME_OFFER.isActive && (
        <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-3 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Early Adopter Bonus: Premium features FREE for 6 months</span>
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              {LIMITED_TIME_OFFER.spotsLeft} spots left
            </Badge>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Custom Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/background.png)',
          }}
        ></div>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        {/* Dynamic floating elements with mouse interaction */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-teal-500/20 to-green-500/20 rounded-full animate-float"
            style={{
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          ></div>
          <div
            className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-float"
            style={{
              transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`,
              transition: 'transform 0.3s ease-out',
              animationDelay: '1s'
            }}
          ></div>
          <div
            className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full animate-float"
            style={{
              transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.01}px)`,
              transition: 'transform 0.3s ease-out',
              animationDelay: '2s'
            }}
          ></div>
          <div
            className="absolute top-1/2 right-10 w-8 h-8 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full animate-float"
            style={{
              transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
              transition: 'transform 0.3s ease-out',
              animationDelay: '0.5s'
            }}
          ></div>

          {/* Animated particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-teal-500/30 rounded-full animate-ping"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 12}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            ></div>
          ))}
        </div>

        {/* Parallax background elements */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-teal-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-5xl mx-auto">

            {/* Social Proof Badge - Animated entrance */}
            <div className={`flex items-center justify-center gap-2 mb-6 transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
            }`}>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-4 py-2 hover:scale-105 transition-transform duration-300 cursor-default">
                <Eye className="w-4 h-4 mr-2 animate-pulse" />
                {SOCIAL_PROOF.totalUsers}+ merchants already earning
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-4 py-2 hover:scale-105 transition-transform duration-300 cursor-default">
                <Star className="w-4 h-4 mr-2 fill-current animate-pulse" />
                {SOCIAL_PROOF.averageRating}/5 rating
              </Badge>
            </div>

            {/* Main Headline - Staggered animation */}
            <div className={`transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="inline-block animate-fade-in">Accept Crypto Payments</span>
                <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent block animate-slide-up delay-500">
                  Get Paid Instantly
                </span>
              </h1>
            </div>

            {/* Subheadline - Delayed entrance */}
            <div className={`transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Create payment links, generate QR codes, and accept crypto from customers worldwide.
                <span className="font-semibold text-green-500 hover:text-green-400 transition-colors">Instant settlement</span>,
                <span className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">minimal fees</span>.
              </p>
            </div>

            {/* Trust indicators - Animated */}
            <div className={`flex items-center justify-center gap-4 mb-8 text-sm text-muted-foreground transition-all duration-1000 delay-800 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {[
                { icon: Shield, text: 'Secure', color: 'text-green-500', delay: '0ms' },
                { icon: Zap, text: 'Instant', color: 'text-blue-500', delay: '200ms' },
                { icon: Globe, text: 'Global', color: 'text-purple-500', delay: '400ms' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-1 group">
                  <item.icon
                    className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform duration-300`}
                    style={{ animationDelay: item.delay }}
                  />
                  <span className="group-hover:text-foreground transition-colors duration-300">{item.text}</span>
                  {index < 2 && <div className="w-1 h-1 bg-muted-foreground rounded-full ml-4"></div>}
                </div>
              ))}
            </div>

            {/* CTA Buttons - Enhanced animations */}
            <div className={`flex flex-col sm:flex-row gap-3 justify-center mb-6 transition-all duration-1000 delay-1000 ${
              isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}>
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-green-500 hover:shadow-2xl hover:shadow-teal-500/25 hover:scale-105 transition-all duration-300 px-8 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <span className="relative z-10">Start Free</span>
                  <ArrowRight className="w-4 h-4 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link to="/pos-demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 hover:bg-muted/50 hover:scale-105 transition-all duration-300 group border-2"
                >
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Demo
                </Button>
              </Link>
            </div>

            {/* Risk reversal - Animated */}
            <div className={`text-sm text-muted-foreground mb-12 transition-all duration-1000 delay-1200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {['Free setup', 'No monthly fees', 'Cancel anytime'].map((text, index) => (
                  <span key={index} className="hover:text-foreground transition-colors duration-300 cursor-default">
                    {text}
                    {index < 2 && <span className="mx-2">•</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Network Support with enhanced animation */}
            <div className={`bg-muted/30 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border border-border/50 transition-all duration-1000 delay-1400 ${
              isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Trusted by businesses on <span className="font-semibold text-foreground">7+ blockchain networks</span>:
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {SUPPORTED_NETWORKS.map((network, index) => (
                  <div
                    key={network.name}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-500 transform cursor-pointer group ${
                      index === currentNetworkIndex
                        ? 'bg-gradient-to-r from-teal-500/20 to-green-500/20 text-teal-600 scale-110 shadow-lg border border-teal-500/30 animate-pulse-glow'
                        : 'opacity-70 hover:opacity-100 hover:bg-muted/50 hover:scale-105'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <img
                      src={network.logo}
                      alt={network.name}
                      className={`w-6 h-6 transition-transform duration-300 ${
                        index === currentNetworkIndex ? 'animate-spin' : 'group-hover:rotate-12'
                      }`}
                      style={{
                        animationDuration: index === currentNetworkIndex ? '3s' : undefined
                      }}
                    />
                    <span className="font-medium text-sm group-hover:text-foreground transition-colors duration-300">
                      {network.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Animated connection lines */}
              <div className="relative mt-4 h-2">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-16 relative overflow-hidden" data-animate id="stats-section">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/background2.png)',
          }}
        ></div>

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-green-500/10 rounded-full blur-2xl animate-float delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className={`text-center mb-12 transition-all duration-1000 ${
            visibleSections.has('stats-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
              Join thousands of successful merchants
            </h2>
            <p className="text-muted-foreground">Real businesses, real results, real growth</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {STATS.map((stat, index) => (
              <div
                key={index}
                className={`text-center group hover:-translate-y-4 transition-all duration-700 bg-background rounded-xl p-6 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 border border-border/50 hover:border-teal-500/20 ${
                  visibleSections.has('stats-section')
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95'
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl text-white group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-teal-500/25">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-teal-500 transition-colors duration-300 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-1 group-hover:text-foreground transition-colors duration-300">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">
                  {stat.description}
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-green-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/background2.png)',
          }}
        ></div>

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-background/90"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Tired of <span className="text-red-500">losing money</span> to payment processors?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Traditional payment systems are bleeding your business dry. Here's how we fix that:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {PAIN_POINTS.map((point, index) => (
              <Card
                key={index}
                className="p-6 border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${point.color} bg-opacity-10 group-hover:scale-110 transition-all duration-300`}>
                    {point.icon}
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">PROBLEM</span>
                      </div>
                      <p className="text-muted-foreground">{point.pain}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">OUR SOLUTION</span>
                      </div>
                      <p className="font-medium text-foreground">{point.solution}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Don't just take our word for it
            </h2>
            <p className="text-xl text-muted-foreground">
              See how Klyr is transforming businesses worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card
                key={index}
                className="p-6 border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group bg-background"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>

                <blockquote className="text-muted-foreground mb-4 italic">
                  "{testimonial.text}"
                </blockquote>

                {(testimonial.revenue || testimonial.benefit || testimonial.volume) && (
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">
                      {testimonial.revenue || testimonial.benefit || testimonial.volume}
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent"> dominate your market</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stop settling for outdated payment systems. Get the competitive advantage your business deserves.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-teal-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-2 group bg-background"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl text-white w-fit mb-4 group-hover:scale-110 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl group-hover:text-teal-500 transition-colors duration-300 mb-2">
                    {feature.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                      {feature.benefit}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature comparison */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-teal-500/5 to-green-500/5 border-teal-500/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Why choose Klyr over traditional processors?</h3>
                <p className="text-muted-foreground">The numbers speak for themselves</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-2">3-5 days</div>
                  <div className="text-sm text-muted-foreground mb-4">Traditional settlement</div>
                  <div className="text-2xl font-bold text-green-500">vs &lt;5 seconds</div>
                  <div className="text-sm font-medium">With Klyr</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-2">3-5%</div>
                  <div className="text-sm text-muted-foreground mb-4">Traditional fees</div>
                  <div className="text-2xl font-bold text-green-500">vs &lt;$0.50</div>
                  <div className="text-sm font-medium">With Klyr</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-2">Local only</div>
                  <div className="text-sm text-muted-foreground mb-4">Geographic limits</div>
                  <div className="text-2xl font-bold text-green-500">vs Global</div>
                  <div className="text-sm font-medium">195+ countries</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Get started in <span className="text-teal-500">under 2 minutes</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              No complex setup, no lengthy approvals. Start earning immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-500 transition-colors duration-300">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground mb-4">
                Connect any crypto wallet in seconds. No lengthy registration or KYC required.
              </p>
              <div className="text-sm text-green-500 font-medium">⏱️ Takes 30 seconds</div>
            </div>

            <div className="text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <LinkIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-500 transition-colors duration-300">
                Create Payment Link
              </h3>
              <p className="text-muted-foreground mb-4">
                Generate payment links or QR codes instantly. Set amount, description, and expiry.
              </p>
              <div className="text-sm text-green-500 font-medium">⏱️ Takes 1 minute</div>
            </div>

            <div className="text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-500 transition-colors duration-300">
                Start Earning
              </h3>
              <p className="text-muted-foreground mb-4">
                Share your link and receive instant payments. Track everything in real-time.
              </p>
              <div className="text-sm text-green-500 font-medium">💰 Instant settlement</div>
            </div>
          </div>

          {/* Call to action in this section */}
          <div className="text-center mt-12">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-teal-500 to-green-500 hover:shadow-xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all duration-300">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Your 2-Minute Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-3">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/background2.png)',
          }}
        ></div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-background/80 to-green-500/20"></div>

        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Urgency headline */}
            <div className="mb-6">
              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-4 py-2 mb-4">
                <Timer className="w-4 h-4 mr-2" />
                Limited Time: Early Adopter Pricing
              </Badge>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Stop losing money to fees.
              <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent block">
                Start earning with crypto today.
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Every day you wait is money left on the table. Join {SOCIAL_PROOF.totalUsers}+ smart merchants
              who've already made the switch and are earning more with lower fees.
            </p>

            {/* Value proposition boxes */}
            <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-green-500 mb-1">Save 90%</div>
                <div className="text-sm text-muted-foreground">On transaction fees</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-blue-500 mb-1">Get paid</div>
                <div className="text-sm text-muted-foreground">In under 5 seconds</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="text-2xl font-bold text-purple-500 mb-1">Reach</div>
                <div className="text-sm text-muted-foreground">195+ countries</div>
              </div>
            </div>

            {/* Main CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/dashboard">
                <Button size="xl" className="bg-gradient-to-r from-teal-500 to-green-500 hover:shadow-2xl hover:shadow-teal-500/25 transform hover:scale-105 transition-all duration-300 text-lg px-10 py-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Rocket className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Start Your Free Account</span>
                  <ArrowRight className="w-5 h-5 ml-2 relative z-10" />
                </Button>
              </Link>
              <Link to="/pos-demo">
                <Button variant="outline" size="xl" className="border-2 hover:bg-muted/50 text-lg px-10 py-4">
                  <Play className="w-5 h-5 mr-2" />
                  See Live Demo
                </Button>
              </Link>
            </div>

            {/* Risk reversal and guarantees */}
            <div className="bg-background/60 backdrop-blur-sm rounded-2xl p-6 border border-border/50 mb-8">
              <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No contracts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Final urgency message */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                <strong className="text-orange-500">{LIMITED_TIME_OFFER.spotsLeft} early adopter spots remaining</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Join now and lock in premium features at no cost for 6 months
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer trust signals */}
      <section className="py-12 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by businesses worldwide • Powered by Solana blockchain
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-green-500" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="w-4 h-4 text-green-500" />
                <span>PCI DSS Level 1</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-4 h-4 text-green-500" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

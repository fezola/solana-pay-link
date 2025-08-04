import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  QrCode, 
  Wallet, 
  CreditCard,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Store,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEMO_FEATURES = [
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Mobile-First Experience",
    description: "Customers scan QR codes with any smartphone to access payment options",
    color: "text-blue-500"
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    title: "Crypto Payments",
    description: "Accept SOL, USDC, and other cryptocurrencies instantly",
    color: "text-teal-500"
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Traditional Payments",
    description: "Bank transfers, mobile money, and local payment methods",
    color: "text-purple-500"
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Reach",
    description: "Support for multiple countries and local payment preferences",
    color: "text-green-500"
  }
];

const SUPPORTED_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', methods: ['Bank Transfer', 'USSD', 'Mobile Money'] },
  { code: 'KE', name: 'Kenya', currency: 'KES', methods: ['M-Pesa', 'Bank Transfer'] },
  { code: 'GH', name: 'Ghana', currency: 'GHS', methods: ['Mobile Money', 'Bank Transfer'] },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', methods: ['EFT', 'Instant EFT'] },
  { code: 'US', name: 'United States', currency: 'USD', methods: ['ACH', 'Wire Transfer'] }
];

const DEMO_STATS = [
  { label: "Countries Supported", value: "5+", icon: <Globe className="h-5 w-5" /> },
  { label: "Payment Methods", value: "15+", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Setup Time", value: "<3min", icon: <Zap className="h-5 w-5" /> },
  { label: "Transaction Fee", value: "<$0.50", icon: <TrendingUp className="h-5 w-5" /> }
];

const CUSTOMER_TESTIMONIALS = [
  {
    name: "Adebayo Ogundimu",
    business: "Lagos Electronics Store",
    country: "Nigeria",
    avatar: "AO",
    rating: 5,
    text: "My customers love having the choice between crypto and bank transfer. Sales increased 60% since implementing hybrid payments!",
    highlight: "+60% sales"
  },
  {
    name: "Sarah Wanjiku",
    business: "Nairobi Coffee Shop",
    country: "Kenya",
    avatar: "SW",
    rating: 5,
    text: "The QR code system is so simple. Customers can pay with M-Pesa or USDC - whatever they prefer. Perfect for my diverse customer base.",
    highlight: "Perfect flexibility"
  },
  {
    name: "Michael Chen",
    business: "Cape Town Restaurant",
    country: "South Africa",
    avatar: "MC",
    rating: 5,
    text: "Instant crypto payments and traditional EFT in one system. My accounting is so much easier now, and customers appreciate the options.",
    highlight: "Simplified accounting"
  }
];

export const HybridPOSDemo = () => {
  const [selectedCountry, setSelectedCountry] = useState(SUPPORTED_COUNTRIES[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-6 bg-teal-500/10 text-teal-600 border-teal-500/20 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Revolutionary Payment System
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            One QR Code,
            <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent block">
              Unlimited Payment Options
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The world's first hybrid POS system that lets customers choose between 
            cryptocurrency and traditional payment methods from a single QR code.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/hybrid-pos">
              <Button size="lg" className="bg-gradient-to-r from-teal-500 to-green-500 hover:shadow-xl px-8">
                <Store className="w-5 h-5 mr-2" />
                Try Hybrid POS
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8">
              <QrCode className="w-5 h-5 mr-2" />
              See Demo QR
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {DEMO_STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-teal-600">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Hybrid Payments Work</h2>
            <p className="text-xl text-muted-foreground">
              Simple for merchants, flexible for customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Merchant Setup</h3>
                  <p className="text-muted-foreground">
                    Register your business with both crypto wallet and bank account details. 
                    Choose your preferred local currency and payment methods.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Generate QR Code</h3>
                  <p className="text-muted-foreground">
                    Enter the payment amount and description. The system generates a single 
                    QR code that contains all payment options.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Customer Choice</h3>
                  <p className="text-muted-foreground">
                    Customer scans the QR code and sees both crypto and traditional payment 
                    options. They choose their preferred method.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Instant Settlement</h3>
                  <p className="text-muted-foreground">
                    Crypto payments settle instantly. Traditional payments are tracked 
                    and confirmed through the system.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-green-50 p-8 rounded-2xl">
              <div className="text-center mb-6">
                <div className="w-48 h-48 bg-white rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                  <QrCode className="w-32 h-32 text-teal-600" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Sample Payment QR</h4>
                <p className="text-sm text-muted-foreground">
                  Customer scans this to see all payment options
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Wallet className="w-5 h-5 text-teal-500" />
                  <span className="text-sm">Pay with SOL, USDC, USDT</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Pay with Bank Transfer</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Pay with Mobile Money</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Hybrid Payments?</h2>
            <p className="text-xl text-muted-foreground">
              The best of both worlds in one seamless system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {DEMO_FEATURES.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-opacity-10 flex items-center justify-center ${feature.color.replace('text-', 'bg-')}`}>
                    <div className={feature.color}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Country Support */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Global Payment Support</h2>
            <p className="text-xl text-muted-foreground">
              Tailored payment methods for each country
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="grid grid-cols-1 gap-3">
                {SUPPORTED_COUNTRIES.map((country) => (
                  <Card 
                    key={country.code}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedCountry.code === country.code 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'hover:border-teal-200'
                    }`}
                    onClick={() => setSelectedCountry(country)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{country.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {country.currency} • {country.methods.length} methods
                          </p>
                        </div>
                        {selectedCountry.code === country.code && (
                          <CheckCircle className="w-5 h-5 text-teal-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-green-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">
                Payment Methods in {selectedCountry.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-teal-500" />
                    Cryptocurrency
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {['SOL', 'USDC', 'USDT'].map(crypto => (
                      <Badge key={crypto} variant="outline" className="bg-teal-100 text-teal-700">
                        {crypto}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Local Methods ({selectedCountry.currency})
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedCountry.methods.map(method => (
                      <Badge key={method} variant="outline" className="bg-blue-100 text-blue-700">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Example:</strong> A customer in {selectedCountry.name} can pay 
                  with {selectedCountry.methods[0]} or any supported cryptocurrency, 
                  all from the same QR code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Merchants Worldwide</h2>
            <p className="text-xl text-muted-foreground">
              See how businesses are growing with hybrid payments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CUSTOMER_TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.country}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="flex items-center gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-muted-foreground mb-4 italic">
                    "{testimonial.text}"
                  </blockquote>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">
                      {testimonial.highlight}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-500 to-green-500">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of merchants already using hybrid payments to grow their revenue
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hybrid-pos">
              <Button size="lg" variant="secondary" className="px-8">
                <Store className="w-5 h-5 mr-2" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 border-white text-white hover:bg-white hover:text-teal-600">
              <Users className="w-5 h-5 mr-2" />
              Contact Sales
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>24/7 support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  CreditCard,
  CheckCircle,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createInvoice,
  generatePaymentURL,
  saveInvoice,
  SPL_TOKENS
} from '@/lib/payment-utils';
// Removed broken imports that were causing issues

import { calculateCartTotal } from '@/lib/currency-utils';
// import { OfficialBasePayButton } from '@/components/BasePayButton'; // Temporarily removed for demo

// Mock product data - All prices in USD, store accepts multiple currencies
// REDUCED PRICES FOR DEVNET TESTING
const PRODUCTS = [
  {
    id: 'nike-air-max',
    name: 'Nike Air Max 270',
    category: 'Shoes',
    price: 3, // USD base price (was 120) - ~0.15 SOL or 3 USDC
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    description: 'Comfortable running shoes with excellent cushioning and style.',
    rating: 4.8,
    reviews: 1247,
    inStock: true,
    features: ['Air Max cushioning', 'Breathable mesh', 'Durable rubber sole']
  },
  {
    id: 'vintage-denim-jacket',
    name: 'Vintage Denim Jacket',
    category: 'Clothing',
    price: 2, // USD base price (was 85) - ~0.1 SOL or 2 USDC
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    description: 'Classic vintage-style denim jacket perfect for any casual outfit.',
    rating: 4.6,
    reviews: 892,
    inStock: true,
    features: ['100% Cotton', 'Vintage wash', 'Classic fit', 'Multiple pockets']
  },
  {
    id: 'leather-boots',
    name: 'Premium Leather Boots',
    category: 'Shoes',
    price: 5, // USD base price (was 200) - ~0.25 SOL or 5 USDC
    image: 'https://images.unsplash.com/photo-1608256246200-53e8b47b9409?w=400&h=400&fit=crop',
    description: 'Handcrafted leather boots built to last with premium materials.',
    rating: 4.9,
    reviews: 634,
    inStock: true,
    features: ['Genuine leather', 'Handcrafted', 'Waterproof', 'Non-slip sole']
  },
  {
    id: 'cotton-tshirt',
    name: 'Organic Cotton T-Shirt',
    category: 'Clothing',
    price: 1, // USD base price (was 25) - ~0.05 SOL or 1 USDC
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    description: 'Soft, comfortable organic cotton t-shirt in various colors.',
    rating: 4.4,
    reviews: 2156,
    inStock: true,
    features: ['100% Organic cotton', 'Pre-shrunk', 'Tagless', 'Machine washable']
  }
];

// Store info
const STORE_INFO = {
  name: 'CryptoFashion Store',
  description: 'Premium fashion items paid with cryptocurrency',
  walletAddress: 'HH6V2MRkEbVaYwsas3YrxuhKFKWW1wvp6kbX51SA8UoU', // Your wallet
  logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop'
};

export const EcommerceDemo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for payment success on page load
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const invoiceId = searchParams.get('invoice');

    if (paymentStatus === 'success' && invoiceId) {
      // Show success message
      toast({
        title: "🎉 Payment Successful!",
        description: "Your order has been completed successfully. Thank you for your purchase!",
      });

      // Clear the cart since payment was successful
      setCart([]);
      setPaymentSuccess(true);

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, toast]);
  
  const [cart, setCart] = useState<Array<{product: any, quantity: number}>>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check if we're viewing a specific product
  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId) {
      const product = PRODUCTS.find(p => p.id === productId);
      setSelectedProduct(product);
    }
  }, [searchParams]);

  const addToCart = (product: any, quantity: number = 1) => {
    try {
      setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });

      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const getCartTotal = () => {
    // Calculate total in USD (base currency)
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add some items to your cart first",
        variant: "destructive"
      });
      return;
    }

    setShowCheckout(true);
  };

  const handleBackToCart = () => {
    setShowCheckout(false);
    setPaymentSuccess(false);
  };

  const handleSolanaPayment = () => {
    try {
      const cartTotal = getCartTotal();

      // Create order description
      const orderItems = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
      const orderDescription = `Shop Order: ${orderItems}`;

      // Create Solana payment invoice
      const invoice = createInvoice({
        recipient: STORE_INFO.walletAddress,
        amount: cartTotal.toString(),
        token: 'USDC', // Default to USDC for shop payments
        title: `${STORE_INFO.name} - Order Payment`,
        description: orderDescription,
        expiresIn: 30 // 30 minutes
      });

      // Save the invoice
      saveInvoice(invoice);

      // Redirect to checkout with the invoice ID
      window.location.href = `/checkout?invoice=${invoice.id}`;

    } catch (error) {
      console.error('Error creating Solana payment:', error);
      toast({
        title: "Payment Error",
        description: "Could not create Solana payment",
        variant: "destructive"
      });
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowCheckout(false);
    setCart([]); // Clear cart after successful payment

    toast({
      title: "🎉 Order Confirmed!",
      description: "Thank you for your purchase. Your order has been processed successfully.",
    });
  };

  // Product detail view
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedProduct(null)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div>
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-2">{selectedProduct.category}</Badge>
                <h1 className="text-3xl font-bold">{selectedProduct.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(selectedProduct.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-primary">
                  ${selectedProduct.price} USD
                </div>
                <div className="text-sm text-muted-foreground">
                  Pay with SOL, USDC, or USDT
                </div>
              </div>

              <p className="text-gray-600">{selectedProduct.description}</p>

              <div>
                <h3 className="font-semibold mb-2">Features:</h3>
                <ul className="space-y-1">
                  {selectedProduct.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => addToCart(selectedProduct)}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button 
                  onClick={() => {
                    addToCart(selectedProduct);
                    // Small delay to show the add to cart, then checkout
                    setTimeout(() => proceedToCheckout(), 500);
                  }}
                  variant="outline"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Free shipping
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Secure payment
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Checkout view with Base Pay
  if (showCheckout) {
    const cartTotal = getCartTotal();

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                <p className="text-gray-600">Complete your purchase</p>
              </div>
              <Button
                variant="outline"
                onClick={handleBackToCart}
                className="flex items-center gap-2"
              >
                ← Back to Cart
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Payment Options */}
              <div>
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Payment Options</CardTitle>
                    <CardDescription>
                      Choose your preferred payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Solana Pay Option */}
                    <div className="p-4 border-2 border-teal-200 rounded-lg bg-teal-50">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src="/solana-sol-logo.png"
                          alt="Solana"
                          className="w-8 h-8"
                        />
                        <div>
                          <h3 className="font-semibold text-teal-900">Solana Pay</h3>
                          <p className="text-sm text-teal-700">SOL or USDC on Solana</p>
                        </div>
                      </div>

                      <Button
                        onClick={handleSolanaPayment}
                        className="w-full bg-teal-600 hover:bg-teal-700"
                      >
                        Pay with Solana
                      </Button>
                    </div>

                    {/* Base Pay Option - Temporarily Disabled */}
                    <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src="/usd-coin-usdc-logo.png"
                          alt="USDC"
                          className="w-8 h-8 opacity-50"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-600">Base Pay - USDC</h3>
                          <p className="text-sm text-gray-500">Temporarily disabled for demo</p>
                        </div>
                      </div>

                      <Button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Base Pay - Coming Soon
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="shadow-lg border-0 sticky top-4">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* Cart Items */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.product.name}</h4>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-sm font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Store Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Store:</strong> {STORE_INFO.name}</p>
                        <p><strong>Contact:</strong> {STORE_INFO.email}</p>
                        <p><strong>Accepts:</strong> USDC (Base), SOL/USDC (Solana)</p>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Removed the custom Solana payment view - using existing checkout system instead

  // Main store view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      {paymentSuccess && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-green-800">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  ✅
                </div>
                <div>
                  <h3 className="font-semibold">Payment Successful!</h3>
                  <p className="text-sm text-green-600">Your order has been completed. Thank you for your purchase!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={STORE_INFO.logo} 
                alt={STORE_INFO.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold">{STORE_INFO.name}</h1>
                <p className="text-gray-600">{STORE_INFO.description}</p>
              </div>
            </div>
            
            {/* Cart */}
            <div className="relative">
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cart.length})
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {paymentSuccess && (
          <div className="mb-8">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Payment Successful! 🎉</h3>
                    <p className="text-green-100">
                      Your order has been confirmed and is being processed. Thank you for shopping with {STORE_INFO.name}!
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentSuccess(false)}
                    className="text-white hover:bg-white/20"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Products */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.map((product) => (
                <Card key={product.id} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
                  <div onClick={() => setSelectedProduct(product)}>
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-2">{product.category}</Badge>
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({product.reviews})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            ${product.price} USD
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <div className="p-4 pt-0">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-card sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                          <div className="text-xs text-gray-600">
                            ${item.product.price} USD
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total:</span>
                        <span>${getCartTotal().toFixed(2)} USD</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={proceedToCheckout}
                      className="w-full"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

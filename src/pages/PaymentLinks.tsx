import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, Search, Filter, Plus, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getInvoices, PaymentStatus, formatAmount } from '@/lib/payment-utils';

interface PaymentLink {
  id: string;
  title: string;
  description: string;
  amount: string;
  token: string;
  network: 'solana' | 'base';
  recipient: string;
  status: PaymentStatus;
  createdAt: Date;
  expiresAt?: Date;
  paymentUrl: string;
}

export const PaymentLinks = () => {
  const { toast } = useToast();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'solana' | 'base'>('all');

  useEffect(() => {
    loadPaymentLinks();
  }, []);

  const loadPaymentLinks = () => {
    // Load invoices and convert to payment links format
    const invoices = getInvoices();
    const links: PaymentLink[] = invoices.map(invoice => ({
      id: invoice.id,
      title: invoice.title,
      description: invoice.description,
      amount: invoice.amount,
      token: invoice.token,
      network: invoice.recipient.startsWith('0x') ? 'base' : 'solana',
      recipient: invoice.recipient,
      status: invoice.status,
      createdAt: invoice.createdAt,
      expiresAt: invoice.expiresAt,
      paymentUrl: `${window.location.origin}/checkout?invoice=${invoice.id}`
    }));
    setPaymentLinks(links);
  };

  const filteredLinks = paymentLinks.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    const matchesNetwork = networkFilter === 'all' || link.network === networkFilter;
    return matchesSearch && matchesStatus && matchesNetwork;
  });

  const copyPaymentLink = async (link: PaymentLink) => {
    await navigator.clipboard.writeText(link.paymentUrl);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const openPaymentLink = (link: PaymentLink) => {
    window.open(link.paymentUrl, '_blank');
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNetworkColor = (network: string) => {
    return network === 'solana' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
            <p className="text-gray-600 mt-1">Manage and track your payment links</p>
          </div>
          <Button onClick={() => window.location.href = '/'} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Link
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Network</Label>
                <select
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value as 'all' | 'solana' | 'base')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Networks</option>
                  <option value="solana">Solana</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={loadPaymentLinks} variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Links List */}
        <div className="space-y-4">
          {filteredLinks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No payment links found</h3>
                  <p>Create your first payment link to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLinks.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{link.title}</h3>
                        <Badge className={getStatusColor(link.status)}>
                          {link.status}
                        </Badge>
                        <Badge className={getNetworkColor(link.network)}>
                          {link.network}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{link.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <div className="font-medium">{formatAmount(link.amount)} {link.token}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <div className="font-medium">{link.createdAt.toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <div className="font-medium">
                            {link.expiresAt ? link.expiresAt.toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Recipient:</span>
                          <div className="font-medium font-mono text-xs">
                            {link.recipient.slice(0, 8)}...{link.recipient.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPaymentLink(link)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentLink(link)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{paymentLinks.length}</div>
                <div className="text-sm text-gray-500">Total Links</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {paymentLinks.filter(l => l.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {paymentLinks.filter(l => l.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {paymentLinks.filter(l => l.network === 'solana').length}
                </div>
                <div className="text-sm text-gray-500">Solana</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

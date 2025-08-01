import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Copy, 
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getInvoices, 
  PaymentStatus, 
  Invoice, 
  formatAmount,
  isInvoiceExpired,
  generatePaymentURL
} from '@/lib/payment-utils';

export const InvoiceManager = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load invoices
  const loadInvoices = () => {
    setIsLoading(true);
    try {
      const allInvoices = getInvoices();
      setInvoices(allInvoices);
      setFilteredInvoices(allInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter invoices based on search and status
  useEffect(() => {
    let filtered = invoices;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.recipient.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Get status icon
  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case PaymentStatus.PROCESSING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case PaymentStatus.FAILED:
        return <XCircle className="h-4 w-4 text-destructive" />;
      case PaymentStatus.EXPIRED:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get status variant for badge
  const getStatusVariant = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'default';
      case PaymentStatus.PROCESSING:
        return 'secondary';
      case PaymentStatus.FAILED:
        return 'destructive';
      case PaymentStatus.EXPIRED:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Copy payment link
  const copyPaymentLink = async (invoice: Invoice) => {
    const url = generatePaymentURL(invoice);
    const checkoutUrl = `${window.location.origin}/checkout?invoice=${invoice.id}`;
    
    await navigator.clipboard.writeText(checkoutUrl);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
  };

  // Open checkout page
  const openCheckout = (invoice: Invoice) => {
    const checkoutUrl = `/checkout?invoice=${invoice.id}`;
    window.open(checkoutUrl, '_blank');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Invoice ID', 'Title', 'Amount', 'Token', 'Status', 'Created', 'Recipient'];
    const csvData = filteredInvoices.map(invoice => [
      invoice.id,
      invoice.title,
      formatAmount(invoice.amount, invoice.token),
      invoice.token,
      invoice.status,
      invoice.createdAt.toISOString(),
      invoice.recipient.toString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Invoice data exported to CSV",
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Manager
            </CardTitle>
            <CardDescription>
              Manage and track all your payment invoices
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadInvoices}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={filteredInvoices.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={PaymentStatus.PROCESSING}>Processing</SelectItem>
              <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
              <SelectItem value={PaymentStatus.EXPIRED}>Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <p className="text-sm">Create your first payment link to get started</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(invoice.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{invoice.title}</span>
                      <Badge variant={getStatusVariant(invoice.status)} className="text-xs">
                        {invoice.status}
                      </Badge>
                      {isInvoiceExpired(invoice) && invoice.status === PaymentStatus.PENDING && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-mono">{invoice.id}</span> • 
                      <span className="ml-1">{invoice.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatAmount(invoice.amount, invoice.token)} {invoice.token}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.recipient.toString().slice(0, 8)}...
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyPaymentLink(invoice)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openCheckout(invoice)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

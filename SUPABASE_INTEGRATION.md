# Supabase Integration for Solana Pay Link

This document outlines the complete Supabase integration for your Solana payment system.

## 🗄️ Database Schema

Your Supabase project (`solpayment`) now includes the following tables:

### Tables Created

1. **merchants** - Store merchant profiles and authentication data
2. **invoices** - Track payment requests and their status
3. **transactions** - Record actual blockchain transactions
4. **webhook_events** - Manage webhook deliveries and retries
5. **payment_links** - Store shareable payment links

### Key Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Automatic timestamps with triggers
- ✅ Proper indexes for performance
- ✅ Database functions for common operations
- ✅ Webhook event management

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qbndluitbsjbhcqqbtnt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibmRsdWl0YnNqYmhjcXFidG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzM0NzgsImV4cCI6MjA2OTcwOTQ3OH0.HkUUCQmjdMY6tDynKUHgTqQgUwFD5jAxCifSXOQ-ozw

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibmRsdWl0YnNqYmhjcXFidG50Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDEzMzQ3OCwiZXhwIjoyMDY5NzA5NDc4fQ.rtUU0dqUmBKDjnF34Mx_vStz4lKG2x8r-Ne7W_TX1fQ

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret-here
```

## 📁 New Files Created

### Core Integration Files

1. **`src/lib/supabase.ts`** - Supabase client configuration and TypeScript types
2. **`src/lib/supabase-service.ts`** - Service classes for database operations
3. **`src/lib/webhook-handler.ts`** - Webhook delivery and monitoring system

### API Routes

1. **`src/pages/api/webhooks/process.ts`** - Process pending webhook deliveries
2. **`src/pages/api/payments/status.ts`** - Update payment status
3. **`src/pages/api/merchants/register.ts`** - Register new merchants

## 🚀 Usage Examples

### Register a Merchant

```typescript
import { MerchantService } from './lib/supabase-service'

const merchant = await MerchantService.createMerchant({
  walletAddress: publicKey,
  businessName: "My Business",
  email: "contact@mybusiness.com",
  website: "https://mybusiness.com"
})
```

### Create an Invoice

```typescript
import { InvoiceService } from './lib/supabase-service'

const invoice = await InvoiceService.createInvoice({
  merchantId: merchant.id,
  reference: "INV-001",
  amount: 10.50,
  tokenSymbol: "USDC",
  recipientAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  description: "Payment for services"
})
```

### Update Payment Status

```typescript
import { InvoiceService } from './lib/supabase-service'

await InvoiceService.updateInvoiceStatus(
  "INV-001", 
  "completed", 
  "transaction-signature-here"
)
```

### Get Merchant Statistics

```typescript
import { MerchantService } from './lib/supabase-service'

const stats = await MerchantService.getMerchantStats(walletAddress)
console.log(stats) // { total_invoices, completed_payments, total_revenue, etc. }
```

## 🔄 Updated Existing Files

### Modified Files

1. **`src/lib/merchant-auth.ts`** - Added Supabase integration with fallback to localStorage
2. **`src/lib/payment-utils.ts`** - Added imports for Supabase services

### Backward Compatibility

- All existing functions maintain backward compatibility
- New async versions added alongside sync versions
- Automatic fallback to localStorage if Supabase fails

## 🔐 Security Features

### Row Level Security (RLS)

- Merchants can only access their own data
- Service role can access all data for system operations
- Automatic wallet address validation

### Webhook Security

- HMAC signature verification
- Retry mechanism with exponential backoff
- Rate limiting and timeout protection

## 🔗 API Endpoints

### POST `/api/merchants/register`

Register a new merchant:

```json
{
  "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "businessName": "My Business",
  "email": "contact@mybusiness.com",
  "website": "https://mybusiness.com"
}
```

### POST `/api/payments/status`

Update payment status:

```json
{
  "reference": "INV-001",
  "status": "completed",
  "transactionSignature": "signature-here",
  "transactionDetails": {
    "fromAddress": "sender-address",
    "toAddress": "recipient-address",
    "amount": 10.50,
    "tokenSymbol": "USDC"
  }
}
```

### POST `/api/webhooks/process`

Process pending webhooks (requires authentication):

```bash
curl -X POST http://localhost:3000/api/webhooks/process \
  -H "Authorization: Bearer your-webhook-secret"
```

## 🔄 Migration from localStorage

Your existing localStorage data will automatically be preserved as a fallback. The system will:

1. Try to authenticate/register with Supabase first
2. Fall back to localStorage if Supabase is unavailable
3. Sync data between Supabase and localStorage when possible

## 📊 Monitoring and Analytics

### Database Functions

- `get_merchant_stats()` - Get comprehensive merchant statistics
- `update_invoice_status()` - Update invoice status with automatic webhook triggers

### Webhook Monitoring

- Automatic retry with exponential backoff
- Delivery status tracking
- Response logging for debugging

## 🚀 Next Steps

1. **Test the Integration**: Use the API endpoints to test merchant registration and payment processing
2. **Set up Webhooks**: Configure webhook URLs in merchant profiles for real-time notifications
3. **Monitor Performance**: Use Supabase dashboard to monitor database performance and usage
4. **Scale as Needed**: Upgrade Supabase plan based on usage requirements

## 🛠️ Troubleshooting

### Common Issues

1. **RLS Errors**: Ensure wallet addresses match exactly between client and database
2. **Webhook Failures**: Check webhook URLs are accessible and return 200 status
3. **Type Errors**: Ensure all TypeScript types are properly imported

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will log all Supabase operations and webhook attempts to the console.

import { supabase, Database } from './supabase'
import { PublicKey } from '@solana/web3.js'

// Type aliases for convenience
type MerchantRow = Database['public']['Tables']['merchants']['Row']
type MerchantInsert = Database['public']['Tables']['merchants']['Insert']
type InvoiceRow = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type TransactionRow = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type PaymentLinkRow = Database['public']['Tables']['payment_links']['Row']
type PaymentLinkInsert = Database['public']['Tables']['payment_links']['Insert']

// Merchant Service Functions
export class MerchantService {
  static async createMerchant(params: {
    walletAddress: PublicKey | string
    businessName: string
    email?: string
    website?: string
    description?: string
    logoUrl?: string
  }): Promise<MerchantRow> {
    try {
      const walletAddressStr = typeof params.walletAddress === 'string'
        ? params.walletAddress
        : params.walletAddress.toString()

      const { data, error } = await supabase
        .from('merchants')
        .insert({
          wallet_address: walletAddressStr,
          business_name: params.businessName,
          email: params.email,
          website: params.website,
          description: params.description,
          logo_url: params.logoUrl,
        })
        .select()
        .single()

      if (error) {
        // Handle RLS or permission errors gracefully
        if (error.code === '406' || error.message.includes('406') || error.message.includes('RLS')) {
          console.warn('Supabase RLS blocking insert, falling back to localStorage')
        }
        throw new Error(`Failed to create merchant: ${error.message}`)
      }

      return data
    } catch (error) {
      console.warn('Error creating merchant in Supabase:', error)
      throw error // Re-throw to trigger fallback in calling code
    }
  }

  static async getMerchantByWallet(walletAddress: PublicKey | string): Promise<MerchantRow | null> {
    try {
      const walletAddressStr = typeof walletAddress === 'string'
        ? walletAddress
        : walletAddress.toString()

      // First try to find by primary wallet address
      let { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('wallet_address', walletAddressStr)
        .single()

      if (data) {
        return data
      }

      // If not found by primary wallet, check wallet_addresses array
      const { data: merchantsWithWallet, error: arrayError } = await supabase
        .from('merchants')
        .select('*')
        .contains('wallet_addresses', [walletAddressStr])

      if (arrayError) {
        // Handle common errors gracefully
        if (arrayError.code === '406' || arrayError.message.includes('406')) {
          console.warn('Supabase RLS blocking access, falling back to localStorage')
          return null
        }
        console.warn('Error searching wallet_addresses:', arrayError)
        return null
      }

      if (merchantsWithWallet && merchantsWithWallet.length > 0) {
        return merchantsWithWallet[0] // Return first match
      }

      return null
    } catch (error) {
      console.warn('Error accessing Supabase, falling back to localStorage:', error)
      return null
    }
  }

  static async updateMerchant(
    walletAddress: PublicKey | string, 
    updates: Partial<MerchantInsert>
  ): Promise<MerchantRow> {
    const walletAddressStr = typeof walletAddress === 'string' 
      ? walletAddress 
      : walletAddress.toString()

    const { data, error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('wallet_address', walletAddressStr)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update merchant: ${error.message}`)
    }

    return data
  }

  static async getMerchantStats(walletAddress: PublicKey | string) {
    const walletAddressStr = typeof walletAddress === 'string'
      ? walletAddress
      : walletAddress.toString()

    const { data, error } = await supabase
      .rpc('get_merchant_stats', { merchant_wallet_address: walletAddressStr })

    if (error) {
      throw new Error(`Failed to get merchant stats: ${error.message}`)
    }

    return data[0] || {
      total_invoices: 0,
      completed_payments: 0,
      total_revenue: 0,
      active_invoices: 0,
      pending_invoices: 0
    }
  }

  // Get all clients/companies that have made payments to this merchant
  static async getMerchantClients(walletAddress: PublicKey | string) {
    const walletAddressStr = typeof walletAddress === 'string'
      ? walletAddress
      : walletAddress.toString()

    try {
      // Get merchant first
      const merchant = await this.getMerchantByWallet(walletAddressStr)
      if (!merchant) {
        return []
      }

      // Get all unique payer addresses from completed transactions
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          payer_address,
          amount,
          token_symbol,
          created_at,
          invoices!inner(
            merchant_id,
            title,
            description
          )
        `)
        .eq('invoices.merchant_id', merchant.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error fetching client data from Supabase:', error)
        return []
      }

      // Group by payer address to get client statistics
      const clientMap = new Map()

      data?.forEach(tx => {
        const payerAddress = tx.payer_address
        if (!clientMap.has(payerAddress)) {
          clientMap.set(payerAddress, {
            address: payerAddress,
            totalPayments: 0,
            totalVolume: 0,
            lastPayment: tx.created_at,
            firstPayment: tx.created_at,
            transactions: []
          })
        }

        const client = clientMap.get(payerAddress)
        client.totalPayments += 1
        client.totalVolume += parseFloat(tx.amount)
        client.transactions.push({
          amount: tx.amount,
          token: tx.token_symbol,
          date: tx.created_at,
          title: tx.invoices?.title,
          description: tx.invoices?.description
        })

        // Update date ranges
        if (new Date(tx.created_at) > new Date(client.lastPayment)) {
          client.lastPayment = tx.created_at
        }
        if (new Date(tx.created_at) < new Date(client.firstPayment)) {
          client.firstPayment = tx.created_at
        }
      })

      return Array.from(clientMap.values()).sort((a, b) => b.totalVolume - a.totalVolume)
    } catch (error) {
      console.warn('Error fetching merchant clients:', error)
      return []
    }
  }
}

// Invoice Service Functions
export class InvoiceService {
  static async createInvoice(params: {
    merchantId: string
    reference: string
    amount: number
    tokenSymbol?: string
    tokenMint?: string
    recipientAddress: string
    description?: string
    expiresAt?: Date
  }): Promise<InvoiceRow> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        merchant_id: params.merchantId,
        reference: params.reference,
        amount: params.amount,
        token_symbol: params.tokenSymbol || 'SOL',
        token_mint: params.tokenMint,
        recipient_address: params.recipientAddress,
        description: params.description,
        expires_at: params.expiresAt?.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`)
    }

    return data
  }

  static async getInvoiceByReference(reference: string): Promise<InvoiceRow | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('reference', reference)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get invoice: ${error.message}`)
    }

    return data
  }

  static async updateInvoiceStatus(
    reference: string, 
    status: InvoiceRow['status'],
    transactionSignature?: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('update_invoice_status', {
        invoice_reference: reference,
        new_status: status,
        transaction_signature: transactionSignature
      })

    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`)
    }

    return data
  }

  static async getInvoicesByMerchant(
    merchantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<InvoiceRow[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to get invoices: ${error.message}`)
    }

    return data || []
  }
}

// Transaction Service Functions
export class TransactionService {
  static async createTransaction(params: {
    invoiceId: string
    signature: string
    fromAddress: string
    toAddress: string
    amount: number
    tokenSymbol: string
    tokenMint?: string
    blockTime?: Date
    slot?: number
    fee?: number
  }): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        invoice_id: params.invoiceId,
        signature: params.signature,
        from_address: params.fromAddress,
        to_address: params.toAddress,
        amount: params.amount,
        token_symbol: params.tokenSymbol,
        token_mint: params.tokenMint,
        block_time: params.blockTime?.toISOString(),
        slot: params.slot,
        fee: params.fee,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`)
    }

    return data
  }

  static async updateTransactionStatus(
    signature: string,
    confirmationStatus: TransactionRow['confirmation_status'],
    blockTime?: Date,
    slot?: number
  ): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        confirmation_status: confirmationStatus,
        block_time: blockTime?.toISOString(),
        slot: slot,
      })
      .eq('signature', signature)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`)
    }

    return data
  }

  static async getTransactionsByInvoice(invoiceId: string): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`)
    }

    return data || []
  }
}

// Payment Link Service Functions
export class PaymentLinkService {
  static async createPaymentLink(params: {
    merchantId: string
    slug: string
    title: string
    description?: string
    amount?: number
    tokenSymbol?: string
    tokenMint?: string
    recipientAddress: string
    allowCustomAmount?: boolean
    minAmount?: number
    maxAmount?: number
    successUrl?: string
    cancelUrl?: string
    webhookUrl?: string
    expiresAt?: Date
    maxUsage?: number
  }): Promise<PaymentLinkRow> {
    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        merchant_id: params.merchantId,
        slug: params.slug,
        title: params.title,
        description: params.description,
        amount: params.amount,
        token_symbol: params.tokenSymbol || 'SOL',
        token_mint: params.tokenMint,
        recipient_address: params.recipientAddress,
        allow_custom_amount: params.allowCustomAmount || false,
        min_amount: params.minAmount,
        max_amount: params.maxAmount,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        webhook_url: params.webhookUrl,
        expires_at: params.expiresAt?.toISOString(),
        max_usage: params.maxUsage,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create payment link: ${error.message}`)
    }

    return data
  }

  static async getPaymentLinkBySlug(slug: string): Promise<PaymentLinkRow | null> {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get payment link: ${error.message}`)
    }

    return data
  }

  static async incrementPaymentLinkUsage(slug: string): Promise<void> {
    const { error } = await supabase
      .from('payment_links')
      .update({ usage_count: supabase.sql`usage_count + 1` })
      .eq('slug', slug)

    if (error) {
      throw new Error(`Failed to increment usage: ${error.message}`)
    }
  }

  static async getPaymentLinksByMerchant(
    merchantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaymentLinkRow[]> {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.warn('Error fetching payment links from Supabase:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.warn('Error accessing Supabase payment links:', error)
      return []
    }
  }

  // Account Recovery Methods
  static async findMerchantByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (error) {
        console.warn('Error finding merchant by email:', error)
        return null
      }

      return data
    } catch (error) {
      console.warn('Error accessing merchant by email:', error)
      return null
    }
  }

  static async addWalletToMerchant(merchantId: string, newWalletAddress: string) {
    try {
      // First check if wallet is already associated with another merchant
      const existingMerchant = await this.getMerchantByWallet(newWalletAddress)
      if (existingMerchant && existingMerchant.id !== merchantId) {
        throw new Error('This wallet is already associated with another business account')
      }

      // Add the new wallet address to the merchant's wallet_addresses array
      const { data: merchant } = await supabase
        .from('merchants')
        .select('wallet_addresses')
        .eq('id', merchantId)
        .single()

      if (!merchant) {
        throw new Error('Merchant not found')
      }

      const currentWallets = merchant.wallet_addresses || []
      if (!currentWallets.includes(newWalletAddress)) {
        const updatedWallets = [...currentWallets, newWalletAddress]

        const { error } = await supabase
          .from('merchants')
          .update({ wallet_addresses: updatedWallets })
          .eq('id', merchantId)

        if (error) {
          throw new Error(`Failed to add wallet: ${error.message}`)
        }
      }

      return true
    } catch (error) {
      console.error('Error adding wallet to merchant:', error)
      throw error
    }
  }

  static async removeWalletFromMerchant(merchantId: string, walletAddress: string) {
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('wallet_addresses, wallet_address')
        .eq('id', merchantId)
        .single()

      if (!merchant) {
        throw new Error('Merchant not found')
      }

      // Don't allow removing the primary wallet if it's the only one
      const currentWallets = merchant.wallet_addresses || []
      if (currentWallets.length <= 1 && merchant.wallet_address === walletAddress) {
        throw new Error('Cannot remove the only wallet address. Add another wallet first.')
      }

      const updatedWallets = currentWallets.filter(addr => addr !== walletAddress)

      const { error } = await supabase
        .from('merchants')
        .update({ wallet_addresses: updatedWallets })
        .eq('id', merchantId)

      if (error) {
        throw new Error(`Failed to remove wallet: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error removing wallet from merchant:', error)
      throw error
    }
  }
}

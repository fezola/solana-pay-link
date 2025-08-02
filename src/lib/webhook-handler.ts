import { supabaseAdmin } from './supabase-admin'
import { InvoiceService, TransactionService } from './supabase-service'

// Webhook event types
export type WebhookEventType = 
  | 'payment.pending'
  | 'payment.processing' 
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.expired'

// Webhook payload interface
export interface WebhookPayload {
  event_type: WebhookEventType
  invoice_id: string
  reference: string
  amount: number
  token_symbol: string
  status: string
  transaction_signature?: string
  timestamp: string
  merchant_id: string
}

// Webhook delivery service
export class WebhookService {
  private static readonly MAX_RETRIES = 5
  private static readonly RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000] // 1s, 5s, 15s, 1m, 5m

  // Send webhook to merchant endpoint
  static async sendWebhook(
    webhookUrl: string,
    payload: WebhookPayload,
    secret?: string
  ): Promise<{ success: boolean; status?: number; response?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Solana-Pay-Link/1.0'
      }

      // Add signature if secret is provided
      if (secret) {
        const signature = await this.generateSignature(JSON.stringify(payload), secret)
        headers['X-Solana-Pay-Signature'] = signature
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        timeout: 10000 // 10 second timeout
      })

      const responseText = await response.text()

      return {
        success: response.ok,
        status: response.status,
        response: responseText
      }
    } catch (error) {
      console.error('Webhook delivery failed:', error)
      return {
        success: false,
        response: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generate HMAC signature for webhook verification
  private static async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Process pending webhook events
  static async processPendingWebhooks(): Promise<void> {
    try {
      // Get pending webhook events
      const { data: webhookEvents, error } = await supabaseAdmin
        .from('webhook_events')
        .select('*')
        .eq('status', 'pending')
        .or('status.eq.retrying,next_retry_at.lt.' + new Date().toISOString())
        .limit(50)

      if (error) {
        console.error('Failed to fetch pending webhooks:', error)
        return
      }

      if (!webhookEvents || webhookEvents.length === 0) {
        return
      }

      // Process each webhook event
      for (const event of webhookEvents) {
        await this.processWebhookEvent(event)
      }
    } catch (error) {
      console.error('Error processing pending webhooks:', error)
    }
  }

  // Process individual webhook event
  private static async processWebhookEvent(event: any): Promise<void> {
    try {
      // Get merchant webhook secret if available
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('webhook_url')
        .eq('id', event.merchant_id)
        .single()

      if (!merchant?.webhook_url) {
        // Mark as failed if no webhook URL
        await this.updateWebhookEvent(event.id, 'failed', null, 'No webhook URL configured')
        return
      }

      // Send webhook
      const result = await this.sendWebhook(
        event.webhook_url,
        event.payload,
        process.env.WEBHOOK_SECRET
      )

      if (result.success) {
        // Mark as delivered
        await this.updateWebhookEvent(
          event.id,
          'delivered',
          result.status,
          result.response
        )
      } else {
        // Handle retry logic
        const newAttempts = event.attempts + 1
        
        if (newAttempts >= this.MAX_RETRIES) {
          // Max retries reached, mark as failed
          await this.updateWebhookEvent(
            event.id,
            'failed',
            result.status,
            result.response
          )
        } else {
          // Schedule retry
          const nextRetryAt = new Date(
            Date.now() + this.RETRY_DELAYS[newAttempts - 1]
          )
          
          await this.updateWebhookEvent(
            event.id,
            'retrying',
            result.status,
            result.response,
            newAttempts,
            nextRetryAt
          )
        }
      }
    } catch (error) {
      console.error('Error processing webhook event:', error)
      
      // Mark as failed
      await this.updateWebhookEvent(
        event.id,
        'failed',
        null,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // Update webhook event status
  private static async updateWebhookEvent(
    eventId: string,
    status: string,
    responseStatus?: number | null,
    responseBody?: string | null,
    attempts?: number,
    nextRetryAt?: Date
  ): Promise<void> {
    const updates: any = {
      status,
      last_attempt_at: new Date().toISOString(),
      response_status: responseStatus,
      response_body: responseBody
    }

    if (attempts !== undefined) {
      updates.attempts = attempts
    }

    if (nextRetryAt) {
      updates.next_retry_at = nextRetryAt.toISOString()
    }

    const { error } = await supabaseAdmin
      .from('webhook_events')
      .update(updates)
      .eq('id', eventId)

    if (error) {
      console.error('Failed to update webhook event:', error)
    }
  }

  // Create webhook event for payment status change
  static async createWebhookEvent(
    merchantId: string,
    invoiceId: string,
    eventType: WebhookEventType,
    webhookUrl: string,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('webhook_events')
        .insert({
          merchant_id: merchantId,
          invoice_id: invoiceId,
          event_type: eventType,
          webhook_url: webhookUrl,
          payload: payload,
          status: 'pending'
        })

      if (error) {
        console.error('Failed to create webhook event:', error)
      }
    } catch (error) {
      console.error('Error creating webhook event:', error)
    }
  }

  // Verify webhook signature
  static async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const expectedSignature = await this.generateSignature(payload, secret)
      return signature === expectedSignature
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }
}

// Payment monitoring service
export class PaymentMonitorService {
  // Monitor payment status and trigger webhooks
  static async monitorPayment(
    invoiceReference: string,
    transactionSignature?: string
  ): Promise<void> {
    try {
      // Get invoice details
      const invoice = await InvoiceService.getInvoiceByReference(invoiceReference)
      if (!invoice) {
        console.error('Invoice not found:', invoiceReference)
        return
      }

      // Get merchant details
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .eq('id', invoice.merchant_id)
        .single()

      if (!merchant) {
        console.error('Merchant not found for invoice:', invoiceReference)
        return
      }

      // Create webhook payload
      const payload: WebhookPayload = {
        event_type: `payment.${invoice.status}` as WebhookEventType,
        invoice_id: invoice.id,
        reference: invoice.reference,
        amount: invoice.amount,
        token_symbol: invoice.token_symbol,
        status: invoice.status,
        transaction_signature: transactionSignature,
        timestamp: new Date().toISOString(),
        merchant_id: merchant.id
      }

      // Send webhook if merchant has webhook URL configured
      if (merchant.webhook_url) {
        await WebhookService.createWebhookEvent(
          merchant.id,
          invoice.id,
          payload.event_type,
          merchant.webhook_url,
          payload
        )
      }
    } catch (error) {
      console.error('Error monitoring payment:', error)
    }
  }
}

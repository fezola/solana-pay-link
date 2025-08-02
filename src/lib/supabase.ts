import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './config'

// Create Supabase client (safe for both client and server)
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string
          wallet_address: string
          business_name: string
          email: string | null
          website: string | null
          description: string | null
          logo_url: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          business_name: string
          email?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          business_name?: string
          email?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          merchant_id: string
          reference: string
          amount: number
          token_symbol: string
          token_mint: string | null
          recipient_address: string
          description: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
          payment_url: string | null
          qr_code_url: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          reference: string
          amount: number
          token_symbol?: string
          token_mint?: string | null
          recipient_address: string
          description?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
          payment_url?: string | null
          qr_code_url?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          reference?: string
          amount?: number
          token_symbol?: string
          token_mint?: string | null
          recipient_address?: string
          description?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
          payment_url?: string | null
          qr_code_url?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          invoice_id: string
          signature: string
          from_address: string
          to_address: string
          amount: number
          token_symbol: string
          token_mint: string | null
          block_time: string | null
          slot: number | null
          confirmation_status: 'pending' | 'confirmed' | 'finalized' | 'failed'
          fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          signature: string
          from_address: string
          to_address: string
          amount: number
          token_symbol: string
          token_mint?: string | null
          block_time?: string | null
          slot?: number | null
          confirmation_status?: 'pending' | 'confirmed' | 'finalized' | 'failed'
          fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          signature?: string
          from_address?: string
          to_address?: string
          amount?: number
          token_symbol?: string
          token_mint?: string | null
          block_time?: string | null
          slot?: number | null
          confirmation_status?: 'pending' | 'confirmed' | 'finalized' | 'failed'
          fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          merchant_id: string
          invoice_id: string
          event_type: 'payment.pending' | 'payment.processing' | 'payment.completed' | 'payment.failed' | 'payment.expired'
          webhook_url: string
          payload: any
          status: 'pending' | 'delivered' | 'failed' | 'retrying'
          attempts: number
          last_attempt_at: string | null
          next_retry_at: string | null
          response_status: number | null
          response_body: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          invoice_id: string
          event_type: 'payment.pending' | 'payment.processing' | 'payment.completed' | 'payment.failed' | 'payment.expired'
          webhook_url: string
          payload: any
          status?: 'pending' | 'delivered' | 'failed' | 'retrying'
          attempts?: number
          last_attempt_at?: string | null
          next_retry_at?: string | null
          response_status?: number | null
          response_body?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          invoice_id?: string
          event_type?: 'payment.pending' | 'payment.processing' | 'payment.completed' | 'payment.failed' | 'payment.expired'
          webhook_url?: string
          payload?: any
          status?: 'pending' | 'delivered' | 'failed' | 'retrying'
          attempts?: number
          last_attempt_at?: string | null
          next_retry_at?: string | null
          response_status?: number | null
          response_body?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_links: {
        Row: {
          id: string
          merchant_id: string
          slug: string
          title: string
          description: string | null
          amount: number | null
          token_symbol: string
          token_mint: string | null
          recipient_address: string
          is_active: boolean
          allow_custom_amount: boolean
          min_amount: number | null
          max_amount: number | null
          success_url: string | null
          cancel_url: string | null
          webhook_url: string | null
          expires_at: string | null
          usage_count: number
          max_usage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          slug: string
          title: string
          description?: string | null
          amount?: number | null
          token_symbol?: string
          token_mint?: string | null
          recipient_address: string
          is_active?: boolean
          allow_custom_amount?: boolean
          min_amount?: number | null
          max_amount?: number | null
          success_url?: string | null
          cancel_url?: string | null
          webhook_url?: string | null
          expires_at?: string | null
          usage_count?: number
          max_usage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          slug?: string
          title?: string
          description?: string | null
          amount?: number | null
          token_symbol?: string
          token_mint?: string | null
          recipient_address?: string
          is_active?: boolean
          allow_custom_amount?: boolean
          min_amount?: number | null
          max_amount?: number | null
          success_url?: string | null
          cancel_url?: string | null
          webhook_url?: string | null
          expires_at?: string | null
          usage_count?: number
          max_usage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_merchant_stats: {
        Args: {
          merchant_wallet_address: string
        }
        Returns: {
          total_invoices: number
          completed_payments: number
          total_revenue: number
          active_invoices: number
          pending_invoices: number
        }[]
      }
      update_invoice_status: {
        Args: {
          invoice_reference: string
          new_status: string
          transaction_signature?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

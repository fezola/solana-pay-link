// Configuration that works in both client and server environments

// Supabase public configuration (safe for client-side)
export const SUPABASE_CONFIG = {
  url: 'https://qbndluitbsjbhcqqbtnt.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibmRsdWl0YnNqYmhjcXFidG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzM0NzgsImV4cCI6MjA2OTcwOTQ3OH0.HkUUCQmjdMY6tDynKUHgTqQgUwFD5jAxCifSXOQ-ozw'
}

// App configuration
export const APP_CONFIG = {
  name: 'Kylr',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  solanaNetwork: 'devnet',
  solanaRpcUrl: 'https://api.devnet.solana.com'
}

// Get environment-specific config safely
export function getEnvConfig() {
  // Only access process.env on server-side
  if (typeof window === 'undefined') {
    return {
      webhookSecret: process.env.WEBHOOK_SECRET || 'default-webhook-secret',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  }
  
  // Return safe defaults for client-side
  return {
    webhookSecret: '',
    supabaseServiceKey: '',
    nodeEnv: 'development'
  }
}

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG, getEnvConfig } from './config'

// Server-side admin client (only use in API routes or server-side code)
const envConfig = getEnvConfig()
const supabaseServiceKey = envConfig.supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibmRsdWl0YnNqYmhjcXFidG50Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDEzMzQ3OCwiZXhwIjoyMDY5NzA5NDc4fQ.rtUU0dqUmBKDjnF34Mx_vStz4lKG2x8r-Ne7W_TX1fQ'

// Create admin client for server-side operations
export const supabaseAdmin = createClient(SUPABASE_CONFIG.url, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

import { supabase } from './supabase'

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('merchants')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Supabase connection successful, merchant count:', data)
    return { success: true, count: data }
  } catch (error) {
    console.error('Supabase test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test creating a merchant without RLS
export async function testMerchantCreation(walletAddress: string, businessName: string) {
  try {
    console.log('Testing merchant creation...')
    
    const { data, error } = await supabase
      .from('merchants')
      .insert({
        wallet_address: walletAddress,
        business_name: businessName,
        email: 'test@example.com'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Merchant creation error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Merchant created successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Merchant creation test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

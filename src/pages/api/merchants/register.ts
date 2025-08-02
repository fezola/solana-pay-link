import { NextApiRequest, NextApiResponse } from 'next'
import { PublicKey } from '@solana/web3.js'
import { MerchantService } from '../../../lib/supabase-service'

// API route to register a new merchant
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      walletAddress, 
      businessName, 
      email, 
      website, 
      description, 
      logoUrl 
    } = req.body

    if (!walletAddress || !businessName) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress and businessName' 
      })
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress)
    } catch (error) {
      return res.status(400).json({ error: 'Invalid wallet address' })
    }

    // Check if merchant already exists
    const existingMerchant = await MerchantService.getMerchantByWallet(walletAddress)
    if (existingMerchant) {
      return res.status(409).json({ 
        error: 'Merchant already registered with this wallet address' 
      })
    }

    // Create new merchant
    const merchant = await MerchantService.createMerchant({
      walletAddress,
      businessName,
      email,
      website,
      description,
      logoUrl
    })

    res.status(201).json({ 
      success: true, 
      merchant: {
        id: merchant.id,
        walletAddress: merchant.wallet_address,
        businessName: merchant.business_name,
        email: merchant.email,
        website: merchant.website,
        description: merchant.description,
        logoUrl: merchant.logo_url,
        isVerified: merchant.is_verified,
        createdAt: merchant.created_at,
        updatedAt: merchant.updated_at
      }
    })
  } catch (error) {
    console.error('Error registering merchant:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

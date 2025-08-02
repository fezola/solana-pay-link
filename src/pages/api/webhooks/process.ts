import { NextApiRequest, NextApiResponse } from 'next'
import { WebhookService } from '../../../lib/webhook-handler'

// API route to process pending webhooks
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify API key or authentication here if needed
    const authHeader = req.headers.authorization
    if (!authHeader || authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Process pending webhooks
    await WebhookService.processPendingWebhooks()

    res.status(200).json({ 
      success: true, 
      message: 'Webhooks processed successfully' 
    })
  } catch (error) {
    console.error('Error processing webhooks:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

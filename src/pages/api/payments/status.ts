import { NextApiRequest, NextApiResponse } from 'next'
import { InvoiceService, TransactionService } from '../../../lib/supabase-service'
import { PaymentMonitorService } from '../../../lib/webhook-handler'

// API route to update payment status
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { reference, status, transactionSignature, transactionDetails } = req.body

    if (!reference || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: reference and status' 
      })
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'expired']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      })
    }

    // Update invoice status
    const success = await InvoiceService.updateInvoiceStatus(
      reference,
      status,
      transactionSignature
    )

    if (!success) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // If transaction details provided, create transaction record
    if (transactionSignature && transactionDetails) {
      const invoice = await InvoiceService.getInvoiceByReference(reference)
      if (invoice) {
        await TransactionService.createTransaction({
          invoiceId: invoice.id,
          signature: transactionSignature,
          fromAddress: transactionDetails.fromAddress,
          toAddress: transactionDetails.toAddress,
          amount: transactionDetails.amount,
          tokenSymbol: transactionDetails.tokenSymbol,
          tokenMint: transactionDetails.tokenMint,
          blockTime: transactionDetails.blockTime ? new Date(transactionDetails.blockTime) : undefined,
          slot: transactionDetails.slot,
          fee: transactionDetails.fee
        })
      }
    }

    // Trigger webhook monitoring
    await PaymentMonitorService.monitorPayment(reference, transactionSignature)

    res.status(200).json({ 
      success: true, 
      message: 'Payment status updated successfully' 
    })
  } catch (error) {
    console.error('Error updating payment status:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

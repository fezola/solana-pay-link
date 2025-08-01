import { 
  Connection, 
  PublicKey, 
  ParsedTransactionWithMeta,
  ConfirmedSignatureInfo,
  GetVersionedTransactionConfig,
} from '@solana/web3.js';
import { 
  Invoice, 
  Transaction, 
  TransactionStatus, 
  InvoiceStatus,
  TOKEN_REGISTRY,
  SupportedToken 
} from '@/types/payment';
import { StorageService } from './storage';
import { fromTokenAmount } from './solana-pay';

export class TransactionMonitor {
  private connection: Connection;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  constructor(connection: Connection) {
    this.connection = connection;
  }

  // Start monitoring for new transactions
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Starting transaction monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      this.checkPendingInvoices();
    }, this.POLL_INTERVAL);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('⏹️ Stopped transaction monitoring');
  }

  // Check all pending invoices for payments
  private async checkPendingInvoices(): Promise<void> {
    const invoices = StorageService.getInvoices();
    const pendingInvoices = invoices.filter(inv => 
      inv.status === InvoiceStatus.CREATED || inv.status === InvoiceStatus.PENDING
    );

    for (const invoice of pendingInvoices) {
      try {
        await this.checkInvoicePayment(invoice);
      } catch (error) {
        console.error(`Error checking invoice ${invoice.id}:`, error);
      }
    }
  }

  // Check if a specific invoice has been paid
  async checkInvoicePayment(invoice: Invoice): Promise<boolean> {
    try {
      // Check if invoice has expired
      if (invoice.expiresAt && new Date() > invoice.expiresAt) {
        StorageService.updateInvoiceStatus(invoice.id, InvoiceStatus.EXPIRED);
        return false;
      }

      // Look for transactions involving the reference
      const signatures = await this.connection.getSignaturesForAddress(
        invoice.reference,
        { limit: 10 }
      );

      for (const signatureInfo of signatures) {
        const existingTx = StorageService.getTransactionBySignature(signatureInfo.signature);
        if (existingTx) continue; // Already processed

        const transaction = await this.connection.getParsedTransaction(
          signatureInfo.signature,
          { maxSupportedTransactionVersion: 0 }
        );

        if (transaction && this.isValidPayment(transaction, invoice)) {
          await this.processPayment(transaction, invoice, signatureInfo);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking invoice payment:', error);
      return false;
    }
  }

  // Validate if a transaction is a valid payment for the invoice
  private isValidPayment(
    transaction: ParsedTransactionWithMeta, 
    invoice: Invoice
  ): boolean {
    if (!transaction.meta || transaction.meta.err) {
      return false;
    }

    // Check if transaction involves the recipient
    const accountKeys = transaction.transaction.message.accountKeys.map(key => 
      typeof key === 'string' ? key : key.pubkey.toString()
    );
    
    if (!accountKeys.includes(invoice.recipient.toString())) {
      return false;
    }

    // For SOL payments, check native transfers
    if (invoice.token === 'SOL') {
      return this.validateSOLPayment(transaction, invoice);
    } else {
      return this.validateSPLPayment(transaction, invoice);
    }
  }

  // Validate SOL payment
  private validateSOLPayment(
    transaction: ParsedTransactionWithMeta,
    invoice: Invoice
  ): boolean {
    if (!transaction.meta) return false;

    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    const accountKeys = transaction.transaction.message.accountKeys;

    // Find recipient account index
    const recipientIndex = accountKeys.findIndex(key => 
      (typeof key === 'string' ? key : key.pubkey.toString()) === invoice.recipient.toString()
    );

    if (recipientIndex === -1) return false;

    // Calculate balance change
    const balanceChange = postBalances[recipientIndex] - preBalances[recipientIndex];
    const expectedLamports = invoice.amount * 1e9; // Convert SOL to lamports

    // Allow for small differences due to fees
    return Math.abs(balanceChange - expectedLamports) < 1000; // 0.000001 SOL tolerance
  }

  // Validate SPL token payment
  private validateSPLPayment(
    transaction: ParsedTransactionWithMeta,
    invoice: Invoice
  ): boolean {
    if (!transaction.meta || !transaction.meta.postTokenBalances) return false;

    const tokenInfo = TOKEN_REGISTRY[invoice.token];
    const expectedAmount = invoice.amount * Math.pow(10, tokenInfo.decimals);

    // Check token balance changes
    for (const tokenBalance of transaction.meta.postTokenBalances) {
      if (tokenBalance.mint === tokenInfo.mint.toString() &&
          tokenBalance.owner === invoice.recipient.toString()) {
        
        const preBalance = transaction.meta.preTokenBalances?.find(
          pre => pre.accountIndex === tokenBalance.accountIndex
        );
        
        const balanceChange = Number(tokenBalance.uiTokenAmount.amount) - 
                             Number(preBalance?.uiTokenAmount.amount || 0);
        
        // Allow for small differences
        return Math.abs(balanceChange - expectedAmount) < Math.pow(10, tokenInfo.decimals - 2);
      }
    }

    return false;
  }

  // Process a valid payment
  private async processPayment(
    transaction: ParsedTransactionWithMeta,
    invoice: Invoice,
    signatureInfo: ConfirmedSignatureInfo
  ): Promise<void> {
    try {
      // Extract customer wallet (sender)
      const customerWallet = this.extractCustomerWallet(transaction, invoice);
      
      // Create transaction record
      const txRecord: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceId: invoice.id,
        signature: signatureInfo.signature,
        amount: invoice.amount,
        token: invoice.token,
        from: customerWallet,
        to: invoice.recipient,
        status: signatureInfo.confirmationStatus === 'finalized' ? 
                TransactionStatus.FINALIZED : TransactionStatus.CONFIRMED,
        timestamp: new Date((signatureInfo.blockTime || Date.now() / 1000) * 1000),
        blockTime: signatureInfo.blockTime || undefined,
        slot: signatureInfo.slot,
        confirmations: signatureInfo.confirmationStatus === 'finalized' ? 32 : 1,
        fee: transaction.meta?.fee,
        memo: `Invoice: ${invoice.id}`,
      };

      // Save transaction
      StorageService.saveTransaction(txRecord);

      // Update invoice
      StorageService.updateInvoiceStatus(
        invoice.id, 
        InvoiceStatus.PAID, 
        signatureInfo.signature
      );

      // Update invoice with customer wallet
      const updatedInvoice = StorageService.getInvoice(invoice.id);
      if (updatedInvoice) {
        updatedInvoice.customerWallet = customerWallet;
        StorageService.saveInvoice(updatedInvoice);
      }

      console.log(`✅ Payment processed for invoice ${invoice.id}`);

      // Trigger webhook if configured
      if (invoice.webhookUrl) {
        this.triggerWebhook(invoice, txRecord);
      }

    } catch (error) {
      console.error('Error processing payment:', error);
    }
  }

  // Extract customer wallet from transaction
  private extractCustomerWallet(
    transaction: ParsedTransactionWithMeta,
    invoice: Invoice
  ): PublicKey {
    // The first signer is usually the customer
    const accountKeys = transaction.transaction.message.accountKeys;
    const firstSigner = accountKeys.find(key => 
      transaction.transaction.message.header.numRequiredSignatures > 0
    );
    
    if (firstSigner) {
      return new PublicKey(typeof firstSigner === 'string' ? firstSigner : firstSigner.pubkey);
    }
    
    // Fallback: find the account that's not the recipient
    for (const key of accountKeys) {
      const pubkey = typeof key === 'string' ? key : key.pubkey.toString();
      if (pubkey !== invoice.recipient.toString()) {
        return new PublicKey(pubkey);
      }
    }
    
    // Last resort: return the first account
    const firstKey = accountKeys[0];
    return new PublicKey(typeof firstKey === 'string' ? firstKey : firstKey.pubkey);
  }

  // Trigger webhook notification
  private async triggerWebhook(invoice: Invoice, transaction: Transaction): Promise<void> {
    if (!invoice.webhookUrl) return;

    try {
      const payload = {
        event: 'payment.completed',
        invoice,
        transaction,
        timestamp: new Date(),
      };

      await fetch(invoice.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SolPay-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      });

      console.log(`📡 Webhook sent for invoice ${invoice.id}`);
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  }

  // Get monitoring status
  getStatus(): { isMonitoring: boolean; pollInterval: number } {
    return {
      isMonitoring: this.isMonitoring,
      pollInterval: this.POLL_INTERVAL,
    };
  }
}

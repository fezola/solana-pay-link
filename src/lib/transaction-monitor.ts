import { Connection, PublicKey, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { 
  Invoice, 
  PaymentStatus, 
  updateInvoiceStatus, 
  getInvoiceByReference,
  amountToBaseUnits 
} from './payment-utils';
import BigNumber from 'bignumber.js';

export interface TransactionMonitorConfig {
  connection: Connection;
  pollInterval?: number; // milliseconds
  maxRetries?: number;
}

export interface PaymentConfirmation {
  invoice: Invoice;
  transactionSignature: string;
  customerWallet: PublicKey;
  actualAmount: BigNumber;
  blockTime: number;
}

export class TransactionMonitor {
  private connection: Connection;
  private pollInterval: number;
  private maxRetries: number;
  private _isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private callbacks: {
    onPaymentConfirmed?: (confirmation: PaymentConfirmation) => void;
    onPaymentFailed?: (invoice: Invoice, error: Error) => void;
  } = {};

  constructor(config: TransactionMonitorConfig) {
    this.connection = config.connection;
    this.pollInterval = config.pollInterval || 5000; // 5 seconds default
    this.maxRetries = config.maxRetries || 3;
  }

  // Getter for monitoring status
  get isMonitoring(): boolean {
    return this._isMonitoring;
  }

  // Set callback for payment confirmations
  onPaymentConfirmed(callback: (confirmation: PaymentConfirmation) => void): void {
    this.callbacks.onPaymentConfirmed = callback;
  }

  // Set callback for payment failures
  onPaymentFailed(callback: (invoice: Invoice, error: Error) => void): void {
    this.callbacks.onPaymentFailed = callback;
  }

  // Start monitoring for payments
  startMonitoring(): void {
    if (this._isMonitoring) return;

    this._isMonitoring = true;
    console.log('Starting transaction monitoring...');

    this.monitoringInterval = setInterval(() => {
      this.checkPendingPayments();
    }, this.pollInterval);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this._isMonitoring) return;

    this._isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('Stopped transaction monitoring');
  }

  // Check for payments for a specific invoice
  async checkInvoicePayment(invoice: Invoice): Promise<PaymentConfirmation | null> {
    try {
      // Get recent transactions for the reference account
      const signatures = await this.connection.getSignaturesForAddress(
        invoice.reference,
        { limit: 10 }
      );

      for (const signatureInfo of signatures) {
        const transaction = await this.connection.getParsedTransaction(
          signatureInfo.signature,
          { commitment: 'confirmed' }
        );

        if (transaction && transaction.meta && !transaction.meta.err) {
          const confirmation = await this.validatePayment(invoice, transaction, signatureInfo.signature);
          if (confirmation) {
            return confirmation;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking invoice payment:', error);
      throw error;
    }
  }

  // Validate if a transaction is a valid payment for an invoice
  private async validatePayment(
    invoice: Invoice,
    transaction: ParsedTransactionWithMeta,
    signature: string
  ): Promise<PaymentConfirmation | null> {
    try {
      const { meta, transaction: tx, blockTime } = transaction;
      
      if (!meta || !tx.message || !blockTime) return null;

      // Check if reference is in the instruction
      const hasReference = this.checkReferenceInTransaction(invoice.reference, transaction);
      if (!hasReference) return null;

      let customerWallet: PublicKey | null = null;
      let actualAmount: BigNumber | null = null;

      if (invoice.token === 'SOL') {
        // Handle SOL payments
        const result = this.validateSOLPayment(invoice, transaction);
        if (result) {
          customerWallet = result.customerWallet;
          actualAmount = result.actualAmount;
        }
      } else {
        // Handle SPL token payments
        const result = this.validateSPLTokenPayment(invoice, transaction);
        if (result) {
          customerWallet = result.customerWallet;
          actualAmount = result.actualAmount;
        }
      }

      if (customerWallet && actualAmount) {
        // Check if amount is sufficient (allow for small differences due to fees)
        const expectedAmount = amountToBaseUnits(invoice.amount, invoice.token);
        const tolerance = expectedAmount.multipliedBy(0.01); // 1% tolerance
        
        if (actualAmount.gte(expectedAmount.minus(tolerance))) {
          return {
            invoice,
            transactionSignature: signature,
            customerWallet,
            actualAmount,
            blockTime
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error validating payment:', error);
      return null;
    }
  }

  // Check if reference is included in transaction
  private checkReferenceInTransaction(reference: PublicKey, transaction: ParsedTransactionWithMeta): boolean {
    const { transaction: tx } = transaction;
    
    // Check in account keys
    const accountKeys = tx.message.accountKeys.map(key => 
      typeof key === 'string' ? key : key.pubkey.toString()
    );
    
    if (accountKeys.includes(reference.toString())) {
      return true;
    }

    // Check in instructions
    for (const instruction of tx.message.instructions) {
      if ('accounts' in instruction) {
        const accounts = instruction.accounts;
        if (accounts && accounts.includes(reference.toString())) {
          return true;
        }
      }
    }

    return false;
  }

  // Validate SOL payment
  private validateSOLPayment(
    invoice: Invoice,
    transaction: ParsedTransactionWithMeta
  ): { customerWallet: PublicKey; actualAmount: BigNumber } | null {
    const { meta } = transaction;
    if (!meta) return null;

    // Find the transfer to the recipient
    const recipientIndex = transaction.transaction.message.accountKeys.findIndex(
      key => (typeof key === 'string' ? key : key.pubkey.toString()) === invoice.recipient.toString()
    );

    if (recipientIndex === -1) return null;

    const preBalance = meta.preBalances[recipientIndex];
    const postBalance = meta.postBalances[recipientIndex];
    const actualAmount = new BigNumber(postBalance - preBalance);

    if (actualAmount.gt(0)) {
      // Find the sender (first account that decreased in balance)
      for (let i = 0; i < meta.preBalances.length; i++) {
        const balanceChange = meta.postBalances[i] - meta.preBalances[i];
        if (balanceChange < 0) {
          const customerWallet = new PublicKey(
            typeof transaction.transaction.message.accountKeys[i] === 'string' 
              ? transaction.transaction.message.accountKeys[i] as string
              : transaction.transaction.message.accountKeys[i].pubkey.toString()
          );
          return { customerWallet, actualAmount };
        }
      }
    }

    return null;
  }

  // Validate SPL token payment
  private validateSPLTokenPayment(
    invoice: Invoice,
    transaction: ParsedTransactionWithMeta
  ): { customerWallet: PublicKey; actualAmount: BigNumber } | null {
    const { meta } = transaction;
    if (!meta || !meta.preTokenBalances || !meta.postTokenBalances) return null;

    // Find token transfers to the recipient
    for (const postBalance of meta.postTokenBalances) {
      if (postBalance.mint === invoice.splToken?.toString()) {
        const preBalance = meta.preTokenBalances.find(
          pre => pre.accountIndex === postBalance.accountIndex
        );

        if (preBalance) {
          const preAmount = new BigNumber(preBalance.uiTokenAmount.amount);
          const postAmount = new BigNumber(postBalance.uiTokenAmount.amount);
          const actualAmount = postAmount.minus(preAmount);

          if (actualAmount.gt(0)) {
            // Find the sender
            for (const preTokenBalance of meta.preTokenBalances) {
              if (preTokenBalance.mint === invoice.splToken?.toString()) {
                const correspondingPost = meta.postTokenBalances.find(
                  post => post.accountIndex === preTokenBalance.accountIndex
                );

                if (correspondingPost) {
                  const senderPreAmount = new BigNumber(preTokenBalance.uiTokenAmount.amount);
                  const senderPostAmount = new BigNumber(correspondingPost.uiTokenAmount.amount);
                  
                  if (senderPreAmount.gt(senderPostAmount)) {
                    const customerWallet = new PublicKey(
                      typeof transaction.transaction.message.accountKeys[preTokenBalance.accountIndex] === 'string'
                        ? transaction.transaction.message.accountKeys[preTokenBalance.accountIndex] as string
                        : transaction.transaction.message.accountKeys[preTokenBalance.accountIndex].pubkey.toString()
                    );
                    return { customerWallet, actualAmount };
                  }
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  // Check all pending payments
  private async checkPendingPayments(): Promise<void> {
    try {
      // This would typically get pending invoices from storage
      // For now, we'll implement a simple check
      console.log('Checking pending payments...');
      
      // In a real implementation, you would:
      // 1. Get all pending invoices from storage
      // 2. Check each one for payments
      // 3. Update status and trigger callbacks
      
    } catch (error) {
      console.error('Error checking pending payments:', error);
    }
  }
}

// Create a singleton instance
let monitorInstance: TransactionMonitor | null = null;

export function getTransactionMonitor(connection: Connection): TransactionMonitor {
  if (!monitorInstance) {
    monitorInstance = new TransactionMonitor({ connection });
  }
  return monitorInstance;
}

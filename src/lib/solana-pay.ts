import { 
  PublicKey, 
  Keypair, 
  Connection, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import { 
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { encodeURL, TransferRequestURLFields } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { 
  Invoice, 
  SupportedToken, 
  TOKEN_REGISTRY, 
  PaymentFormData,
  InvoiceStatus 
} from '@/types/payment';

// Generate a unique reference for tracking payments
export function generateReference(): PublicKey {
  return Keypair.generate().publicKey;
}

// Generate a unique invoice ID
export function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a Solana Pay URL with reference for tracking
export async function createSolanaPayURL(
  recipient: PublicKey,
  amount: number,
  token: SupportedToken,
  reference: PublicKey,
  label: string,
  message?: string,
  memo?: string
): Promise<string> {
  const tokenInfo = TOKEN_REGISTRY[token];
  
  const urlFields: TransferRequestURLFields = {
    recipient,
    amount: new BigNumber(amount),
    reference,
    label,
    message,
    memo,
  };

  // Add SPL token mint if not SOL
  if (!tokenInfo.isNative) {
    urlFields.splToken = tokenInfo.mint;
  }

  const url = encodeURL(urlFields);
  return url.toString();
}

// Create an invoice from form data
export async function createInvoice(formData: PaymentFormData): Promise<Invoice> {
  const reference = generateReference();
  const invoiceId = generateInvoiceId();
  const recipient = new PublicKey(formData.recipientWallet);
  
  const invoice: Invoice = {
    id: invoiceId,
    reference,
    merchantId: 'default', // Will be replaced with actual merchant ID
    recipient,
    amount: parseFloat(formData.amount),
    token: formData.token,
    title: formData.title,
    description: formData.description,
    status: InvoiceStatus.CREATED,
    paymentUrl: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: formData.expiresIn ? 
      new Date(Date.now() + formData.expiresIn * 60 * 60 * 1000) : 
      undefined,
    webhookUrl: formData.webhookUrl,
    metadata: formData.metadata,
  };

  // Generate payment URL
  invoice.paymentUrl = await createSolanaPayURL(
    recipient,
    invoice.amount,
    invoice.token,
    reference,
    invoice.title,
    invoice.description,
    `Invoice: ${invoiceId}`
  );

  return invoice;
}

// Convert amount to token's base units (considering decimals)
export function toTokenAmount(amount: number, token: SupportedToken): number {
  const tokenInfo = TOKEN_REGISTRY[token];
  return Math.floor(amount * Math.pow(10, tokenInfo.decimals));
}

// Convert from token's base units to human readable amount
export function fromTokenAmount(amount: number, token: SupportedToken): number {
  const tokenInfo = TOKEN_REGISTRY[token];
  return amount / Math.pow(10, tokenInfo.decimals);
}

// Create a transfer transaction for SOL
export async function createSOLTransferTransaction(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  amount: number,
  reference: PublicKey,
  memo?: string
): Promise<Transaction> {
  const lamports = amount * LAMPORTS_PER_SOL;
  
  const transaction = new Transaction();
  
  // Add transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    })
  );

  // Add reference instruction for tracking
  transaction.add(
    new TransactionInstruction({
      keys: [{ pubkey: reference, isSigner: false, isWritable: false }],
      data: Buffer.alloc(0),
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    })
  );

  // Add memo if provided
  if (memo) {
    transaction.add(
      new TransactionInstruction({
        keys: [{ pubkey: from, isSigner: true, isWritable: false }],
        data: Buffer.from(memo, 'utf8'),
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      })
    );
  }

  return transaction;
}

// Create a transfer transaction for SPL tokens
export async function createSPLTransferTransaction(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  amount: number,
  token: SupportedToken,
  reference: PublicKey,
  memo?: string
): Promise<Transaction> {
  const tokenInfo = TOKEN_REGISTRY[token];
  const tokenAmount = toTokenAmount(amount, token);
  
  const transaction = new Transaction();
  
  // Get associated token addresses
  const fromTokenAccount = await getAssociatedTokenAddress(
    tokenInfo.mint,
    from
  );
  
  const toTokenAccount = await getAssociatedTokenAddress(
    tokenInfo.mint,
    to
  );

  // Add SPL token transfer instruction
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      from,
      tokenAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Add reference instruction for tracking
  transaction.add(
    new TransactionInstruction({
      keys: [{ pubkey: reference, isSigner: false, isWritable: false }],
      data: Buffer.alloc(0),
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    })
  );

  // Add memo if provided
  if (memo) {
    transaction.add(
      new TransactionInstruction({
        keys: [{ pubkey: from, isSigner: true, isWritable: false }],
        data: Buffer.from(memo, 'utf8'),
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      })
    );
  }

  return transaction;
}

// Validate a Solana wallet address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Format token amount for display
export function formatTokenAmount(amount: number, token: SupportedToken): string {
  const tokenInfo = TOKEN_REGISTRY[token];
  
  if (token === 'SOL') {
    return `${amount.toFixed(4)} SOL`;
  }
  
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M ${tokenInfo.symbol}`;
  }
  
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K ${tokenInfo.symbol}`;
  }
  
  return `${amount.toFixed(tokenInfo.decimals)} ${tokenInfo.symbol}`;
}

// Get checkout URL for an invoice
export function getCheckoutURL(invoice: Invoice, baseUrl: string = window.location.origin): string {
  const params = new URLSearchParams({
    amount: invoice.amount.toString(),
    recipient: invoice.recipient.toString(),
    reference: invoice.reference.toString(),
    'spl-token': invoice.token === 'SOL' ? '' : TOKEN_REGISTRY[invoice.token].mint.toString(),
    label: invoice.title,
    message: invoice.description || '',
    memo: `Invoice: ${invoice.id}`,
  });

  return `${baseUrl}/checkout?${params.toString()}`;
}

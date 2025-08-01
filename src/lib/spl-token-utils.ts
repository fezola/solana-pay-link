import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from '@solana/spl-token';
import BigNumber from 'bignumber.js';
import { SPL_TOKENS } from './payment-utils';

export interface TokenTransferParams {
  connection: Connection;
  fromWallet: PublicKey;
  toWallet: PublicKey;
  mint: PublicKey;
  amount: BigNumber;
  decimals: number;
}

export interface SOLTransferParams {
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount: BigNumber; // in SOL
}

// Create SOL transfer instruction
export function createSOLTransferInstruction(params: SOLTransferParams) {
  const lamports = params.amount.multipliedBy(LAMPORTS_PER_SOL).toNumber();
  
  return SystemProgram.transfer({
    fromPubkey: params.fromWallet,
    toPubkey: params.toWallet,
    lamports,
  });
}

// Create SPL token transfer instruction
export async function createSPLTokenTransferInstruction(params: TokenTransferParams) {
  const { connection, fromWallet, toWallet, mint, amount, decimals } = params;

  console.log('Creating SPL token transfer:', {
    fromWallet: fromWallet.toString(),
    toWallet: toWallet.toString(),
    mint: mint.toString(),
    amount: amount.toString(),
    decimals
  });

  // Calculate the amount in base units
  const baseAmount = amount.multipliedBy(new BigNumber(10).pow(decimals));
  console.log('Base amount:', baseAmount.toString());

  // Get associated token addresses
  const fromTokenAccount = await getAssociatedTokenAddress(mint, fromWallet);
  const toTokenAccount = await getAssociatedTokenAddress(mint, toWallet);

  console.log('Token accounts:', {
    from: fromTokenAccount.toString(),
    to: toTokenAccount.toString()
  });

  const instructions = [];

  // Check if sender's token account exists
  try {
    const fromAccount = await getAccount(connection, fromTokenAccount);
    console.log('From account balance:', fromAccount.amount.toString());
  } catch (error) {
    console.error('From token account not found:', error);
    throw new Error(`You don't have a token account for this token. Please get some tokens first.`);
  }

  // Check if recipient's token account exists, create if not
  try {
    await getAccount(connection, toTokenAccount);
    console.log('To account exists');
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
      console.log('Creating recipient token account');
      // Create associated token account for recipient
      instructions.push(
        createAssociatedTokenAccountInstruction(
          fromWallet, // payer
          toTokenAccount, // associated token account
          toWallet, // owner
          mint // mint
        )
      );
    } else {
      console.error('Error checking recipient account:', error);
      throw error;
    }
  }

  // Create transfer instruction
  instructions.push(
    createTransferInstruction(
      fromTokenAccount, // source
      toTokenAccount, // destination
      fromWallet, // owner
      baseAmount.toNumber() // amount
    )
  );

  console.log('Created', instructions.length, 'instructions');
  return instructions;
}

// Get token balance for a wallet
export async function getTokenBalance(
  connection: Connection,
  wallet: PublicKey,
  mint: PublicKey
): Promise<BigNumber> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(mint, wallet);
    const account = await getAccount(connection, tokenAccount);
    return new BigNumber(account.amount.toString());
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return new BigNumber(0);
    }
    throw error;
  }
}

// Get SOL balance for a wallet
export async function getSOLBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<BigNumber> {
  const balance = await connection.getBalance(wallet);
  return new BigNumber(balance).dividedBy(LAMPORTS_PER_SOL);
}

// Check if wallet has sufficient balance for payment
export async function checkSufficientBalance(
  connection: Connection,
  wallet: PublicKey,
  token: string,
  amount: BigNumber
): Promise<{ sufficient: boolean; balance: BigNumber; required: BigNumber }> {
  let balance: BigNumber;
  let required = amount;

  if (token === 'SOL') {
    balance = await getSOLBalance(connection, wallet);
    // Add some buffer for transaction fees (0.001 SOL)
    required = amount.plus(0.001);
  } else {
    const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
    if (!tokenInfo || !tokenInfo.mint) {
      throw new Error(`Unsupported token: ${token}`);
    }
    
    const rawBalance = await getTokenBalance(connection, wallet, tokenInfo.mint);
    balance = rawBalance.dividedBy(new BigNumber(10).pow(tokenInfo.decimals));
  }

  return {
    sufficient: balance.gte(required),
    balance,
    required
  };
}

// Create complete payment transaction
export async function createPaymentTransaction(
  connection: Connection,
  fromWallet: PublicKey,
  toWallet: PublicKey,
  token: string,
  amount: BigNumber,
  reference?: PublicKey,
  memo?: string
): Promise<Transaction> {
  console.log('Creating payment transaction:', {
    token,
    amount: amount.toString(),
    from: fromWallet.toString().slice(0, 8) + '...',
    to: toWallet.toString().slice(0, 8) + '...'
  });

  const transaction = new Transaction();

  try {
    // Add payment instruction
    if (token === 'SOL') {
      const instruction = createSOLTransferInstruction({
        fromWallet,
        toWallet,
        amount
      });
      transaction.add(instruction);
    } else {
      const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
      if (!tokenInfo || !tokenInfo.mint) {
        throw new Error(`Unsupported token: ${token}`);
      }

      console.log('Using token info:', tokenInfo);

      const instructions = await createSPLTokenTransferInstruction({
        connection,
        fromWallet,
        toWallet,
        mint: tokenInfo.mint,
        amount,
        decimals: tokenInfo.decimals
      });

      instructions.forEach(instruction => transaction.add(instruction));
    }

    // Add reference if provided (memo instruction) - but let's skip this for now to debug
    // if (reference) {
    //   const memoInstruction = {
    //     keys: [{ pubkey: reference, isSigner: false, isWritable: false }],
    //     programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    //     data: Buffer.from(memo || 'Solana Pay', 'utf8')
    //   };
    //   transaction.add(memoInstruction);
    // }

    console.log('Transaction created with', transaction.instructions.length, 'instructions');
    return transaction;

  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
}

// Validate token mint address
export function validateTokenMint(token: string): { isValid: boolean; mint?: PublicKey; decimals?: number } {
  if (token === 'SOL') {
    return { isValid: true };
  }

  const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
  if (!tokenInfo || !tokenInfo.mint) {
    return { isValid: false };
  }

  return {
    isValid: true,
    mint: tokenInfo.mint,
    decimals: tokenInfo.decimals
  };
}

// Format token amount for display
export function formatTokenAmount(amount: BigNumber, token: string, includeSymbol: boolean = true): string {
  const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
  if (!tokenInfo) {
    return amount.toString();
  }

  const formatted = amount.toFixed(Math.min(tokenInfo.decimals, 6)); // Max 6 decimal places for display
  return includeSymbol ? `${formatted} ${tokenInfo.symbol}` : formatted;
}

// Convert display amount to base units
export function toBaseUnits(amount: BigNumber, token: string): BigNumber {
  if (token === 'SOL') {
    return amount.multipliedBy(LAMPORTS_PER_SOL);
  }

  const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
  if (!tokenInfo) {
    throw new Error(`Unsupported token: ${token}`);
  }

  return amount.multipliedBy(new BigNumber(10).pow(tokenInfo.decimals));
}

// Convert base units to display amount
export function fromBaseUnits(amount: BigNumber, token: string): BigNumber {
  if (token === 'SOL') {
    return amount.dividedBy(LAMPORTS_PER_SOL);
  }

  const tokenInfo = SPL_TOKENS[token as keyof typeof SPL_TOKENS];
  if (!tokenInfo) {
    throw new Error(`Unsupported token: ${token}`);
  }

  return amount.dividedBy(new BigNumber(10).pow(tokenInfo.decimals));
}

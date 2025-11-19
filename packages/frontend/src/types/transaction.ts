export type TransactionType = 'swap' | 'add_liquidity' | 'remove_liquidity';

export interface Transaction {
  id: string;
  type: TransactionType;
  timestamp: number;
  hash?: string;

  // Swap details
  fromToken?: 'SEED' | 'USDC';
  toToken?: 'SEED' | 'USDC';
  fromAmount?: string;
  toAmount?: string;

  // Liquidity details
  seedAmount?: string;
  usdcAmount?: string;
  lpAmount?: string;

  status: 'pending' | 'success' | 'failed';
}

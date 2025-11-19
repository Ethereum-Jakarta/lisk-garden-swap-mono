import { liskSepolia } from 'panna-sdk';
import { getContract } from 'thirdweb/contract';
import { getContractEvents } from 'thirdweb';
import { Transaction } from '../types/transaction';

// Event definitions
const swapEvent = {
  type: 'event',
  name: 'Swap',
  inputs: [
    { name: 'user', type: 'address', indexed: true, internalType: 'address' },
    { name: 'amountAIn', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'amountBIn', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'amountAOut', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'amountBOut', type: 'uint256', indexed: false, internalType: 'uint256' },
  ],
} as const;

const liquidityAddedEvent = {
  type: 'event',
  name: 'LiquidityAdded',
  inputs: [
    { name: 'provider', type: 'address', indexed: true, internalType: 'address' },
    { name: 'amountA', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'amountB', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'liquidity', type: 'uint256', indexed: false, internalType: 'uint256' },
  ],
} as const;

const liquidityRemovedEvent = {
  type: 'event',
  name: 'LiquidityRemoved',
  inputs: [
    { name: 'provider', type: 'address', indexed: true, internalType: 'address' },
    { name: 'amountA', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'amountB', type: 'uint256', indexed: false, internalType: 'uint256' },
    { name: 'liquidity', type: 'uint256', indexed: false, internalType: 'uint256' },
  ],
} as const;

export async function fetchTransactionHistory(
  client: any,
  dexAddress: string,
  userAddress: string
): Promise<Transaction[]> {
  try {
    const contract = getContract({
      client,
      chain: liskSepolia,
      address: dexAddress,
    });

    // Get current block and calculate fromBlock
    const rpc = client.getRpcClient();
    const currentBlock = await rpc.getBlockNumber();
    const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

    const transactions: Transaction[] = [];

    // Fetch Swap events
    try {
      const swapEvents = await getContractEvents({
        contract,
        events: [swapEvent],
        fromBlock,
      });

      swapEvents.forEach((event: any) => {
        const { user, amountAIn, amountBIn, amountAOut, amountBOut } = event.args;

        // Filter by user address
        if (user.toLowerCase() !== userAddress.toLowerCase()) return;

        const isAtoB = amountAIn > 0n;
        transactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'swap',
          timestamp: Number(event.blockNumber) * 1000, // Approximate timestamp
          hash: event.transactionHash,
          fromToken: isAtoB ? 'SEED' : 'USDC',
          toToken: isAtoB ? 'USDC' : 'SEED',
          fromAmount: isAtoB
            ? (Number(amountAIn) / 1e18).toFixed(6)
            : (Number(amountBIn) / 1e6).toFixed(6),
          toAmount: isAtoB
            ? (Number(amountBOut) / 1e6).toFixed(6)
            : (Number(amountAOut) / 1e18).toFixed(6),
          status: 'success',
        });
      });
    } catch (error) {
      console.error('Error fetching swap events:', error);
    }

    // Fetch LiquidityAdded events
    try {
      const addEvents = await getContractEvents({
        contract,
        events: [liquidityAddedEvent],
        fromBlock,
      });

      addEvents.forEach((event: any) => {
        const { provider, amountA, amountB, liquidity } = event.args;

        if (provider.toLowerCase() !== userAddress.toLowerCase()) return;

        transactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'add_liquidity',
          timestamp: Number(event.blockNumber) * 1000,
          hash: event.transactionHash,
          seedAmount: (Number(amountA) / 1e18).toFixed(6),
          usdcAmount: (Number(amountB) / 1e6).toFixed(6),
          lpAmount: (Number(liquidity) / 1e18).toFixed(6),
          status: 'success',
        });
      });
    } catch (error) {
      console.error('Error fetching liquidity added events:', error);
    }

    // Fetch LiquidityRemoved events
    try {
      const removeEvents = await getContractEvents({
        contract,
        events: [liquidityRemovedEvent],
        fromBlock,
      });

      removeEvents.forEach((event: any) => {
        const { provider, amountA, amountB, liquidity } = event.args;

        if (provider.toLowerCase() !== userAddress.toLowerCase()) return;

        transactions.push({
          id: `${event.transactionHash}-${event.logIndex}`,
          type: 'remove_liquidity',
          timestamp: Number(event.blockNumber) * 1000,
          hash: event.transactionHash,
          lpAmount: (Number(liquidity) / 1e18).toFixed(6),
          seedAmount: (Number(amountA) / 1e18).toFixed(6),
          usdcAmount: (Number(amountB) / 1e6).toFixed(6),
          status: 'success',
        });
      });
    } catch (error) {
      console.error('Error fetching liquidity removed events:', error);
    }

    // Sort by block number (newest first)
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching transaction history from blockchain:', error);
    return [];
  }
}

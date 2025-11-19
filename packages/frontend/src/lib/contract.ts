import { liskSepolia } from 'panna-sdk';
import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb/transaction';
import { getContract } from 'thirdweb/contract';
import { simpleDexABI } from './simple-dex-abi';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
] as const;

// READ FUNCTIONS
export async function getPoolInfo(client: any, dexAddress: string) {
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: dexAddress,
  });

  const result = await readContract({
    contract,
    method: 'function getPoolInfo() view returns (uint256 _reserveA, uint256 _reserveB, uint256 _totalLiquidity, uint256 _price)',
    params: [],
  });

  return {
    reserveA: BigInt(result[0]),
    reserveB: BigInt(result[1]),
    totalLiquidity: BigInt(result[2]),
    price: BigInt(result[3]),
  };
}

export async function getAmountOut(
  client: any,
  dexAddress: string,
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): Promise<bigint> {
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: dexAddress,
  });

  const result = await readContract({
    contract,
    method: 'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256 amountOut)',
    params: [amountIn, reserveIn, reserveOut],
  });

  return BigInt(result);
}

export async function getTokenBalance(client: any, tokenAddress: string, userAddress: string): Promise<bigint> {
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: tokenAddress,
  });

  const result = await readContract({
    contract,
    method: 'function balanceOf(address account) view returns (uint256)',
    params: [userAddress],
  });

  return BigInt(result);
}

// WRITE FUNCTIONS
export async function approveToken(
  client: any,
  account: any,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: tokenAddress,
    }),
    method: 'function approve(address spender, uint256 amount) external returns (bool)',
    params: [spenderAddress, amount],
  });

  const result = await sendTransaction({
    account,
    transaction: tx,
  });

  await waitForReceipt(result);
  return result;
}

export async function swapAforB(client: any, account: any, dexAddress: string, amountAIn: bigint, minAmountBOut: bigint) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: dexAddress,
    }),
    method: 'function swapAforB(uint256 amountAIn, uint256 minAmountBOut) external',
    params: [amountAIn, minAmountBOut],
  });

  const result = await sendTransaction({
    account,
    transaction: tx,
  });

  await waitForReceipt(result);
  return result;
}

export async function swapBforA(client: any, account: any, dexAddress: string, amountBIn: bigint, minAmountAOut: bigint) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: dexAddress,
    }),
    method: 'function swapBforA(uint256 amountBIn, uint256 minAmountAOut) external',
    params: [amountBIn, minAmountAOut],
  });

  const result = await sendTransaction({
    account,
    transaction: tx,
  });

  await waitForReceipt(result);
  return result;
}

// LIQUIDITY FUNCTIONS

export async function getLPBalance(client: any, dexAddress: string, userAddress: string): Promise<bigint> {
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: dexAddress,
  });

  const result = await readContract({
    contract,
    method: 'function balanceOf(address account) view returns (uint256)',
    params: [userAddress],
  });

  return BigInt(result);
}

export async function addLiquidity(
  client: any,
  account: any,
  dexAddress: string,
  amountA: bigint,
  amountB: bigint
) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: dexAddress,
    }),
    method: 'function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 liquidity)',
    params: [amountA, amountB],
  });

  const result = await sendTransaction({
    account,
    transaction: tx,
  });

  await waitForReceipt(result);
  return result;
}

export async function removeLiquidity(
  client: any,
  account: any,
  dexAddress: string,
  liquidity: bigint
) {
  const tx = prepareContractCall({
    contract: getContract({
      client,
      chain: liskSepolia,
      address: dexAddress,
    }),
    method: 'function removeLiquidity(uint256 liquidity) external returns (uint256 amountA, uint256 amountB)',
    params: [liquidity],
  });

  const result = await sendTransaction({
    account,
    transaction: tx,
  });

  await waitForReceipt(result);
  return result;
}

import { useState, useEffect } from 'react';
import { ArrowDownUp, Loader2, AlertCircle } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { getPoolInfo, getAmountOut, getTokenBalance, approveToken, swapAforB, swapBforA } from '../lib/contract';
import { SeedIcon, UsdcIcon } from './TokenIcons';

export function SwapInterface() {
  const { client, account, isConnected, address, dexAddress, seedTokenAddress, usdcTokenAddress } = useContract();

  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [direction, setDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [poolInfo, setPoolInfo] = useState<{
    reserveA: bigint;
    reserveB: bigint;
    totalLiquidity: bigint;
    price: bigint;
} | null>(null);
  const [seedBalance, setSeedBalance] = useState<bigint>(0n);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);

  // Fetch data
  useEffect(() => {
    if (!client || !address || !dexAddress) return;

    const fetchData = async () => {
      try {
        const pool = await getPoolInfo(client, dexAddress);
        setPoolInfo(pool);

        const seed = await getTokenBalance(client, seedTokenAddress, address);
        const usdc = await getTokenBalance(client, usdcTokenAddress, address);

        setSeedBalance(seed);
        setUsdcBalance(usdc);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [client, address, dexAddress, seedTokenAddress, usdcTokenAddress]);

  // Calculate output with debouncing
  useEffect(() => {
    if (!amountIn || !poolInfo || !client || !dexAddress) {
      setAmountOut('');
      return;
    }

    let cancelled = false;

    // Debounce: wait 300ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const input = direction === 'AtoB'
          ? BigInt(Math.floor(parseFloat(amountIn) * 1e18))
          : BigInt(Math.floor(parseFloat(amountIn) * 1e6));

        const output = await getAmountOut(
          client,
          dexAddress,
          input,
          direction === 'AtoB' ? poolInfo.reserveA : poolInfo.reserveB,
          direction === 'AtoB' ? poolInfo.reserveB : poolInfo.reserveA
        );

        // Only update if not cancelled
        if (!cancelled) {
          setAmountOut(
            direction === 'AtoB'
              ? (Number(output) / 1e6).toFixed(6)
              : (Number(output) / 1e18).toFixed(6)
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error calculating output:', error);
        }
      }
    }, 300);

    // Cleanup: cancel previous timeout and mark as cancelled
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [amountIn, direction, poolInfo, client, dexAddress]);

  const handleSwap = async () => {
    if (!client || !account || !amountIn) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Approve
      setApproving(true);
      const tokenAddress = direction === 'AtoB' ? seedTokenAddress : usdcTokenAddress;
      const amountToApprove = direction === 'AtoB'
        ? BigInt(Math.floor(parseFloat(amountIn) * 1e18))
        : BigInt(Math.floor(parseFloat(amountIn) * 1e6));

      await approveToken(client, account, tokenAddress, dexAddress, amountToApprove);
      setApproving(false);

      // 2. Swap with 1% slippage
      setSwapping(true);
      const minOutput = direction === 'AtoB'
        ? BigInt(Math.floor(parseFloat(amountOut) * 0.99 * 1e6))
        : BigInt(Math.floor(parseFloat(amountOut) * 0.99 * 1e18));

      if (direction === 'AtoB') {
        await swapAforB(client, account, dexAddress, amountToApprove, minOutput);
      } else {
        await swapBforA(client, account, dexAddress, amountToApprove, minOutput);
      }

      setSuccess(`Swapped successfully! ${amountIn} ${direction === 'AtoB' ? 'SEED' : 'USDC'} → ${amountOut} ${direction === 'AtoB' ? 'USDC' : 'SEED'}`);
      setAmountIn('');
      setAmountOut('');
    } catch (error) {
      console.error('Swap error:', error);
      // @ts-expect-error message
      setError(error.message || 'Swap failed. Please try again.');
    } finally {
      setLoading(false);
      setApproving(false);
      setSwapping(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-[color:var(--card)] rounded-2xl shadow-lg text-center animate-slide-in-up">
        <Sprout className="w-16 h-16 mx-auto mb-4 text-[color:var(--primary)] animate-float" />
        <h2 className="text-2xl font-bold mb-2 text-[color:var(--foreground)]">Welcome to Garden DEX</h2>
        <p className="text-[color:var(--muted-foreground)] mb-6">
          Connect your wallet to start swapping SEED tokens
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 animate-slide-in-up">
      {/* Main Card */}
      <div className="bg-[color:var(--card)] rounded-2xl shadow-lg p-6 border border-[color:var(--border)]">
        <h2 className="text-2xl font-bold mb-6 text-[color:var(--foreground)]">Swap Tokens</h2>

        {/* From */}
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2 text-[color:var(--muted-foreground)]">From</label>
          <div className="p-4 bg-[color:var(--muted)] rounded-xl">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold outline-none text-[color:var(--foreground)]"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                {direction === 'AtoB' ? <SeedIcon className="w-5 h-5" /> : <UsdcIcon className="w-5 h-5" />}
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  {direction === 'AtoB' ? 'SEED' : 'USDC'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  Balance: {direction === 'AtoB'
                    ? (Number(seedBalance) / 1e18).toFixed(4)
                    : (Number(usdcBalance) / 1e6).toFixed(2)
                  }
                </span>
                <button
                  onClick={() => {
                    const maxAmount = direction === 'AtoB'
                      ? (Number(seedBalance) / 1e18).toString()
                      : (Number(usdcBalance) / 1e6).toString();
                    setAmountIn(maxAmount);
                  }}
                  className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--accent)] transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-2">
          <button
            onClick={() => setDirection(direction === 'AtoB' ? 'BtoA' : 'AtoB')}
            className="p-2 rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--accent)] transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 transform duration-200"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* To */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-[color:var(--muted-foreground)]">To (estimated)</label>
          <div className="p-4 bg-[color:var(--muted)] rounded-xl">
            <input
              type="text"
              value={amountOut}
              readOnly
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold outline-none text-[color:var(--foreground)]"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                {direction === 'AtoB' ? <UsdcIcon className="w-5 h-5" /> : <SeedIcon className="w-5 h-5" />}
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  {direction === 'AtoB' ? 'USDC' : 'SEED'}
                </span>
              </div>
              <span className="text-sm text-[color:var(--muted-foreground)]">
                Balance: {direction === 'AtoB'
                  ? (Number(usdcBalance) / 1e6).toFixed(2)
                  : (Number(seedBalance) / 1e18).toFixed(4)
                }
              </span>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!amountIn || loading || !poolInfo}
          className="w-full py-4 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-[color:var(--primary-foreground)] rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 transform"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {approving ? 'Approving...' : swapping ? 'Swapping...' : 'Processing...'}
            </span>
          ) : (
            'Swap'
          )}
        </button>

        {/* Pool Info */}
        {poolInfo && (
          <div className="mt-6 p-4 bg-[color:var(--muted)] rounded-xl">
            <h3 className="text-sm font-semibold mb-2 text-[color:var(--foreground)]">Pool Info</h3>
            <div className="space-y-1 text-sm text-[color:var(--muted-foreground)]">
              <div className="flex justify-between">
                <span>Reserve A (SEED):</span>
                <span className="font-medium">{(Number(poolInfo.reserveA) / 1e18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Reserve B (USDC):</span>
                <span className="font-medium">{(Number(poolInfo.reserveB) / 1e6).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-medium">{(Number(poolInfo.price) / 1e6).toFixed(6)} USDC per SEED</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sprout(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

import { useState, useEffect } from 'react';
import { Droplets, Loader2, AlertCircle, Info } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import {
  getPoolInfo,
  getTokenBalance,
  getLPBalance,
  approveToken,
  addLiquidity,
  removeLiquidity,
} from '../lib/contract';
import { SeedIcon, UsdcIcon, LpTokenIcon } from './TokenIcons';

type Tab = 'add' | 'remove';

export function LiquidityInterface() {
  const { client, account, isConnected, address, dexAddress, seedTokenAddress, usdcTokenAddress } = useContract();

  const [activeTab, setActiveTab] = useState<Tab>('add');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add liquidity state
  const [seedAmount, setSeedAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');

  // Remove liquidity state
  const [lpAmount, setLpAmount] = useState('');
  const [estimatedSeed, setEstimatedSeed] = useState('');
  const [estimatedUsdc, setEstimatedUsdc] = useState('');

  // Balances
  const [poolInfo, setPoolInfo] = useState<{
    reserveA: bigint;
    reserveB: bigint;
    totalLiquidity: bigint;
    price: bigint;
}|null>(null);
  const [seedBalance, setSeedBalance] = useState<bigint>(0n);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [lpBalance, setLpBalance] = useState<bigint>(0n);

  // Fetch data
  useEffect(() => {
    if (!client || !address || !dexAddress) return;

    const fetchData = async () => {
      try {
        const pool = await getPoolInfo(client, dexAddress);
        setPoolInfo(pool);

        const seed = await getTokenBalance(client, seedTokenAddress, address);
        const usdc = await getTokenBalance(client, usdcTokenAddress, address);
        const lp = await getLPBalance(client, dexAddress, address);

        setSeedBalance(seed);
        setUsdcBalance(usdc);
        setLpBalance(lp);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [client, address, dexAddress, seedTokenAddress, usdcTokenAddress]);

  // Calculate proportional USDC amount when SEED changes with debouncing
  useEffect(() => {
    if (!seedAmount || !poolInfo || poolInfo.reserveA === 0n) {
      setUsdcAmount('');
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const seed = BigInt(Math.floor(parseFloat(seedAmount) * 1e18));
        const proportionalUsdc = (seed * poolInfo.reserveB) / poolInfo.reserveA;
        setUsdcAmount((Number(proportionalUsdc) / 1e6).toFixed(6));
      } catch (error) {
        console.error('Error calculating proportional amount:', error);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [seedAmount, poolInfo]);

  // Calculate estimated tokens when removing liquidity with debouncing
  useEffect(() => {
    if (!lpAmount || !poolInfo || poolInfo.totalLiquidity === 0n) {
      setEstimatedSeed('');
      setEstimatedUsdc('');
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const lp = BigInt(Math.floor(parseFloat(lpAmount) * 1e18));
        const seedOut = (lp * poolInfo.reserveA) / poolInfo.totalLiquidity;
        const usdcOut = (lp * poolInfo.reserveB) / poolInfo.totalLiquidity;

        setEstimatedSeed((Number(seedOut) / 1e18).toFixed(6));
        setEstimatedUsdc((Number(usdcOut) / 1e6).toFixed(6));
      } catch (error) {
        console.error('Error calculating removal amounts:', error);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [lpAmount, poolInfo]);

  const handleAddLiquidity = async () => {
    if (!client || !account || !seedAmount || !usdcAmount) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const seedAmt = BigInt(Math.floor(parseFloat(seedAmount) * 1e18));
      const usdcAmt = BigInt(Math.floor(parseFloat(usdcAmount) * 1e6));

      // Approve both tokens
      setApproving(true);
      await approveToken(client, account, seedTokenAddress, dexAddress, seedAmt);
      await approveToken(client, account, usdcTokenAddress, dexAddress, usdcAmt);
      setApproving(false);

      // Add liquidity
      await addLiquidity(client, account, dexAddress, seedAmt, usdcAmt);

      setSuccess(`Added ${seedAmount} SEED + ${usdcAmount} USDC to pool! 🌊`);
      setSeedAmount('');
      setUsdcAmount('');
    } catch (error) {
      console.error('Add liquidity error:', error);
      // @ts-expect-error message
      setError(error.message || 'Failed to add liquidity. Please try again.');
    } finally {
      setLoading(false);
      setApproving(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!client || !account || !lpAmount) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const lpAmt = BigInt(Math.floor(parseFloat(lpAmount) * 1e18));

      await removeLiquidity(client, account, dexAddress, lpAmt);

      setSuccess(`Removed liquidity! Received ${estimatedSeed} SEED + ${estimatedUsdc} USDC 💧`);
      setLpAmount('');
      setEstimatedSeed('');
      setEstimatedUsdc('');
    } catch (error) {
      console.error('Remove liquidity error:', error);
      // @ts-expect-error message
      setError(error.message || 'Failed to remove liquidity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-[color:var(--card)] rounded-2xl shadow-lg text-center animate-slide-in-up">
        <Droplets className="w-16 h-16 mx-auto mb-4 text-[color:var(--primary)] animate-float" />
        <h2 className="text-2xl font-bold mb-2 text-[color:var(--foreground)]">Provide Liquidity</h2>
        <p className="text-[color:var(--muted-foreground)] mb-6">
          Connect your wallet to add or remove liquidity
        </p>
      </div>
    );
  }

  const userPoolShare = poolInfo && poolInfo.totalLiquidity > 0n
    ? ((Number(lpBalance) / Number(poolInfo.totalLiquidity)) * 100).toFixed(4)
    : '0';

  return (
    <div className="max-w-md mx-auto mt-12 animate-slide-in-up">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === 'add'
              ? 'bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-[color:var(--primary-foreground)] shadow-lg'
              : 'bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-foreground)]'
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === 'remove'
              ? 'bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-[color:var(--primary-foreground)] shadow-lg'
              : 'bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-foreground)]'
          }`}
        >
          Remove Liquidity
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-[color:var(--card)] rounded-2xl shadow-lg p-6 border border-[color:var(--border)]">
        <h2 className="text-2xl font-bold mb-6 text-[color:var(--foreground)]">
          {activeTab === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
        </h2>

        {activeTab === 'add' ? (
          <>
            {/* SEED Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-[color:var(--muted-foreground)]">SEED Amount</label>
              <div className="p-4 bg-[color:var(--muted)] rounded-xl">
                <input
                  type="number"
                  value={seedAmount}
                  onChange={(e) => setSeedAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold outline-none text-[color:var(--foreground)]"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <SeedIcon className="w-5 h-5" />
                    <span className="text-sm font-medium text-[color:var(--foreground)]">SEED</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[color:var(--muted-foreground)]">
                      Balance: {(Number(seedBalance) / 1e18).toFixed(4)}
                    </span>
                    <button
                      onClick={() => setSeedAmount((Number(seedBalance) / 1e18).toString())}
                      className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--accent)] transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Plus Icon */}
            <div className="flex justify-center my-2">
              <div className="w-8 h-8 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] flex items-center justify-center font-bold">
                +
              </div>
            </div>

            {/* USDC Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[color:var(--muted-foreground)]">USDC Amount</label>
              <div className="p-4 bg-[color:var(--muted)] rounded-xl">
                <input
                  type="number"
                  value={usdcAmount}
                  onChange={(e) => setUsdcAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold outline-none text-[color:var(--foreground)]"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <UsdcIcon className="w-5 h-5" />
                    <span className="text-sm font-medium text-[color:var(--foreground)]">USDC</span>
                  </div>
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    Balance: {(Number(usdcBalance) / 1e6).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            {poolInfo && poolInfo.reserveA > 0n && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium">Maintaining pool ratio</p>
                  <p>Current price: {(Number(poolInfo.price) / 1e6).toFixed(6)} USDC per SEED</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* LP Token Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-[color:var(--muted-foreground)]">LP Tokens to Remove</label>
              <div className="p-4 bg-[color:var(--muted)] rounded-xl">
                <input
                  type="number"
                  value={lpAmount}
                  onChange={(e) => setLpAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold outline-none text-[color:var(--foreground)]"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <LpTokenIcon className="w-5 h-5" />
                    <span className="text-sm font-medium text-[color:var(--foreground)]">SDEX-LP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[color:var(--muted-foreground)]">
                      Balance: {(Number(lpBalance) / 1e18).toFixed(4)}
                    </span>
                    <button
                      onClick={() => setLpAmount((Number(lpBalance) / 1e18).toString())}
                      className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--accent)] transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Returns */}
            {estimatedSeed && estimatedUsdc && (
              <div className="mb-6 p-4 bg-[color:var(--muted)] rounded-xl">
                <p className="text-sm font-medium mb-2 text-[color:var(--muted-foreground)]">You will receive:</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <SeedIcon className="w-4 h-4" />
                      <span className="text-[color:var(--foreground)]">SEED:</span>
                    </div>
                    <span className="font-semibold text-[color:var(--foreground)]">{estimatedSeed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <UsdcIcon className="w-4 h-4" />
                      <span className="text-[color:var(--foreground)]">USDC:</span>
                    </div>
                    <span className="font-semibold text-[color:var(--foreground)]">{estimatedUsdc}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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

        {/* Action Button */}
        <button
          onClick={activeTab === 'add' ? handleAddLiquidity : handleRemoveLiquidity}
          disabled={loading || (activeTab === 'add' ? !seedAmount || !usdcAmount : !lpAmount)}
          className="w-full py-4 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-[color:var(--primary-foreground)] rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 transform"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {approving ? 'Approving tokens...' : activeTab === 'add' ? 'Adding...' : 'Removing...'}
            </span>
          ) : (
            activeTab === 'add' ? 'Add Liquidity' : 'Remove Liquidity'
          )}
        </button>

        {/* Your Position */}
        <div className="mt-6 p-4 bg-[color:var(--muted)] rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-[color:var(--foreground)]">Your Position</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[color:var(--muted-foreground)]">LP Tokens:</span>
              <span className="font-medium text-[color:var(--foreground)]">
                {(Number(lpBalance) / 1e18).toFixed(4)} SDEX-LP
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--muted-foreground)]">Pool Share:</span>
              <span className="font-medium text-[color:var(--foreground)]">{userPoolShare}%</span>
            </div>
            {poolInfo && lpBalance > 0n && (
              <>
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">Pooled SEED:</span>
                  <span className="font-medium text-[color:var(--foreground)]">
                    {((Number(lpBalance) * Number(poolInfo.reserveA)) / Number(poolInfo.totalLiquidity) / 1e18).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">Pooled USDC:</span>
                  <span className="font-medium text-[color:var(--foreground)]">
                    {((Number(lpBalance) * Number(poolInfo.reserveB)) / Number(poolInfo.totalLiquidity) / 1e6).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

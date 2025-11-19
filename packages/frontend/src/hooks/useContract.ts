import { useMemo } from 'react';
import { useActiveAccount, usePanna } from 'panna-sdk';

const SIMPLEDEX_ADDRESS = import.meta.env.VITE_SIMPLEDEX_ADDRESS || '';
const SEED_TOKEN_ADDRESS = import.meta.env.VITE_SEED_TOKEN_ADDRESS || '';
const USDC_TOKEN_ADDRESS = import.meta.env.VITE_USDC_TOKEN_ADDRESS || '';

/**
 * Hook to get Panna client and active account
 */
export function useContract() {
  const activeAccount = useActiveAccount();
  const { client } = usePanna();

  const contractInfo = useMemo(() => {
    return {
      client: client || null,
      account: activeAccount || null,
      isConnected: !!activeAccount && !!client,
      address: activeAccount?.address || null,
      dexAddress: SIMPLEDEX_ADDRESS,
      seedTokenAddress: SEED_TOKEN_ADDRESS,
      usdcTokenAddress: USDC_TOKEN_ADDRESS,
    };
  }, [activeAccount, client]);

  return contractInfo;
}

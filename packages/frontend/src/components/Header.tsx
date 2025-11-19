import { Sprout } from 'lucide-react';
import { LoginButton, useActiveAccount, liskSepolia } from 'panna-sdk';

export function Header() {
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;

  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--card)] sticky top-0 z-50 animate-slide-in-down">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] rounded-lg flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out">
            <Sprout className="w-6 h-6 text-[color:var(--primary-foreground)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Lisk Garden DEX</h1>
            <p className="text-xs text-[color:var(--muted-foreground)]">Swap SEED tokens</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="px-3 py-1.5 rounded-lg bg-[color:var(--muted)] text-sm text-[color:var(--foreground)]">
              {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}
            </div>
          )}
          <LoginButton chain={liskSepolia} />
        </div>
      </div>
    </header>
  );
}

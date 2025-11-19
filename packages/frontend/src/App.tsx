import { useState } from 'react';
import { Header } from './components/Header';
import { SwapInterface } from './components/SwapInterface';
import { LiquidityInterface } from './components/LiquidityInterface';
import { ArrowLeftRight, Droplets } from 'lucide-react';

type View = 'swap' | 'liquidity';

function App() {
  const [activeView, setActiveView] = useState<View>('swap');

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* View Tabs */}
        <div className="max-w-md mx-auto mb-6 flex gap-3">
          <button
            onClick={() => setActiveView('swap')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              activeView === 'swap'
                ? 'bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-[color:var(--primary-foreground)] shadow-lg'
                : 'bg-[color:var(--card)] text-[color:var(--foreground)] border border-[color:var(--border)] hover:border-[color:var(--primary)] hover:shadow-md'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            Swap
          </button>
          <button
            onClick={() => setActiveView('liquidity')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              activeView === 'liquidity'
                ? 'bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-[color:var(--primary-foreground)] shadow-lg'
                : 'bg-[color:var(--card)] text-[color:var(--foreground)] border border-[color:var(--border)] hover:border-[color:var(--primary)] hover:shadow-md'
            }`}
          >
            <Droplets className="w-5 h-5" />
            Liquidity
          </button>
        </div>

        {/* Content */}
        {activeView === 'swap' ? <SwapInterface /> : <LiquidityInterface />}
      </main>
    </div>
  );
}

export default App;

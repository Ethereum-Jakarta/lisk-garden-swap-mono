'use client';

import { PannaProvider } from 'panna-sdk';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PannaProvider
      clientId={import.meta.env.VITE_PANNA_CLIENT_ID}
      partnerId={import.meta.env.VITE_PANNA_PARTNER_ID}
    >
      {children}
    </PannaProvider>
  );
}

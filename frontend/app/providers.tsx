'use client';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { NETWORK } from '@/lib/constants';

// 创建 QueryClient
const queryClient = new QueryClient();

// Sui 网络配置
const networks = {
  [NETWORK]: { url: getFullnodeUrl(NETWORK) },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={NETWORK}>
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

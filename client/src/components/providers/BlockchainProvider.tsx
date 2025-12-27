import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/blockchain/config';
import '@rainbow-me/rainbowkit/styles.css';

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#8b5cf6',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          fontStack: 'system',
        })}
        modalSize="compact"
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

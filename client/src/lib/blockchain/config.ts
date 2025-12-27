import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const TESTNET_MODE = import.meta.env.VITE_BLOCKCHAIN_MODE !== 'mainnet';

export const chains = TESTNET_MODE 
  ? [sepolia, polygonAmoy, arbitrumSepolia, optimismSepolia, baseSepolia] as const
  : [mainnet, polygon, arbitrum, optimism, base] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
    [polygon.id]: http(import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon.llamarpc.com'),
    [arbitrum.id]: http(import.meta.env.VITE_ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com'),
    [optimism.id]: http(import.meta.env.VITE_OPTIMISM_RPC_URL || 'https://optimism.llamarpc.com'),
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://base.llamarpc.com'),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://eth-sepolia.public.blastapi.io'),
    [polygonAmoy.id]: http(import.meta.env.VITE_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'),
    [optimismSepolia.id]: http(import.meta.env.VITE_OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io'),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
});

export const BLOCK_EXPLORERS = {
  [mainnet.id]: 'https://etherscan.io',
  [polygon.id]: 'https://polygonscan.com',
  [arbitrum.id]: 'https://arbiscan.io',
  [optimism.id]: 'https://optimistic.etherscan.io',
  [base.id]: 'https://basescan.org',
  [sepolia.id]: 'https://sepolia.etherscan.io',
  [polygonAmoy.id]: 'https://amoy.polygonscan.com',
  [arbitrumSepolia.id]: 'https://sepolia.arbiscan.io',
  [optimismSepolia.id]: 'https://sepolia-optimism.etherscan.io',
  [baseSepolia.id]: 'https://sepolia.basescan.org',
} as const;

export function getBlockExplorerUrl(chainId: number, txHash?: string, address?: string): string {
  const baseUrl = BLOCK_EXPLORERS[chainId as keyof typeof BLOCK_EXPLORERS] || BLOCK_EXPLORERS[sepolia.id];
  if (txHash) return `${baseUrl}/tx/${txHash}`;
  if (address) return `${baseUrl}/address/${address}`;
  return baseUrl;
}

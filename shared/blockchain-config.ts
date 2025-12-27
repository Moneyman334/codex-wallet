/**
 * CHAOS PLATFORM - MULTI-CHAIN BLOCKCHAIN CONFIGURATION
 * Supporting 22+ blockchain networks for global dominance
 */

export interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  type: 'EVM' | 'NON_EVM';
  bridgeSupport: string[];
  enabled: boolean;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // 1. Ethereum - The foundation
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['LayerZero', 'Wormhole', 'Axelar', 'Chainlink CCIP'],
    enabled: true,
  },

  // 2. Polygon - Layer 2 scaling
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Polygon Bridge', 'Wormhole', 'Axelar'],
    enabled: true,
  },

  // 3. BNB Smart Chain - Low fees, high speed
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Binance Bridge', 'Wormhole', 'LayerZero'],
    enabled: true,
  },

  // 4. Avalanche - Subnet architecture
  AVALANCHE: {
    id: 43114,
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Avalanche Bridge', 'Wormhole', 'LayerZero'],
    enabled: true,
  },

  // 5. Arbitrum - Optimistic rollup
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ARB',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Arbitrum Bridge', 'Hop Protocol', 'Synapse'],
    enabled: true,
  },

  // 6. Optimism - Optimistic rollup
  OPTIMISM: {
    id: 10,
    name: 'Optimism',
    symbol: 'OP',
    rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Optimism Bridge', 'Hop Protocol', 'Synapse'],
    enabled: true,
  },

  // 7. Solana - High-speed non-EVM
  SOLANA: {
    id: 1399811149, // Solana uses this as chain ID in some contexts
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: 'https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    type: 'NON_EVM',
    bridgeSupport: ['Wormhole', 'Allbridge'],
    enabled: true,
  },

  // 8. Base - Coinbase L2
  BASE: {
    id: 8453,
    name: 'Base',
    symbol: 'BASE',
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Base Bridge', 'LayerZero'],
    enabled: true,
  },

  // 9. Fantom - DAG-based
  FANTOM: {
    id: 250,
    name: 'Fantom Opera',
    symbol: 'FTM',
    rpcUrl: 'https://rpc.ftm.tools/',
    explorerUrl: 'https://ftmscan.com',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Multichain', 'Synapse', 'LayerZero'],
    enabled: true,
  },

  // 10. Cosmos - IBC ecosystem
  COSMOS: {
    id: 0, // Cosmos doesn't use chain IDs like EVM
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    rpcUrl: 'https://cosmos-rpc.publicnode.com',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    nativeCurrency: { name: 'Cosmos', symbol: 'ATOM', decimals: 6 },
    type: 'NON_EVM',
    bridgeSupport: ['IBC', 'Axelar', 'Wormhole'],
    enabled: true,
  },

  // 11. Polkadot - Parachain architecture
  POLKADOT: {
    id: 0,
    name: 'Polkadot',
    symbol: 'DOT',
    rpcUrl: 'https://polkadot-rpc.publicnode.com',
    explorerUrl: 'https://polkadot.subscan.io',
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 },
    type: 'NON_EVM',
    bridgeSupport: ['XCM', 'Wormhole'],
    enabled: true,
  },

  // 12. Cardano - Research-driven
  CARDANO: {
    id: 0,
    name: 'Cardano',
    symbol: 'ADA',
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
    nativeCurrency: { name: 'Cardano', symbol: 'ADA', decimals: 6 },
    type: 'NON_EVM',
    bridgeSupport: ['Milkomeda', 'Wanchain'],
    enabled: true,
  },

  // 13. Algorand - Pure PoS
  ALGORAND: {
    id: 0,
    name: 'Algorand',
    symbol: 'ALGO',
    rpcUrl: 'https://mainnet-api.algonode.cloud',
    explorerUrl: 'https://algoexplorer.io',
    nativeCurrency: { name: 'Algorand', symbol: 'ALGO', decimals: 6 },
    type: 'NON_EVM',
    bridgeSupport: ['Glitter Finance', 'Wormhole'],
    enabled: true,
  },

  // 14. Near Protocol - Sharding
  NEAR: {
    id: 0,
    name: 'Near Protocol',
    symbol: 'NEAR',
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://explorer.near.org',
    nativeCurrency: { name: 'Near', symbol: 'NEAR', decimals: 24 },
    type: 'NON_EVM',
    bridgeSupport: ['Rainbow Bridge', 'Wormhole'],
    enabled: true,
  },

  // 15. Sui - Move language
  SUI: {
    id: 0,
    name: 'Sui Network',
    symbol: 'SUI',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suiexplorer.com',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
    type: 'NON_EVM',
    bridgeSupport: ['Wormhole', 'LayerZero'],
    enabled: true,
  },

  // 16. Aptos - Move VM
  APTOS: {
    id: 0,
    name: 'Aptos',
    symbol: 'APT',
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com',
    nativeCurrency: { name: 'Aptos', symbol: 'APT', decimals: 8 },
    type: 'NON_EVM',
    bridgeSupport: ['Wormhole', 'LayerZero'],
    enabled: true,
  },

  // 17. Tezos - Self-amending
  TEZOS: {
    id: 0,
    name: 'Tezos',
    symbol: 'XTZ',
    rpcUrl: 'https://mainnet.api.tez.ie',
    explorerUrl: 'https://tzkt.io',
    nativeCurrency: { name: 'Tezos', symbol: 'XTZ', decimals: 6 },
    type: 'NON_EVM',
    bridgeSupport: ['Wrap Protocol'],
    enabled: true,
  },

  // 18. Celo - Mobile-first
  CELO: {
    id: 42220,
    name: 'Celo',
    symbol: 'CELO',
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Wormhole', 'Axelar'],
    enabled: true,
  },

  // 19. Harmony - Sharding
  HARMONY: {
    id: 1666600000,
    name: 'Harmony',
    symbol: 'ONE',
    rpcUrl: 'https://api.harmony.one',
    explorerUrl: 'https://explorer.harmony.one',
    nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Harmony Bridge', 'LayerZero'],
    enabled: true,
  },

  // 20. Stellar - Cross-border payments
  STELLAR: {
    id: 0,
    name: 'Stellar',
    symbol: 'XLM',
    rpcUrl: 'https://horizon.stellar.org',
    explorerUrl: 'https://stellarchain.io',
    nativeCurrency: { name: 'Lumens', symbol: 'XLM', decimals: 7 },
    type: 'NON_EVM',
    bridgeSupport: ['Wormhole'],
    enabled: true,
  },

  // 21. Cronos - Crypto.com chain
  CRONOS: {
    id: 25,
    name: 'Cronos',
    symbol: 'CRO',
    rpcUrl: 'https://evm.cronos.org',
    explorerUrl: 'https://cronoscan.com',
    nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
    type: 'EVM',
    bridgeSupport: ['Crypto.org Bridge', 'Wormhole'],
    enabled: true,
  },

  // 22. Starknet - ZK-Rollup
  STARKNET: {
    id: 0,
    name: 'Starknet',
    symbol: 'STRK',
    rpcUrl: 'https://starknet-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    explorerUrl: 'https://starkscan.co',
    nativeCurrency: { name: 'Starknet', symbol: 'STRK', decimals: 18 },
    type: 'NON_EVM',
    bridgeSupport: ['Starkgate', 'LayerZero'],
    enabled: true,
  },
};

// Get all enabled chains
export const getEnabledChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => chain.enabled);
};

// Get EVM chains only
export const getEVMChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(
    (chain) => chain.type === 'EVM' && chain.enabled
  );
};

// Get non-EVM chains only
export const getNonEVMChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(
    (chain) => chain.type === 'NON_EVM' && chain.enabled
  );
};

// Get chain by ID
export const getChainById = (id: number): ChainConfig | undefined => {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === id);
};

// Get chain by symbol
export const getChainBySymbol = (symbol: string): ChainConfig | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(
    (chain) => chain.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

// RPC Provider configuration
export const RPC_PROVIDERS = {
  ALCHEMY: {
    name: 'Alchemy',
    baseUrl: 'https://{network}.g.alchemy.com/v2/',
    apiKeyEnv: 'ALCHEMY_API_KEY',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'solana', 'starknet'],
    features: ['sub-50ms latency', 'zero inconsistent blocks', 'Cortex AI engine'],
  },
  INFURA: {
    name: 'Infura',
    baseUrl: 'https://{network}.infura.io/v3/',
    apiKeyEnv: 'INFURA_API_KEY',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
    features: ['IPFS support', 'MetaMask integration'],
  },
  QUICKNODE: {
    name: 'QuickNode',
    baseUrl: 'https://{endpoint}.quiknode.pro/',
    apiKeyEnv: 'QUICKNODE_API_KEY',
    supportedChains: ['ethereum', 'solana', 'bitcoin', 'polygon', 'bsc', 'fantom', 'avalanche'],
    features: ['15+ chains', 'lowest latency', 'dedicated nodes'],
  },
};

// Bridge protocols for cross-chain transfers
export const BRIDGE_PROTOCOLS = {
  WORMHOLE: {
    name: 'Wormhole',
    url: 'https://wormhole.com',
    chains: 30,
    features: ['NFT bridging', 'EVM + non-EVM support'],
  },
  LAYERZERO: {
    name: 'LayerZero',
    url: 'https://layerzero.network',
    chains: 40,
    features: ['Omnichain messaging', 'Native asset transfers'],
  },
  AXELAR: {
    name: 'Axelar',
    url: 'https://axelar.network',
    chains: 50,
    features: ['Decentralized validators', 'Cross-chain messaging'],
  },
  CHAINLINK_CCIP: {
    name: 'Chainlink CCIP',
    url: 'https://chain.link/ccip',
    chains: 30,
    features: ['Secure messaging', 'Data feeds'],
  },
};

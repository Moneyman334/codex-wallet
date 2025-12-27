import { ethers } from 'ethers';
import crypto from 'crypto';
import { getCryptoPrice } from '../price-service';

// Merkle Tree implementation for Proof of Reserves
class MerkleTree {
  private leaves: Buffer[];
  private layers: Buffer[][];

  constructor(leaves: string[]) {
    this.leaves = leaves.map(leaf => this.hash(leaf));
    this.layers = this.buildTree();
  }

  private hash(data: string): Buffer {
    return crypto.createHash('sha256').update(data).digest();
  }

  private buildTree(): Buffer[][] {
    if (this.leaves.length === 0) {
      return [];
    }

    const layers: Buffer[][] = [this.leaves];
    
    while (layers[layers.length - 1].length > 1) {
      const currentLayer = layers[layers.length - 1];
      const nextLayer: Buffer[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          // Sort hashes before combining (lexicographic order)
          const pair = [currentLayer[i], currentLayer[i + 1]].sort(Buffer.compare);
          const combined = Buffer.concat(pair);
          nextLayer.push(this.hash(combined.toString('hex')));
        } else {
          nextLayer.push(currentLayer[i]);
        }
      }

      layers.push(nextLayer);
    }

    return layers;
  }

  getRoot(): string {
    if (this.layers.length === 0) return '';
    const rootLayer = this.layers[this.layers.length - 1];
    return rootLayer[0].toString('hex');
  }

  getProof(index: number): string[] {
    const proof: string[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex].toString('hex'));
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  verify(leaf: string, proof: string[], root: string): boolean {
    let currentHash = this.hash(leaf);

    for (const proofElement of proof) {
      const proofBuffer = Buffer.from(proofElement, 'hex');
      const combined = Buffer.concat([currentHash, proofBuffer].sort(Buffer.compare));
      currentHash = this.hash(combined.toString('hex'));
    }

    return currentHash.toString('hex') === root;
  }
}

interface ReserveSnapshot {
  totalEthReserves: string;
  totalUserBalances: string;
  reserveRatio: string;
  merkleRoot: string;
  blockNumber: string;
  chainId: string;
  userBalances: Array<{ address: string; balance: string }>;
  tokens?: Record<string, string>; // ERC-20 token balances
  nativeBalance?: string; // Native ETH balance
}

interface ChainReserves {
  chainId: string;
  chainName: string;
  totalReserves: string;
  userBalances: string;
  blockNumber: string;
  platformAddresses: Array<{ address: string; balance: string; label: string }>;
}

export class ProofOfReservesService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  
  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Ethereum Mainnet
    const mainnetRpc = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
    this.providers.set('1', new ethers.JsonRpcProvider(mainnetRpc));

    // Ethereum Sepolia (Testnet)
    const sepoliaRpc = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    this.providers.set('11155111', new ethers.JsonRpcProvider(sepoliaRpc));

    // Polygon
    const polygonRpc = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    this.providers.set('137', new ethers.JsonRpcProvider(polygonRpc));

    // Arbitrum
    const arbitrumRpc = process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
    this.providers.set('42161', new ethers.JsonRpcProvider(arbitrumRpc));

    // Optimism
    const optimismRpc = process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io';
    this.providers.set('10', new ethers.JsonRpcProvider(optimismRpc));

    // Base
    const baseRpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    this.providers.set('8453', new ethers.JsonRpcProvider(baseRpc));

    console.log(`📊 Proof of Reserves Service: ${this.providers.size} chains initialized`);
  }

  async getChainReserves(chainId: string, platformAddresses: string[]): Promise<ChainReserves | null> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      console.warn(`⚠️  No provider for chain ${chainId}`);
      return null;
    }

    try {
      const blockNumber = await provider.getBlockNumber();
      let totalReserves = BigInt(0);
      const addressBalances: Array<{ address: string; balance: string; label: string }> = [];

      // Query balances for platform addresses
      for (const address of platformAddresses) {
        try {
          const balance = await provider.getBalance(address);
          totalReserves += balance;
          addressBalances.push({
            address,
            balance: balance.toString(),
            label: this.getAddressLabel(address),
          });
        } catch (error) {
          console.error(`❌ Error fetching balance for ${address}:`, error);
        }
      }

      const chainName = this.getChainName(chainId);

      return {
        chainId,
        chainName,
        totalReserves: totalReserves.toString(),
        userBalances: '0', // Placeholder - would be calculated from user deposits
        blockNumber: blockNumber.toString(),
        platformAddresses: addressBalances,
      };
    } catch (error) {
      console.error(`❌ Error getting reserves for chain ${chainId}:`, error);
      return null;
    }
  }

  async generateProofSnapshot(
    platformAddresses: string[],
    userBalances: Array<{ address: string; balance: string }>,
    chainId: string = '1'
  ): Promise<ReserveSnapshot> {
    // Get aggregated reserves including ERC-20 tokens
    const aggregatedReserves = await this.getAggregatedReserves(platformAddresses, chainId);
    
    // Also get chain info for block number
    const chainInfo = await this.getChainReserves(chainId, platformAddresses);
    if (!chainInfo) {
      throw new Error(`Failed to get chain info for ${chainId}`);
    }

    // Calculate total user balances
    const totalUserBalances = userBalances.reduce((sum, user) => {
      return sum + BigInt(user.balance);
    }, BigInt(0));

    // Generate Merkle tree from user balances
    const leaves = userBalances.map(user => 
      `${user.address.toLowerCase()}:${user.balance}`
    );
    const merkleTree = new MerkleTree(leaves);
    const merkleRoot = merkleTree.getRoot();

    // Calculate reserve ratio (platform reserves / user deposits)
    // Convert ALL assets to USD for accurate solvency math
    
    // Get current ETH price in USD
    const ethPrice = getCryptoPrice('ETH');
    const ethUsdPrice = ethPrice ? ethPrice.usd : 2500; // Fallback to $2500 if price unavailable
    
    // Native ETH reserves in USD
    const nativeBalanceEth = Number(aggregatedReserves.nativeBalance) / 1e18;
    const nativeBalanceUsd = nativeBalanceEth * ethUsdPrice;
    
    // Stablecoin balances in USD (USDC, USDT, DAI ~= $1.00)
    const usdcBalance = Number(aggregatedReserves.tokens.USDC || '0') / 1e6; // USDC has 6 decimals
    const usdtBalance = Number(aggregatedReserves.tokens.USDT || '0') / 1e6; // USDT has 6 decimals
    const daiBalance = Number(aggregatedReserves.tokens.DAI || '0') / 1e18; // DAI has 18 decimals
    
    const totalStablecoinsUsd = usdcBalance + usdtBalance + daiBalance;
    const totalReservesUsd = nativeBalanceUsd + totalStablecoinsUsd;
    
    // User liabilities in USD (assumed to be ETH deposits)
    const totalUserBalancesEth = Number(totalUserBalances) / 1e18;
    const totalUserBalancesUsd = totalUserBalancesEth * ethUsdPrice;
    
    let reserveRatio = '0';
    if (totalUserBalancesUsd > 0) {
      // Calculate as decimal (e.g., 1.05 = 105%)
      const ratio = totalReservesUsd / totalUserBalancesUsd;
      reserveRatio = ratio.toFixed(4);
    } else {
      reserveRatio = totalReservesUsd > 0 ? '999.9999' : '1.0000';
    }
    
    // For totalEthReserves, return the native balance (backward compatibility)
    const totalReserves = BigInt(aggregatedReserves.nativeBalance);

    return {
      totalEthReserves: totalReserves.toString(),
      totalUserBalances: totalUserBalances.toString(),
      reserveRatio,
      merkleRoot,
      blockNumber: chainInfo.blockNumber,
      chainId,
      userBalances,
      tokens: aggregatedReserves.tokens, // Include ERC-20 token balances
      nativeBalance: aggregatedReserves.nativeBalance,
    };
  }

  generateMerkleProof(
    userBalances: Array<{ address: string; balance: string }>,
    targetAddress: string
  ): { proof: string[]; leaf: string } | null {
    const leaves = userBalances.map(user => 
      `${user.address.toLowerCase()}:${user.balance}`
    );
    const merkleTree = new MerkleTree(leaves);
    
    const index = userBalances.findIndex(
      user => user.address.toLowerCase() === targetAddress.toLowerCase()
    );

    if (index === -1) {
      return null;
    }

    const leaf = leaves[index];
    const proof = merkleTree.getProof(index);

    return { proof, leaf };
  }

  verifyMerkleProof(leaf: string, proof: string[], merkleRoot: string): boolean {
    const leaves = [leaf]; // Single leaf for verification
    const merkleTree = new MerkleTree(leaves);
    return merkleTree.verify(leaf, proof, merkleRoot);
  }

  private getChainName(chainId: string): string {
    const chains: Record<string, string> = {
      '1': 'Ethereum Mainnet',
      '11155111': 'Ethereum Sepolia',
      '137': 'Polygon',
      '42161': 'Arbitrum One',
      '10': 'Optimism',
      '8453': 'Base',
      '56': 'BNB Chain',
      '43114': 'Avalanche',
      '250': 'Fantom',
    };
    return chains[chainId] || `Chain ${chainId}`;
  }

  private getAddressLabel(address: string): string {
    // Common platform addresses - would be loaded from database in production
    const labels: Record<string, string> = {
      '0x742d35cc6634c0532925a3b844bc9e7595f0beb4': 'Main Treasury',
      '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b': 'Hot Wallet',
      '0x9876543210fedcba9876543210fedcba98765432': 'Cold Storage',
    };
    return labels[address.toLowerCase()] || 'Platform Wallet';
  }

  // ERC-20 Token balance checking (for USDC, USDT, DAI, etc.)
  async getERC20Reserves(
    tokenAddress: string,
    platformAddresses: string[],
    chainId: string = '1'
  ): Promise<string> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider for chain ${chainId}`);
    }

    const ERC20_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
    ];

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      let totalBalance = BigInt(0);

      for (const address of platformAddresses) {
        const balance = await contract.balanceOf(address);
        totalBalance += BigInt(balance);
      }

      return totalBalance.toString();
    } catch (error) {
      console.error(`❌ Error getting ERC-20 reserves:`, error);
      return '0';
    }
  }

  // BTC reserves (would integrate with Bitcoin RPC in production)
  async getBTCReserves(platformAddresses: string[]): Promise<string> {
    // Placeholder - would integrate with Bitcoin RPC or blockchain explorer API
    console.log('⚠️  BTC reserves checking not implemented - requires Bitcoin RPC');
    return '0';
  }

  // Get aggregated reserves including ERC-20 tokens
  async getAggregatedReserves(
    platformAddresses: string[],
    chainId: string = '1'
  ): Promise<{
    nativeBalance: string;
    tokens: Record<string, string>;
    totalValueUsd: string;
  }> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      return { nativeBalance: '0', tokens: {}, totalValueUsd: '0' };
    }

    // Get native ETH balance
    let nativeBalance = BigInt(0);
    for (const address of platformAddresses) {
      try {
        const balance = await provider.getBalance(address);
        nativeBalance += balance;
      } catch (error) {
        console.error(`Error getting native balance for ${address}:`, error);
      }
    }

    // Common stablecoin addresses (Ethereum Mainnet)
    const tokenAddresses: Record<string, string> = {
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC (Circle)
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT (Tether)
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI (MakerDAO)
    };

    const tokens: Record<string, string> = {};
    
    // Query ERC-20 balances
    for (const [symbol, tokenAddress] of Object.entries(tokenAddresses)) {
      try {
        const balance = await this.getERC20Reserves(tokenAddress, platformAddresses, chainId);
        tokens[symbol] = balance;
      } catch (error) {
        console.error(`Error getting ${symbol} balance:`, error);
        tokens[symbol] = '0';
      }
    }

    return {
      nativeBalance: nativeBalance.toString(),
      tokens,
      totalValueUsd: '0', // Would calculate USD value in production
    };
  }

  // Multi-chain aggregated proof
  async generateMultiChainProof(
    platformAddresses: string[],
    userBalances: Array<{ address: string; balance: string; chainId: string }>,
    chainIds: string[] = ['1', '137', '42161', '10', '8453']
  ): Promise<{
    totalReserves: string;
    totalUserBalances: string;
    reserveRatio: string;
    chainBreakdown: ChainReserves[];
  }> {
    const chainBreakdown: ChainReserves[] = [];
    let totalReservesUsd = 0;
    let totalUserBalancesUsd = 0;

    // Map chainIds to their native tokens for price lookup
    const nativeTokens: Record<string, string> = {
      '1': 'ETH',        // Ethereum
      '11155111': 'ETH', // Sepolia
      '137': 'MATIC',    // Polygon
      '42161': 'ETH',    // Arbitrum
      '10': 'ETH',       // Optimism
      '8453': 'ETH',     // Base
      '56': 'BNB',       // BNB Chain
      '43114': 'AVAX',   // Avalanche
      '250': 'FTM',      // Fantom
    };

    // Default prices if price-service unavailable
    const defaultPrices: Record<string, number> = {
      'ETH': 2500,
      'MATIC': 0.50,
      'BNB': 300,
      'AVAX': 25,
      'FTM': 0.40,
    };

    // Query each chain and convert to USD
    for (const chainId of chainIds) {
      const chainReserves = await this.getChainReserves(chainId, platformAddresses);
      if (chainReserves) {
        chainBreakdown.push(chainReserves);
        
        // Get native token price
        const tokenSymbol = nativeTokens[chainId] || 'ETH';
        const priceData = getCryptoPrice(tokenSymbol);
        const tokenPriceUsd = priceData ? priceData.usd : (defaultPrices[tokenSymbol] || 2500);
        
        // Convert reserves to USD (assuming 18 decimals for all native tokens)
        const reservesInNative = Number(chainReserves.totalReserves) / 1e18;
        const reservesUsd = reservesInNative * tokenPriceUsd;
        totalReservesUsd += reservesUsd;
      }

      // Calculate user balances for this chain in USD
      const chainUserBalances = userBalances
        .filter(user => user.chainId === chainId)
        .reduce((sum, user) => sum + BigInt(user.balance), BigInt(0));
      
      // Convert user balances to USD
      const tokenSymbol = nativeTokens[chainId] || 'ETH';
      const priceData = getCryptoPrice(tokenSymbol);
      const tokenPriceUsd = priceData ? priceData.usd : (defaultPrices[tokenSymbol] || 2500);
      
      const userBalancesInNative = Number(chainUserBalances) / 1e18;
      const userBalancesUsd = userBalancesInNative * tokenPriceUsd;
      totalUserBalancesUsd += userBalancesUsd;
    }

    // Calculate overall reserve ratio in USD
    let reserveRatio = '0';
    if (totalUserBalancesUsd > 0) {
      const ratio = totalReservesUsd / totalUserBalancesUsd;
      reserveRatio = ratio.toFixed(4);
    } else {
      reserveRatio = totalReservesUsd > 0 ? '999.9999' : '1.0000';
    }

    return {
      totalReserves: totalReservesUsd.toFixed(2), // USD value
      totalUserBalances: totalUserBalancesUsd.toFixed(2), // USD value
      reserveRatio,
      chainBreakdown,
    };
  }
}

// Singleton instance
export const proofOfReservesService = new ProofOfReservesService();

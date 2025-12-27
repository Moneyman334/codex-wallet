/**
 * MULTI-CHAIN BALANCE AGGREGATION SERVICE
 * Fetches and aggregates balances across all supported blockchains
 */

import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, getEVMChains, type ChainConfig } from '../shared/blockchain-config';

interface ChainBalance {
  chainId: number;
  chainName: string;
  chainSymbol: string;
  nativeBalance: string;
  nativeBalanceUSD: number;
  tokens: TokenBalance[];
}

interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue: number;
}

interface PortfolioSummary {
  totalValue: number;
  activeChains: number;
  totalAssets: number;
  balancesByChain: ChainBalance[];
}

export class MultiChainService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private alchemyApiKey: string;
  private infuraApiKey: string;

  constructor() {
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || '';
    this.infuraApiKey = process.env.INFURA_API_KEY || '';
    this.initializeProviders();
  }

  /**
   * Initialize RPC providers for all EVM chains
   */
  private initializeProviders() {
    const evmChains = getEVMChains();
    
    for (const chain of evmChains) {
      try {
        let rpcUrl = chain.rpcUrl;
        
        // Replace API key placeholders
        if (rpcUrl.includes('${ALCHEMY_API_KEY}')) {
          if (!this.alchemyApiKey) {
            console.warn(`⚠️ ${chain.name}: No ALCHEMY_API_KEY found, skipping Alchemy-based chain`);
            continue;
          }
          rpcUrl = rpcUrl.replace('${ALCHEMY_API_KEY}', this.alchemyApiKey);
        } else if (rpcUrl.includes('${INFURA_API_KEY}')) {
          if (!this.infuraApiKey) {
            console.warn(`⚠️ ${chain.name}: No INFURA_API_KEY found, skipping Infura-based chain`);
            continue;
          }
          rpcUrl = rpcUrl.replace('${INFURA_API_KEY}', this.infuraApiKey);
        }
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.providers.set(chain.id, provider);
        console.log(`✅ Initialized provider for ${chain.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize provider for ${chain.name}:`, error);
      }
    }
    
    if (this.providers.size === 0) {
      console.error(`❌ NO CHAINS INITIALIZED! Add ALCHEMY_API_KEY or INFURA_API_KEY to Replit Secrets`);
      console.error(`Visit: https://www.alchemy.com or https://www.infura.io to get API keys`);
    } else {
      console.log(`🚀 Multi-Chain Service: ${this.providers.size} chains initialized`);
    }
  }

  /**
   * Get native balance for an address on a specific chain
   */
  private async getNativeBalance(address: string, chainId: number): Promise<string> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider for chain ${chainId}`);
    }

    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Error fetching balance for ${address} on chain ${chainId}:`, error);
      return '0';
    }
  }

  /**
   * Get live token price from CoinGecko price service
   */
  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Import price service dynamically
      const { getCryptoPrice } = await import('./price-service');
      
      // Map chain symbols to CoinGecko IDs
      const symbolToCoinGeckoId: Record<string, string> = {
        'ETH': 'ethereum',
        'MATIC': 'matic-network',
        'BNB': 'binancecoin',
        'AVAX': 'avalanche-2',
        'OP': 'optimism',
        'ARB': 'arbitrum',
        'BASE': 'ethereum', // Base uses ETH
        'FTM': 'fantom',
        'CELO': 'celo',
        'ONE': 'harmony',
        'CRO': 'crypto-com-chain',
        'SOL': 'solana',
      };
      
      const coinGeckoId = symbolToCoinGeckoId[symbol];
      if (!coinGeckoId) {
        console.warn(`No CoinGecko mapping for ${symbol}, using $0`);
        return 0;
      }
      
      const priceData = getCryptoPrice(coinGeckoId);
      return priceData?.usd || 0;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Aggregate portfolio across all chains for an address
   */
  async getPortfolio(address: string): Promise<PortfolioSummary> {
    const balancesByChain: ChainBalance[] = [];
    let totalValue = 0;
    let activeChains = 0;
    let totalAssets = 0;

    // Get balances from all EVM chains
    const evmChains = getEVMChains();
    
    await Promise.allSettled(
      evmChains.map(async (chain) => {
        try {
          const nativeBalance = await this.getNativeBalance(address, chain.id);
          const balanceNum = parseFloat(nativeBalance);
          
          if (balanceNum > 0.001) { // Only count meaningful balances
            const price = await this.getTokenPrice(chain.symbol);
            const usdValue = balanceNum * price;
            
            balancesByChain.push({
              chainId: chain.id,
              chainName: chain.name,
              chainSymbol: chain.symbol,
              nativeBalance,
              nativeBalanceUSD: usdValue,
              tokens: [], // TODO: Add token balances using Alchemy/Moralis API
            });
            
            totalValue += usdValue;
            activeChains++;
            totalAssets++; // Count native token as asset
          }
        } catch (error) {
          console.error(`Error fetching balance for ${chain.name}:`, error);
        }
      })
    );

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      activeChains,
      totalAssets,
      balancesByChain: balancesByChain.sort((a, b) => b.nativeBalanceUSD - a.nativeBalanceUSD),
    };
  }

  /**
   * Get balances formatted for wallet display
   */
  async getWalletBalances(address: string): Promise<any[]> {
    const portfolio = await this.getPortfolio(address);
    
    return portfolio.balancesByChain.map((chain) => ({
      id: `${chain.chainId}-native`,
      chainId: chain.chainId,
      chainName: chain.chainName,
      symbol: chain.chainSymbol,
      amount: chain.nativeBalance,
      usdValue: chain.nativeBalanceUSD.toFixed(2),
      type: 'native',
    }));
  }

  /**
   * Check if a chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return this.providers.has(chainId);
  }

  /**
   * Get supported chain IDs
   */
  getSupportedChainIds(): number[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
export const multiChainService = new MultiChainService();

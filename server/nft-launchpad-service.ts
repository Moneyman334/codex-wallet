interface LaunchpadProject {
  id: string;
  name: string;
  creatorWallet: string;
  contractAddress?: string;
  totalSupply: number;
  mintPrice: string;
  platformFeePercentage: number;
  totalMinted: number;
  totalRevenue: number;
  platformRevenue: number;
  status: 'draft' | 'live' | 'sold_out' | 'ended';
}

interface LaunchpadSale {
  projectId: string;
  buyerWallet: string;
  quantity: number;
  totalPrice: number;
  platformFee: number;
  creatorEarnings: number;
}

export class NftLaunchpadService {
  private readonly PLATFORM_FEE_PERCENTAGE = 7.5; // 7.5% platform fee

  /**
   * Calculate platform fee for a launchpad sale
   */
  calculatePlatformFee(salePrice: number): { platformFee: number; creatorEarnings: number } {
    const platformFee = (salePrice * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const creatorEarnings = salePrice - platformFee;
    
    return {
      platformFee,
      creatorEarnings
    };
  }

  /**
   * Calculate fees for multiple NFT mints
   */
  calculateMintFees(mintPrice: number, quantity: number) {
    const totalPrice = mintPrice * quantity;
    const fees = this.calculatePlatformFee(totalPrice);
    
    return {
      mintPrice,
      quantity,
      totalPrice,
      platformFee: fees.platformFee,
      creatorEarnings: fees.creatorEarnings,
      platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE
    };
  }

  /**
   * Get fee breakdown for a launchpad project
   */
  getProjectFeeBreakdown(totalMints: number, mintPrice: number) {
    const totalRevenue = totalMints * mintPrice;
    const platformRevenue = (totalRevenue * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const creatorRevenue = totalRevenue - platformRevenue;
    
    return {
      totalMints,
      mintPrice,
      totalRevenue,
      platformRevenue,
      creatorRevenue,
      platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE
    };
  }

  /**
   * Calculate total platform revenue from all launchpad sales
   */
  calculateTotalLaunchpadRevenue(sales: Array<{ price: number; quantity: number }>) {
    return sales.reduce((total, sale) => {
      const saleRevenue = sale.price * sale.quantity;
      const platformFee = (saleRevenue * this.PLATFORM_FEE_PERCENTAGE) / 100;
      return total + platformFee;
    }, 0);
  }

  /**
   * Get launchpad statistics for a creator
   */
  getCreatorStats(projects: Array<{
    totalMinted: number;
    mintPrice: number;
    totalSupply: number;
  }>) {
    const totalProjects = projects.length;
    const totalNftsMinted = projects.reduce((sum, p) => sum + p.totalMinted, 0);
    const totalRevenue = projects.reduce((sum, p) => sum + (p.totalMinted * p.mintPrice), 0);
    const platformFees = (totalRevenue * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const creatorEarnings = totalRevenue - platformFees;
    const averageMintPrice = totalRevenue / totalNftsMinted || 0;
    const sellThroughRate = projects.reduce((sum, p) => {
      return sum + (p.totalSupply > 0 ? (p.totalMinted / p.totalSupply) * 100 : 0);
    }, 0) / totalProjects || 0;

    return {
      totalProjects,
      totalNftsMinted,
      totalRevenue,
      platformFees,
      creatorEarnings,
      averageMintPrice,
      sellThroughRate: parseFloat(sellThroughRate.toFixed(2))
    };
  }

  /**
   * Get platform launchpad statistics
   */
  getPlatformLaunchpadStats(allProjects: Array<{
    totalMinted: number;
    mintPrice: number;
    status: string;
  }>) {
    const activeProjects = allProjects.filter(p => p.status === 'live').length;
    const soldOutProjects = allProjects.filter(p => p.status === 'sold_out').length;
    const totalNftsSold = allProjects.reduce((sum, p) => sum + p.totalMinted, 0);
    const totalVolume = allProjects.reduce((sum, p) => sum + (p.totalMinted * p.mintPrice), 0);
    const totalPlatformRevenue = (totalVolume * this.PLATFORM_FEE_PERCENTAGE) / 100;

    return {
      totalProjects: allProjects.length,
      activeProjects,
      soldOutProjects,
      totalNftsSold,
      totalVolume,
      totalPlatformRevenue,
      averageProjectVolume: totalVolume / allProjects.length || 0,
      platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE
    };
  }

  /**
   * Estimate potential revenue for a project
   */
  estimateProjectRevenue(totalSupply: number, mintPrice: number, estimatedSellThrough: number = 100) {
    const expectedMints = (totalSupply * estimatedSellThrough) / 100;
    const totalRevenue = expectedMints * mintPrice;
    const platformFee = (totalRevenue * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const creatorEarnings = totalRevenue - platformFee;

    return {
      totalSupply,
      mintPrice,
      estimatedSellThrough,
      expectedMints: Math.floor(expectedMints),
      totalRevenue,
      platformFee,
      creatorEarnings,
      revenuePerNft: mintPrice - (mintPrice * this.PLATFORM_FEE_PERCENTAGE) / 100
    };
  }

  /**
   * Calculate optimal mint price based on desired creator earnings
   */
  calculateOptimalMintPrice(desiredCreatorEarningsPerNft: number) {
    // Creator earnings = mintPrice * (1 - platformFeePercentage/100)
    // desiredCreatorEarningsPerNft = mintPrice * (1 - 7.5/100)
    // desiredCreatorEarningsPerNft = mintPrice * 0.925
    // mintPrice = desiredCreatorEarningsPerNft / 0.925
    
    const mintPrice = desiredCreatorEarningsPerNft / (1 - this.PLATFORM_FEE_PERCENTAGE / 100);
    const platformFeePerNft = mintPrice - desiredCreatorEarningsPerNft;

    return {
      mintPrice: parseFloat(mintPrice.toFixed(4)),
      creatorEarningsPerNft: desiredCreatorEarningsPerNft,
      platformFeePerNft: parseFloat(platformFeePerNft.toFixed(4)),
      platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE
    };
  }
}

export const nftLaunchpadService = new NftLaunchpadService();

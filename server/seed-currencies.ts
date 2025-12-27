import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { supportedCurrencies } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client, { schema: { supportedCurrencies } });

// Seed initial supported currencies
export async function seedCurrencies() {
  const currencies = [
    // Ethereum Mainnet
    { symbol: "ETH", name: "Ethereum", chainId: "1", contractAddress: null, decimals: "18", isStablecoin: "false", isActive: "true", icon: "⟠" },
    { symbol: "USDC", name: "USD Coin", chainId: "1", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: "6", isStablecoin: "true", isActive: "true", icon: "💵" },
    { symbol: "DAI", name: "Dai Stablecoin", chainId: "1", contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: "18", isStablecoin: "true", isActive: "true", icon: "◈" },
    { symbol: "USDT", name: "Tether USD", chainId: "1", contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: "6", isStablecoin: "true", isActive: "true", icon: "₮" },
    
    // Sepolia Testnet
    { symbol: "ETH", name: "Sepolia Ether", chainId: "11155111", contractAddress: null, decimals: "18", isStablecoin: "false", isActive: "true", icon: "⟠" },
    
    // Base
    { symbol: "ETH", name: "Ethereum (Base)", chainId: "8453", contractAddress: null, decimals: "18", isStablecoin: "false", isActive: "true", icon: "⟠" },
    { symbol: "USDC", name: "USD Coin (Base)", chainId: "8453", contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: "6", isStablecoin: "true", isActive: "true", icon: "💵" },
    
    // Polygon
    { symbol: "MATIC", name: "Polygon", chainId: "137", contractAddress: null, decimals: "18", isStablecoin: "false", isActive: "true", icon: "⬡" },
    { symbol: "USDC", name: "USD Coin (Polygon)", chainId: "137", contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: "6", isStablecoin: "true", isActive: "true", icon: "💵" },
    { symbol: "DAI", name: "Dai (Polygon)", chainId: "137", contractAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: "18", isStablecoin: "true", isActive: "true", icon: "◈" },
  ];

  console.log("🌱 Seeding supported currencies...");
  
  for (const currency of currencies) {
    try {
      // Check if currency already exists
      const existing = await db.query.supportedCurrencies.findFirst({
        where: and(
          eq(supportedCurrencies.symbol, currency.symbol),
          eq(supportedCurrencies.chainId, currency.chainId)
        ),
      });

      if (!existing) {
        await db.insert(supportedCurrencies).values(currency);
        console.log(`✅ Added ${currency.symbol} on chain ${currency.chainId}`);
      } else {
        console.log(`⏭️  ${currency.symbol} on chain ${currency.chainId} already exists`);
      }
    } catch (error) {
      console.error(`❌ Failed to add ${currency.symbol}:`, error);
    }
  }
  
  console.log("✅ Currency seeding complete!");
}

// Run if executed directly
seedCurrencies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

import type { IStorage } from "./storage";

export async function seedPlatformAddresses(storage: IStorage) {
  console.log("🔐 Seeding platform addresses...");
  
  const platformAddresses = [
    {
      address: process.env.VITE_MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      label: "Merchant Payment Address",
      category: "payment",
      description: "Main merchant address for accepting crypto payments",
      addedBy: "system"
    },
    {
      address: "0x093050017e0374A5777476b3B9Da94244612F980",
      label: "Deposits Contract",
      category: "deposits",
      description: "Contract for handling user deposits",
      addedBy: "system"
    },
  ];
  
  for (const platformAddr of platformAddresses) {
    try {
      const exists = await storage.isPlatformAddress(platformAddr.address);
      if (!exists) {
        await storage.addPlatformAddress(platformAddr);
        console.log(`✅ Added platform address: ${platformAddr.label} (${platformAddr.address.slice(0, 10)}...)`);
      } else {
        console.log(`⏭️  Platform address already exists: ${platformAddr.label}`);
      }
    } catch (error) {
      console.error(`Failed to seed platform address ${platformAddr.label}:`, error);
    }
  }
  
  // Automatically seed all house vault addresses
  try {
    const vaults = await storage.getAllHouseVaults();
    console.log(`📦 Found ${vaults.length} house vaults to whitelist`);
    
    for (const vault of vaults) {
      try {
        const exists = await storage.isPlatformAddress(vault.vaultAddress);
        if (!exists) {
          await storage.addPlatformAddress({
            address: vault.vaultAddress,
            label: `${vault.name} Contract`,
            category: "vault",
            description: `House vault for ${vault.tier} tier staking (${vault.apy}% APY)`,
            addedBy: "system"
          });
          console.log(`✅ Added vault address: ${vault.name} (${vault.vaultAddress.slice(0, 10)}...)`);
        } else {
          console.log(`⏭️  Vault address already exists: ${vault.name}`);
        }
      } catch (error) {
        console.error(`Failed to seed vault address ${vault.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to fetch house vaults for seeding:", error);
  }
  
  console.log("✅ Platform address seeding complete");
}

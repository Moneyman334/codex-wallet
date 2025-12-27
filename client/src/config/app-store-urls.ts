// App Store URLs Configuration
// Update these URLs when your apps are approved and live on the stores

export const APP_STORE_CONFIG = {
  // Google Play Store
  googlePlay: {
    enabled: false, // Set to true when app is live
    url: '', // Add your Google Play URL here when approved
    // Example: 'https://play.google.com/store/apps/details?id=com.omniversesyndicate.codex'
  },
  
  // Apple App Store
  appStore: {
    enabled: false, // Set to true when app is live
    url: '', // Add your App Store URL here when approved
    // Example: 'https://apps.apple.com/us/app/codex wallet/id1234567890'
  },
  
  // App metadata
  appName: 'CODEX Wallet',
  appDescription: 'Crypto payment processing and Web3 ecosystem',
  version: '1.0.0',
};

// Helper function to check if any store is enabled
export const hasLiveApp = () => {
  return APP_STORE_CONFIG.googlePlay.enabled || APP_STORE_CONFIG.appStore.enabled;
};

// Helper to get active store URLs
export const getActiveStores = () => {
  const stores = [];
  if (APP_STORE_CONFIG.googlePlay.enabled) {
    stores.push({ name: 'Google Play', url: APP_STORE_CONFIG.googlePlay.url });
  }
  if (APP_STORE_CONFIG.appStore.enabled) {
    stores.push({ name: 'App Store', url: APP_STORE_CONFIG.appStore.url });
  }
  return stores;
};

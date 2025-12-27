import { Capacitor } from '@capacitor/core';

export const isIOSPlatform = () => Capacitor.getPlatform() === 'ios';
export const isNativePlatform = () => Capacitor.isNativePlatform();

// Only enable iOS lite mode when running as native iOS app
// Website in Safari should have full access
export const IOS_LITE_MODE = {
  enabled: isNativePlatform() && isIOSPlatform(),
  
  allowedRoutes: [
    '/',
    '/wallet',
    '/portfolio',
    '/transactions',
    '/tokens',
    '/nfts',
    '/settings',
    '/notifications',
    '/security-center',
    '/terms',
    '/privacy',
    '/faq',
    '/delete-account',
    '/mobile-app',
  ],
  
  hiddenFeatures: [
    'trading',
    'live-trading',
    'swap',
    'bridge',
    'staking',
    'real-staking',
    'codex-staking',
    'auto-compound',
    'dex',
    'nft-marketplace',
    'copy-trading',
    'margin-trading',
    'social-trading',
    'trading-bot',
    'auto-trading-bot',
    'sentinel-bot',
    'bot-dashboard',
    'bot-config',
    'bot-subscription',
    'codex-pay',
    'codex-pay-admin',
    'codex-pay-checkout',
    'codex-pay-beta',
    'codex-atm',
    'token-creator',
    'nft-creator',
    'auto-deploy',
    'token-launchpad',
    'yield-farming',
    'p2p-lending',
    'dao',
    'prediction-markets',
    'empire',
    'empire-vault',
    'empire-api',
    'house-vaults',
    'crypto-payments',
    'checkout',
    'deposits',
    'instant-settlement',
  ],
};

export function isFeatureAllowedOnIOS(feature: string): boolean {
  if (!IOS_LITE_MODE.enabled) return true;
  return !IOS_LITE_MODE.hiddenFeatures.includes(feature);
}

export function isRouteAllowedOnIOS(route: string): boolean {
  if (!IOS_LITE_MODE.enabled) return true;
  
  const normalizedRoute = route.split('?')[0];
  
  return IOS_LITE_MODE.allowedRoutes.some(allowed => {
    if (allowed === normalizedRoute) return true;
    if (allowed.endsWith('*') && normalizedRoute.startsWith(allowed.slice(0, -1))) return true;
    return false;
  });
}

export function getIOSLiteMessage(): string {
  return "This feature is coming soon to the iOS app. Visit getcodexpay.com on your computer for full access.";
}

export function isHiddenOnIOS(featureId: string): boolean {
  return IOS_LITE_MODE.hiddenFeatures.includes(featureId);
}

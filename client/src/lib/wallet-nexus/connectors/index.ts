import { WalletConnector, WalletType } from '../types';
import { MetaMaskConnector } from './metamask';
import { DemoMetaMaskConnector } from './demo';

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('codex_demo_mode') === 'true';
}

export const connectors: Record<WalletType, WalletConnector> = {
  metamask: new MetaMaskConnector(),
  walletconnect: null as any,
  trust: null as any,
  phantom: null as any,
  ledger: null as any,
  trezor: null as any,
};

const demoConnectors: Record<WalletType, WalletConnector> = {
  metamask: new DemoMetaMaskConnector(),
  walletconnect: null as any,
  trust: null as any,
  phantom: null as any,
  ledger: null as any,
  trezor: null as any,
};

export function getConnector(type: WalletType): WalletConnector {
  const connectorsToUse = isDemoMode() ? demoConnectors : connectors;
  const connector = connectorsToUse[type];
  if (!connector) {
    throw new Error(`Connector for ${type} not implemented yet`);
  }
  return connector;
}

export function getAvailableConnectors(): WalletConnector[] {
  const connectorsToUse = isDemoMode() ? demoConnectors : connectors;
  return Object.values(connectorsToUse).filter(c => c !== null);
}

export * from './metamask';
export * from './demo';

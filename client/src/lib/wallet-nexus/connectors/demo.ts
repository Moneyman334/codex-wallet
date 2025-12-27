import { BaseWalletConnector } from './base';
import { WalletInfo, TransactionRequest, WalletType } from '../types';
import { demoData } from '@/hooks/use-demo-mode';

export class DemoMetaMaskConnector extends BaseWalletConnector {
  type: WalletType = 'metamask';
  name = 'Web3 Wallet (Demo)';
  icon = '🔗';
  description = 'Connect to demo wallet for testing';
  isMobileSupported = true;

  isInstalled(): boolean {
    return true;
  }

  async checkConnection(): Promise<WalletInfo | null> {
    const sessionData = localStorage.getItem('codex_wallet_nexus_demo_session');
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    const demoWallet = session.wallets?.find((w: WalletInfo) => w.type === 'metamask');
    return demoWallet || null;
  }

  async connect(): Promise<WalletInfo> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const demoWallet = demoData.demoWallets[0];
    
    const walletInfo: WalletInfo = {
      ...demoWallet,
      id: this.generateWalletId(demoWallet.address, this.type),
      isConnected: true,
      lastUsed: Date.now(),
    };

    this.saveDemoSession(walletInfo);

    return walletInfo;
  }

  async disconnect(walletId: string): Promise<void> {
    const sessionData = localStorage.getItem('codex_wallet_nexus_demo_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.wallets = session.wallets?.filter((w: WalletInfo) => w.id !== walletId) || [];
      localStorage.setItem('codex_wallet_nexus_demo_session', JSON.stringify(session));
    }
  }

  async switchChain(walletId: string, chainId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async getBalance(walletId: string): Promise<string> {
    return demoData.demoWallets[0].balance || '0';
  }

  async signMessage(walletId: string, message: string): Promise<string> {
    return '0xdemo_signature_' + message.slice(0, 20) + '_' + Date.now();
  }

  async sendTransaction(walletId: string, tx: TransactionRequest): Promise<string> {
    return '0xdemo_tx_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  private saveDemoSession(wallet: WalletInfo): void {
    const sessionData = localStorage.getItem('codex_wallet_nexus_demo_session');
    const session = sessionData ? JSON.parse(sessionData) : { wallets: [], primaryWalletId: null };
    
    const existingIndex = session.wallets?.findIndex((w: WalletInfo) => w.id === wallet.id);
    if (existingIndex >= 0) {
      session.wallets[existingIndex] = wallet;
    } else {
      session.wallets = [...(session.wallets || []), wallet];
    }

    if (!session.primaryWalletId) {
      session.primaryWalletId = wallet.id;
    }

    localStorage.setItem('codex_wallet_nexus_demo_session', JSON.stringify(session));
  }
}

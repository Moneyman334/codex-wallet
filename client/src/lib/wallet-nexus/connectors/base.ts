import { WalletConnector, WalletType, WalletInfo, TransactionRequest } from '../types';
import { formatBalanceFromWei } from '@/lib/utils';

export abstract class BaseWalletConnector implements WalletConnector {
  abstract type: WalletType;
  abstract name: string;
  abstract icon: string;
  abstract description: string;
  abstract isMobileSupported: boolean;

  abstract isInstalled(): boolean;
  abstract checkConnection(): Promise<WalletInfo | null>;
  abstract connect(): Promise<WalletInfo>;
  abstract disconnect(walletId: string): Promise<void>;
  abstract switchChain(walletId: string, chainId: string): Promise<void>;
  abstract getBalance(walletId: string): Promise<string>;
  abstract signMessage(walletId: string, message: string): Promise<string>;
  abstract sendTransaction(walletId: string, tx: TransactionRequest): Promise<string>;

  protected generateWalletId(address: string, type: WalletType): string {
    return `${type}-${address.toLowerCase()}`;
  }

  protected isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  protected formatBalance(balance: bigint, decimals: number = 18): string {
    return formatBalanceFromWei(balance, decimals, 4);
  }
}

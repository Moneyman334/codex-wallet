import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, ExternalLink, Trash2, Star, RefreshCw } from 'lucide-react';
import { WalletInfo } from '@/lib/wallet-nexus/types';
import { useWalletNexus } from '@/lib/wallet-nexus';
import { useToast } from '@/hooks/use-toast';

interface WalletCardProps {
  wallet: WalletInfo;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { disconnectWallet, setPrimaryWallet, refreshWallet } = useWalletNexus();
  const { toast } = useToast();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard',
    });
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet(wallet.id);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleSetPrimary = () => {
    if (!wallet.isPrimary) {
      setPrimaryWallet(wallet.id);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshWallet(wallet.id);
      toast({
        title: 'Balance Refreshed',
        description: 'Wallet balance updated successfully',
      });
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
    }
  };

  return (
    <Card
      className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20 border-purple-500/30 hover:border-purple-500/60 transition-all group"
      data-testid={`wallet-card-${wallet.id}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{wallet.type === 'metamask' ? '🦊' : '🔵'}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white" data-testid={`text-wallet-name-${wallet.id}`}>
                  {wallet.name}
                </h3>
                {wallet.isPrimary && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" data-testid="badge-primary">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400" />
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400 flex items-center gap-2" data-testid={`text-address-${wallet.id}`}>
                {formatAddress(wallet.address)}
                <button
                  onClick={handleCopyAddress}
                  className="hover:text-purple-400 transition-colors"
                  data-testid={`button-copy-address-${wallet.id}`}
                >
                  <Copy className="h-3 w-3" />
                </button>
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-purple-500/20"
                data-testid={`button-wallet-menu-${wallet.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-purple-500/30">
              <DropdownMenuItem
                onClick={handleRefresh}
                className="hover:bg-purple-500/20"
                data-testid={`menu-item-refresh-${wallet.id}`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Balance
              </DropdownMenuItem>
              {!wallet.isPrimary && (
                <DropdownMenuItem
                  onClick={handleSetPrimary}
                  className="hover:bg-purple-500/20"
                  data-testid={`menu-item-set-primary-${wallet.id}`}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Set as Primary
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDisconnect}
                className="hover:bg-red-500/20 text-red-400"
                data-testid={`menu-item-disconnect-${wallet.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Balance</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" data-testid={`text-balance-${wallet.id}`}>
              {wallet.balance} {wallet.nativeSymbol}
            </span>
          </div>

          {wallet.chainId && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Network</span>
              <Badge variant="outline" className="border-purple-500/30" data-testid={`text-network-${wallet.id}`}>
                {wallet.chainType.toUpperCase()}
              </Badge>
            </div>
          )}

          {wallet.isConnected && (
            <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30" data-testid={`status-connected-${wallet.id}`}>
              🟢 Connected
            </Badge>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>
    </Card>
  );
}

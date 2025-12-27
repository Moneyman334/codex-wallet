import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useWalletNexus } from '@/lib/wallet-nexus';
import { WalletType } from '@/lib/wallet-nexus/types';
import { getAvailableConnectors } from '@/lib/wallet-nexus/connectors';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
  const { connectWallet, isConnecting } = useWalletNexus();
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);

  const availableConnectors = getAvailableConnectors();

  const handleConnect = async (type: WalletType) => {
    setSelectedWallet(type);
    try {
      await connectWallet(type);
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setSelectedWallet(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20 border-purple-500/30 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Codex Wallet Nexus
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {availableConnectors.map((connector) => {
            const isCurrentlyConnecting = isConnecting && selectedWallet === connector.type;
            const isInstalled = connector.isInstalled();

            return (
              <Card
                key={connector.type}
                className="relative overflow-hidden bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer group"
                onClick={() => !isCurrentlyConnecting && handleConnect(connector.type)}
                data-testid={`wallet-option-${connector.type}`}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="text-4xl">{connector.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {connector.name}
                    </h3>
                    <p className="text-sm text-gray-400">{connector.description}</p>
                    {!isInstalled && (
                      <p className="text-xs text-yellow-500 mt-1">Not installed</p>
                    )}
                  </div>
                  {isCurrentlyConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/20"
                      data-testid={`button-connect-${connector.type}`}
                    >
                      Connect
                    </Button>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </Card>
            );
          })}
        </div>

        <div className="text-xs text-gray-400 text-center">
          🔒 Your connection is secure and encrypted
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import type { Address, Hash } from "viem";
import {
  fetchUserStake,
  stakeFixedAmount,
  waitForTransaction,
  getSepoliaExplorerUrl,
  STAKING_CONTRACT_ADDRESS,
  isContractConfigured,
} from "../lib/stakingClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ExternalLink, Loader2, Wallet, Share2 } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";
import { useBiometric } from "@/hooks/use-biometric";
import { useShare } from "@/hooks/use-share";
import { useToast } from "@/hooks/use-toast";

interface RealStakingCardProps {
  account?: string | null;
}

export const RealStakingCard = ({ account }: RealStakingCardProps) => {
  const [staked, setStaked] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [status, setStatus] = useState<string>("");
  const [configured] = useState(isContractConfigured());
  const { heavyImpact, successNotification, errorNotification, mediumImpact } = useHaptics();
  const { isEnabled: biometricEnabled, authenticate: biometricAuth, biometryTypeName } = useBiometric();
  const { shareTransaction, isSharing } = useShare();
  const { toast } = useToast();

  const handleShareStake = async () => {
    if (txHash) {
      mediumImpact();
      const explorerUrl = getSepoliaExplorerUrl(txHash);
      const result = await shareTransaction(txHash, "Staking", explorerUrl);
      if (result) {
        successNotification();
        toast({
          title: "Shared",
          description: "Staking transaction shared successfully",
        });
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadStake() {
      if (!account || !configured) return;
      
      try {
        const stake = await fetchUserStake(account);
        if (cancelled) return;
        setStaked(stake.amountEth);
      } catch (err) {
        console.error("Failed to load stake:", err);
      }
    }

    loadStake();
    return () => {
      cancelled = true;
    };
  }, [account, configured]);

  async function handleStake() {
    heavyImpact();
    
    if (!account) {
      errorNotification();
      setStatus("Please connect your wallet first.");
      return;
    }

    if (!configured) {
      errorNotification();
      setStatus("Contract not configured. Deploy the SimpleStaking contract on Sepolia first.");
      return;
    }

    if (biometricEnabled) {
      const authenticated = await biometricAuth(`Authenticate with ${biometryTypeName} to stake 0.01 ETH`);
      if (!authenticated) {
        errorNotification();
        setStatus(`${biometryTypeName} verification failed. Staking cancelled.`);
        return;
      }
    }

    try {
      setLoading(true);
      setStatus("Sending transaction…");

      const hash = await stakeFixedAmount("0.01");
      setTxHash(hash);
      setStatus("Waiting for confirmation on Sepolia…");

      const ok = await waitForTransaction(hash);
      if (!ok) {
        errorNotification();
        setStatus("Transaction failed – please check Etherscan.");
        return;
      }

      const stake = await fetchUserStake(account);
      setStaked(stake.amountEth);
      successNotification();
      setStatus("✅ Stake successful and synced from chain.");
    } catch (err: any) {
      console.error(err);
      errorNotification();
      setStatus(`Error: ${err?.message ?? "Transaction failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-[#0b0c12] to-[#1a1b26] border-[#2c2f3a] shadow-lg" data-testid="card-real-staking">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <span className="text-2xl">⛓️</span>
          Real On-Chain Staking (Sepolia)
        </CardTitle>
        <p className="text-xs text-slate-400">
          Stakes are stored in your SimpleStaking contract at{" "}
          <span className="font-mono text-[11px]">
            {STAKING_CONTRACT_ADDRESS.slice(0, 6)}…
            {STAKING_CONTRACT_ADDRESS.slice(-4)}
          </span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!configured && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-yellow-400">
              Contract not deployed. Update STAKING_CONTRACT_ADDRESS in stakingClient.ts
            </span>
          </div>
        )}

        {configured && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-400">
              Contract configured and ready for staking
            </span>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connected wallet
            </span>
            <span className="font-mono text-slate-100" data-testid="text-connected-wallet">
              {account
                ? `${account.slice(0, 6)}…${account.slice(-4)}`
                : "Not connected"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Staked (on-chain)</span>
            <span className="font-semibold text-emerald-300" data-testid="text-staked-amount">
              {staked.toFixed(4)} ETH
            </span>
          </div>
        </div>

        <Button
          onClick={handleStake}
          disabled={loading || !account || !configured}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
          data-testid="button-stake-eth"
          haptic="heavy"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            "Stake 0.01 ETH on Sepolia"
          )}
        </Button>

        {status && (
          <p className="text-xs text-slate-300 leading-snug whitespace-pre-line" data-testid="text-status">
            {status}
          </p>
        )}

        {txHash && (
          <div className="flex items-center justify-between gap-2">
            <a
              href={getSepoliaExplorerUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 underline"
              data-testid="link-etherscan"
            >
              View transaction on Etherscan
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareStake}
              disabled={isSharing}
              className="text-xs text-slate-400 hover:text-slate-300 h-7"
              data-testid="share-staking-button"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

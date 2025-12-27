import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Zap, DollarSign, Sparkles } from "lucide-react";
import { DEMO_MODE, getDemoBanner } from "@/lib/demo-mode";

interface DemoModeBannerProps {
  page?: 'games' | 'homepage' | 'gamePlay';
  className?: string;
}

export default function DemoModeBanner({ page = 'homepage', className = '' }: DemoModeBannerProps) {
  if (!DEMO_MODE.enabled) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Demo Mode Alert */}
      <Alert className="border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-orange-900/20">
        <Info className="h-5 w-5 text-yellow-400" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-100 font-medium">{getDemoBanner(page)}</span>
            {DEMO_MODE.licensing.waitlistEnabled && (
              <Badge className="bg-purple-600 hover:bg-purple-700">
                Join Waitlist for Real Money Launch!
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Revenue Features Live Banner */}
      {page === 'homepage' && (
        <Alert className="border-2 border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
          <Zap className="h-5 w-5 text-green-400" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-green-100 font-bold mr-2">💰 LIVE FEATURES:</span>
              <span className="text-green-200">
                CODEX Pay (Beta) • NFT Marketplace (Live) • Crypto Trading • All Functional!
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Play Money Balance (for game pages) */}
      {(page === 'games' || page === 'gamePlay') && (
        <div className="flex items-center justify-center gap-4 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-gray-300">Play Money Balance:</span>
            <Badge className="bg-purple-600 text-white px-4 py-1 text-lg">
              ${DEMO_MODE.initialCredits.toFixed(2)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="h-4 w-4" />
            <span>Free $10 daily bonus • $10 per referral</span>
          </div>
        </div>
      )}
    </div>
  );
}

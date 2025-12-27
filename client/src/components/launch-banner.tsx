import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Rocket, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function LaunchBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("codex_launch_banner_dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("codex_launch_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white" data-testid="launch-banner">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Rocket className="h-5 w-5 animate-bounce" />
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/30 shrink-0">
                  🎉 NOW LIVE
                </Badge>
                <span className="font-semibold text-sm sm:text-base">
                  CODEX Platform Officially Launched!
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                55+ Web3 features now available • Early adopters get exclusive NFT badges
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/achievements">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                data-testid="button-claim-badge"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Claim Badge
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/10"
              data-testid="button-dismiss-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

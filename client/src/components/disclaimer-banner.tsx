import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DisclaimerBannerProps {
  type?: "trading" | "gambling" | "leverage" | "crypto" | "general";
  className?: string;
}

const DISCLAIMER_MESSAGES = {
  trading: {
    icon: AlertTriangle,
    variant: "destructive" as const,
    message: "High Risk Trading Warning: Cryptocurrency trading involves substantial risk of loss. Past performance does not guarantee future results. Never invest more than you can afford to lose. All trades are executed at your own risk.",
  },
  gambling: {
    icon: Info,
    variant: "default" as const,
    message: "Entertainment Games Disclaimer: This platform features simulated entertainment games for fun purposes only. All games are virtual and simulated. Virtual winnings have no monetary value. 18+ only.",
  },
  leverage: {
    icon: AlertTriangle,
    variant: "destructive" as const,
    message: "Extreme Risk - Leverage Trading: Margin and futures trading with up to 20x leverage can result in total loss of your investment. Liquidation can occur rapidly during market volatility. Only experienced traders should use leverage. You can lose more than your initial deposit.",
  },
  crypto: {
    icon: AlertTriangle,
    variant: "default" as const,
    message: "Cryptocurrency Risk Disclosure: Cryptocurrencies are highly volatile and unregulated. Prices can fluctuate dramatically. This platform is not a licensed financial institution. No investment advice is provided. Conduct your own research (DYOR) before making any financial decisions.",
  },
  general: {
    icon: Info,
    variant: "default" as const,
    message: "Platform Disclaimer: This platform is for informational and entertainment purposes. All services are provided 'as-is' without warranties. Not available in restricted jurisdictions. Users are responsible for compliance with local laws and regulations, including KYC/AML requirements.",
  },
};

export default function DisclaimerBanner({ type = "general", className = "" }: DisclaimerBannerProps) {
  const disclaimer = DISCLAIMER_MESSAGES[type];
  const Icon = disclaimer.icon;

  return (
    <Alert variant={disclaimer.variant} className={`mb-6 ${className}`} data-testid={`disclaimer-${type}`}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {disclaimer.message}
      </AlertDescription>
    </Alert>
  );
}

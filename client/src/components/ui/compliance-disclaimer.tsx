import { AlertTriangle, Info, Shield, TestTube } from "lucide-react";

type DisclaimerType = 'beta' | 'financial' | 'thirdParty' | 'estimated' | 'trading';

interface ComplianceDisclaimerProps {
  type: DisclaimerType;
  className?: string;
}

const disclaimerContent: Record<DisclaimerType, { icon: typeof Info; title: string; text: string; bgColor: string; borderColor: string; iconColor: string }> = {
  beta: {
    icon: TestTube,
    title: 'Beta Program',
    text: 'This feature is currently in beta. Features and availability may change. Results are not guaranteed.',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
  financial: {
    icon: AlertTriangle,
    title: 'Financial Disclaimer',
    text: 'Cryptocurrency investments carry significant risk. APY rates are variable and determined by blockchain protocols, not guaranteed. Past performance does not guarantee future results. Only invest what you can afford to lose.',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  thirdParty: {
    icon: Shield,
    title: 'Third-Party Services',
    text: 'This feature uses third-party off-ramp services. Fees, availability, and processing times are determined by these providers and may vary by region.',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  estimated: {
    icon: Info,
    title: 'Estimated Data',
    text: 'Values shown are estimates based on current market conditions. Actual values may vary. Historical performance data is simulated for demonstration purposes.',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
  },
  trading: {
    icon: AlertTriangle,
    title: 'Trading Risk Disclosure',
    text: 'Trading cryptocurrencies involves substantial risk of loss. Automated trading strategies do not guarantee profits. You could lose some or all of your investment.',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
  },
};

export function ComplianceDisclaimer({ type, className = '' }: ComplianceDisclaimerProps) {
  const content = disclaimerContent[type];
  const Icon = content.icon;

  return (
    <div className={`${content.bgColor} ${content.borderColor} border rounded-lg p-4 ${className}`} data-testid={`disclaimer-${type}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${content.iconColor} mt-0.5 flex-shrink-0`} />
        <div>
          <p className={`font-semibold text-sm ${content.iconColor} mb-1`}>{content.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{content.text}</p>
        </div>
      </div>
    </div>
  );
}

export function CompactDisclaimer({ text, className = '' }: { text: string; className?: string }) {
  return (
    <p className={`text-xs text-gray-500 ${className}`} data-testid="compact-disclaimer">
      {text}
    </p>
  );
}

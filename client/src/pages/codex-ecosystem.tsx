import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  Coins,
  Bot,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Image,
  Code,
  DollarSign,
  Users,
  Zap,
  Shield,
  Globe,
  Activity,
  Settings,
  ChevronRight,
  Star,
  ArrowUpRight,
  Lock,
  Unlock,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

interface EcosystemService {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status: "active" | "available" | "coming-soon";
  route: string;
  metrics?: {
    label: string;
    value: string;
  }[];
  quickActions?: {
    label: string;
    action: string;
  }[];
}

const services: EcosystemService[] = [
  {
    id: "codex-pay",
    name: "CODEX Pay",
    description: "Accept crypto payments with competitive fees. Join our beta program.",
    icon: DollarSign,
    category: "payments",
    status: "active",
    route: "/codex-pay",
    metrics: [
      { label: "Status", value: "Beta" },
      { label: "Settlement", value: "Direct*" },
    ],
    quickActions: [
      { label: "Open Dashboard", action: "/codex-pay" },
      { label: "Create Payment", action: "/codex-pay" },
    ],
  },
  {
    id: "empire-api",
    name: "Empire API",
    description: "Integrate our platform into your apps. Full developer API access.",
    icon: Code,
    category: "developer",
    status: "active",
    route: "/empire-api-portal",
    metrics: [
      { label: "Endpoints", value: "12+" },
      { label: "Rate Limit", value: "60-1000 RPM" },
    ],
    quickActions: [
      { label: "Developer Portal", action: "/empire-api-portal" },
      { label: "API Docs", action: "/empire-api-portal" },
    ],
  },
  {
    id: "trading-bots",
    name: "AI Trading Bots",
    description: "Automated trading with custom strategies. Set it and forget it.",
    icon: Bot,
    category: "trading",
    status: "active",
    route: "/trading-bot",
    metrics: [
      { label: "Strategies", value: "7+" },
      { label: "Execution", value: "24/7" },
    ],
    quickActions: [
      { label: "My Bots", action: "/trading-bot" },
      { label: "Create Bot", action: "/trading-bot" },
    ],
  },
  {
    id: "copy-trading",
    name: "Copy Trading",
    description: "Follow top traders automatically. Copy their success.",
    icon: Users,
    category: "trading",
    status: "active",
    route: "/copy-trading",
    metrics: [
      { label: "Traders", value: "100+" },
      { label: "Win Rate", value: "Up to 87%" },
    ],
    quickActions: [
      { label: "Browse Traders", action: "/copy-trading" },
      { label: "My Copies", action: "/copy-trading" },
    ],
  },
  {
    id: "nft-marketplace",
    name: "NFT Marketplace",
    description: "Buy and sell exclusive NFTs. 8 curated collections.",
    icon: Image,
    category: "nfts",
    status: "active",
    route: "/nft-marketplace",
    metrics: [
      { label: "Collections", value: "8" },
      { label: "Volume", value: "$2.4M+" },
    ],
    quickActions: [
      { label: "Browse NFTs", action: "/nft-marketplace" },
      { label: "My Collection", action: "/personal-collection" },
    ],
  },
  {
    id: "dex-aggregator",
    name: "DEX Aggregator",
    description: "Best prices across 6 exchanges. Smart routing.",
    icon: TrendingUp,
    category: "defi",
    status: "active",
    route: "/dex-aggregator",
    metrics: [
      { label: "Exchanges", value: "6" },
      { label: "Fee", value: "0.3%" },
    ],
    quickActions: [
      { label: "Swap Tokens", action: "/dex-aggregator" },
      { label: "Compare Prices", action: "/dex-aggregator" },
    ],
  },
  {
    id: "staking",
    name: "Real Staking",
    description: "Earn yield on ETH. Powered by DeFi protocols on-chain.",
    icon: Coins,
    category: "defi",
    status: "active",
    route: "/real-staking",
    metrics: [
      { label: "APY", value: "Up to 8%" },
      { label: "Protocol", value: "DeFi" },
    ],
    quickActions: [
      { label: "Stake Now", action: "/real-staking" },
      { label: "My Positions", action: "/real-staking" },
    ],
  },
  {
    id: "wallet-nexus",
    name: "Wallet Nexus",
    description: "Multi-chain wallet management. 22 networks supported.",
    icon: Wallet,
    category: "wallets",
    status: "active",
    route: "/wallet-nexus",
    metrics: [
      { label: "Networks", value: "22" },
      { label: "Assets", value: "All ERC-20/721" },
    ],
    quickActions: [
      { label: "Manage Wallets", action: "/wallet-nexus" },
      { label: "Add Network", action: "/wallet-nexus" },
    ],
  },
  {
    id: "bridge",
    name: "Cross-Chain Bridge",
    description: "Move assets across chains. Wormhole, LayerZero, CCIP.",
    icon: Globe,
    category: "defi",
    status: "active",
    route: "/bridge",
    metrics: [
      { label: "Protocols", value: "4" },
      { label: "Fee", value: "0.1%" },
    ],
    quickActions: [
      { label: "Bridge Assets", action: "/bridge" },
      { label: "View History", action: "/transactions" },
    ],
  },
  {
    id: "auto-deploy",
    name: "Token/NFT Factory",
    description: "Deploy ERC-20 tokens and ERC-721 NFTs instantly.",
    icon: Rocket,
    category: "developer",
    status: "active",
    route: "/auto-deploy",
    metrics: [
      { label: "Deploy Time", value: "<2 min" },
      { label: "Networks", value: "22" },
    ],
    quickActions: [
      { label: "Create Token", action: "/token-creator" },
      { label: "Create NFT", action: "/nft-creator" },
    ],
  },
  {
    id: "e-commerce",
    name: "E-Commerce Shop",
    description: "Crypto shopping with cart, discounts, and NFT receipts.",
    icon: ShoppingCart,
    category: "payments",
    status: "active",
    route: "/products",
    metrics: [
      { label: "Products", value: "50+" },
      { label: "Payment", value: "Crypto/Fiat" },
    ],
    quickActions: [
      { label: "Shop Now", action: "/products" },
      { label: "My Orders", action: "/orders" },
    ],
  },
  {
    id: "games",
    name: "Entertainment Games",
    description: "Entertainment games with instant crypto rewards.",
    icon: PlayCircle,
    category: "gaming",
    status: "active",
    route: "/games",
    metrics: [
      { label: "Games", value: "10+" },
      { label: "RNG", value: "Server-side" },
    ],
    quickActions: [
      { label: "Play Games", action: "/games" },
      { label: "House Vaults", action: "/vaults" },
    ],
  },
  {
    id: "social-automation",
    name: "Social Automation",
    description: "Schedule tweets, manage campaigns, grow your presence.",
    icon: Activity,
    category: "marketing",
    status: "active",
    route: "/social-automation",
    metrics: [
      { label: "Platforms", value: "Twitter" },
      { label: "Scheduling", value: "24/7" },
    ],
    quickActions: [
      { label: "Manage Campaigns", action: "/social-automation" },
      { label: "Analytics", action: "/marketing" },
    ],
  },
  {
    id: "security-center",
    name: "Security Center",
    description: "Multi-layer protection, fraud detection, emergency lockdown.",
    icon: Shield,
    category: "security",
    status: "active",
    route: "/security-center",
    metrics: [
      { label: "Protection", value: "CCSS/SOC 2" },
      { label: "Monitoring", value: "Real-time" },
    ],
    quickActions: [
      { label: "Security Dashboard", action: "/security-center" },
      { label: "Transparency Hub", action: "/transparency" },
    ],
  },
  {
    id: "billionaire-mode",
    name: "Billionaire Autopilot",
    description: "Auto-compound, auto-trade, auto-earn. Passive wealth building.",
    icon: Zap,
    category: "automation",
    status: "active",
    route: "/billionaire-mode",
    metrics: [
      { label: "Automation", value: "Full" },
      { label: "Strategies", value: "10+" },
    ],
    quickActions: [
      { label: "Enable Autopilot", action: "/billionaire-mode" },
      { label: "Settings", action: "/billionaire-mode" },
    ],
  },
];

export default function CodexEcosystemPage() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const categories = [
    { id: "all", label: "All Services", icon: Star },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "trading", label: "Trading", icon: TrendingUp },
    { id: "defi", label: "DeFi", icon: Coins },
    { id: "nfts", label: "NFTs", icon: Image },
    { id: "developer", label: "Developer", icon: Code },
    { id: "wallets", label: "Wallets", icon: Wallet },
    { id: "marketing", label: "Marketing", icon: Activity },
    { id: "security", label: "Security", icon: Shield },
    { id: "automation", label: "Automation", icon: Zap },
    { id: "gaming", label: "Gaming", icon: PlayCircle },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "available":
        return <Unlock className="w-4 h-4 text-blue-400" />;
      default:
        return <Lock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>;
      case "available":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Available</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Coming Soon</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2 text-lg">
              CODEX ECOSYSTEM
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text">
            Everything. Everywhere. Anytime.
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Access every service, feature, and capability in the CODEX Wallet ecosystem.
            Your complete Web3 platform in one place.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{services.filter(s => s.status === "active").length}</div>
              <div className="text-sm text-gray-400">Active Services</div>
            </div>
            <div className="h-12 w-px bg-gray-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{services.length}</div>
              <div className="text-sm text-gray-400">Total Features</div>
            </div>
            <div className="h-12 w-px bg-gray-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">100%</div>
              <div className="text-sm text-gray-400">Available Now</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-11 bg-black/40 border border-purple-500/20 mb-8 h-auto p-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex flex-col items-center gap-1 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                  data-testid={`tab-${cat.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services
                  .filter((service) => category.id === "all" || service.category === category.id)
                  .map((service) => {
                    const Icon = service.icon;
                    return (
                      <Card
                        key={service.id}
                        className="bg-black/40 border-purple-500/20 hover:border-purple-500/40 transition-all group cursor-pointer backdrop-blur-xl"
                        onClick={() => navigate(service.route)}
                        data-testid={`service-card-${service.id}`}
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                              <Icon className="w-6 h-6 text-purple-400" />
                            </div>
                            {getStatusIcon(service.status)}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                                {service.name}
                              </h3>
                              {getStatusBadge(service.status)}
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {service.description}
                            </p>
                          </div>

                          {service.metrics && (
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
                              {service.metrics.map((metric, idx) => (
                                <div key={idx} className="flex-1">
                                  <div className="text-xs text-gray-500">{metric.label}</div>
                                  <div className="text-sm font-semibold text-purple-300">{metric.value}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {service.quickActions && service.status === "active" && (
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
                              {service.quickActions.map((action, idx) => (
                                <Button
                                  key={idx}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-between text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(action.action);
                                  }}
                                  data-testid={`quick-action-${service.id}-${idx}`}
                                >
                                  {action.label}
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              ))}
                            </div>
                          )}

                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(service.route);
                            }}
                            disabled={service.status === "coming-soon"}
                            data-testid={`button-launch-${service.id}`}
                          >
                            {service.status === "coming-soon" ? "Coming Soon" : "Launch"}
                            <ArrowUpRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
          <div className="p-8 text-center space-y-4">
            <div className="inline-block p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Star className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Never knowing the outcome, only believe in yourself
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The CODEX Philosophy - True strength comes from believing in yourself and moving forward with courage,
              regardless of uncertainty. Build your empire with every tool at your fingertips.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

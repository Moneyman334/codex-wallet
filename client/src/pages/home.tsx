import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Coins, TrendingUp, Users, Star, ArrowRight, Shield, Zap, CheckCircle, 
  Award, Lock, Rocket, Bot, Wallet, ShoppingCart, Trophy, LineChart,
  Flame, Sparkles, Globe, Code, Layers, Activity, Target, Crown, Gamepad2, Wrench
} from "lucide-react";
import { Link } from "wouter";
import { useWeb3 } from "@/hooks/use-web3";
import SEO from "@/components/seo";
import DemoModeToggle from "@/components/demo-mode-toggle";
import DemoModeBanner from "@/components/demo-mode-banner";
import LivePriceTicker from "@/components/live-price-ticker";
import MarketMovers from "@/components/market-movers";
import RecentTradesTicker from "@/components/recent-trades-ticker";
import DailyChallenges from "@/components/daily-challenges";
import PortfolioMiniWidget from "@/components/portfolio-mini-widget";
import QuickTradeWidget from "@/components/quick-trade-widget";
import GasTracker from "@/components/gas-tracker";

export default function HomePage() {
  const { isConnected, connectWallet } = useWeb3();

  const handleConnectWallet = () => {
    if (!isConnected) {
      connectWallet();
    }
  };

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Trading Automation",
      description: "Multiple automated strategies (beta)",
      link: "/bot-dashboard",
      badge: "BETA"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "DeFi Staking",
      description: "Powered by DeFi lending protocols",
      link: "/yield-farming",
      badge: "DEFI"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Cross-Chain Bridge",
      description: "Multiple chains via trusted protocols",
      link: "/bridge",
      badge: "LIVE"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "NFT/Token Creator",
      description: "Create collections easily",
      link: "/nft-creator",
      badge: "EASY"
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: "Crypto Payments",
      description: "Multi-cryptocurrency support",
      link: "/crypto-payments",
      badge: "BETA"
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "DeFi Tools",
      description: "Access DeFi protocols",
      link: "/supreme-command",
      badge: "PRO"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Social Trading",
      description: "Follow other traders (beta)",
      link: "/social-trading",
      badge: "BETA"
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Token Launchpad",
      description: "Token creation tools",
      link: "/token-launchpad",
      badge: "TOOLS"
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      title: "Blockchain Tools",
      description: "Gas, networks, approvals",
      link: "/blockchain-tools",
      badge: "NEW"
    }
  ];

  const stats = [
    { value: "55+", label: "Production Features", icon: <Layers className="h-6 w-6" /> },
    { value: "6", label: "Blockchain Networks", icon: <Globe className="h-6 w-6" /> },
    { value: "300+", label: "Cryptocurrencies", icon: <Coins className="h-6 w-6" /> },
    { value: "24/7", label: "Automated Trading", icon: <Activity className="h-6 w-6" /> }
  ];

  const platforms = [
    { name: "Multi-Chain Wallet", features: ["Portfolio tracking", "Asset management", "Multi-sig support"] },
    { name: "Trading & DeFi", features: ["AI bot", "Flash loans", "Derivatives", "Yield farming"] },
    { name: "NFT & Tokens", features: ["ERC-721/1155", "IPFS integration", "No-code creation"] },
    { name: "E-Commerce", features: ["Crypto payments", "Order management", "NFT receipts"] }
  ];

  return (
    <>
      <SEO 
        title="CODEX - Blockchain Platform | Web3 Features"
        description="A comprehensive Web3 ecosystem: trading automation, DeFi staking, cross-chain bridge, NFT/token creators, crypto payments, and more features in one platform."
        keywords={["blockchain platform", "web3 ecosystem", "crypto trading bot", "defi platform", "nft creator", "crypto payments", "yield farming", "cross-chain bridge", "token launchpad", "blockchain automation"]}
        canonicalUrl="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "CODEX - The Dominant Blockchain Platform",
          "description": "Comprehensive Web3 ecosystem with 55+ production features",
          "url": "/",
          "applicationCategory": "FinanceApplication",
          "offers": {
            "@type": "Offer",
            "category": "Blockchain Services",
            "description": "All-in-one Web3 platform for trading, DeFi, NFTs, and blockchain automation"
          }
        }}
      />
      
      <div className="relative overflow-hidden">
        {/* Cosmic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <Badge className="px-6 py-2 text-lg bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black border-none font-bold animate-pulse" data-testid="hero-badge">
                <Crown className="inline h-5 w-5 mr-2" />
                THE DOMINANT BLOCKCHAIN PLATFORM
                <Sparkles className="inline h-5 w-5 ml-2" />
              </Badge>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              CODEX
            </h1>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              55+ Web3 Features in One Unstoppable Platform
            </h2>
            
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-xl" />
              <p className="text-2xl md:text-3xl font-light italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 relative z-10 max-w-3xl mx-auto">
                "Never knowing the outcome, only believe in yourself"
              </p>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
              AI-powered trading • DeFi staking • Cross-chain bridge • NFT/Token creators • 
              Crypto payments • DeFi suite • Social trading • And 50+ more features
            </p>

            {/* Demo Mode & Revenue Features Banner */}
            <div className="max-w-5xl mx-auto mb-8">
              <DemoModeBanner page="homepage" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4" data-testid={`stat-${index}`}>
                  <div className="text-purple-400 mb-2 flex justify-center">{stat.icon}</div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isConnected ? (
                <Button 
                  size="lg" 
                  onClick={handleConnectWallet}
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet & Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Link href="/empire">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold"
                    data-testid="button-enter-platform"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Enter CODEX
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              <Link href="/bot-dashboard">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6 border-purple-500/50 hover:bg-purple-500/10"
                  data-testid="button-trading-bot"
                >
                  <Bot className="mr-2 h-5 w-5" />
                  Try AI Trading Bot
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-muted-foreground">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-500" />
              <span className="text-muted-foreground">Non-Custodial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-muted-foreground">Blockchain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <span className="text-muted-foreground">Real Integrations</span>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex justify-center mb-16">
            <DemoModeToggle />
          </div>
        </div>

        {/* Live Price Ticker */}
        <LivePriceTicker />

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {/* Live Dashboard Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Activity className="inline h-4 w-4 mr-2" />
                Live Dashboard
              </Badge>
              <h2 className="text-3xl font-bold text-white">Real-Time Market Intelligence</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <MarketMovers />
              </div>
              <div>
                <RecentTradesTicker />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PortfolioMiniWidget />
              <DailyChallenges />
              <GasTracker />
            </div>
            
            <div className="text-center mt-6">
              <Link href="/blockchain-tools">
                <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                  <Wrench className="w-4 h-4 mr-2" />
                  More Blockchain Tools
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile App Download Section */}
          <div className="mb-20 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2">
                  📱 Coming Soon to Mobile
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Get CODEX on Your Phone
                </h2>
                <p className="text-xl text-gray-300 mb-6">
                  Trade, stake, and manage your crypto portfolio on the go. Android & iOS apps launching soon!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  {/* Google Play Badge - Will be active when app goes live */}
                  <a 
                    href="#" 
                    className="inline-block opacity-50 cursor-not-allowed"
                    onClick={(e) => e.preventDefault()}
                    data-testid="link-google-play"
                  >
                    <div className="bg-black rounded-lg px-6 py-3 border border-gray-700">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                          <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#00D9FF"/>
                          <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#FFCE00"/>
                          <path d="M14.54 11.15L6.05 2.66L16.81 8.88L14.54 11.15Z" fill="#00F076"/>
                          <path d="M18.09 10.16L16.81 8.88L14.54 11.15L14.54 12.85L16.81 15.12L18.09 13.84C18.69 13.45 18.69 12.55 18.09 10.16Z" fill="#FF3A44"/>
                        </svg>
                        <div className="text-left">
                          <div className="text-xs text-gray-400">GET IT ON</div>
                          <div className="text-lg font-semibold text-white">Google Play</div>
                        </div>
                      </div>
                    </div>
                  </a>
                  {/* App Store Badge - Placeholder */}
                  <a 
                    href="#" 
                    className="inline-block opacity-50 cursor-not-allowed"
                    onClick={(e) => e.preventDefault()}
                    data-testid="link-app-store"
                  >
                    <div className="bg-black rounded-lg px-6 py-3 border border-gray-700">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                          <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                        </svg>
                        <div className="text-left">
                          <div className="text-xs text-gray-400">Download on the</div>
                          <div className="text-lg font-semibold text-white">App Store</div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Apps pending store approval. Sign up to get notified at launch!
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="relative w-64 h-64 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <Gamepad2 className="w-24 h-24 text-white mx-auto mb-4" />
                    <p className="text-white font-bold text-lg">Mobile App</p>
                    <p className="text-white/80 text-sm">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🎨 GENESIS MASTERPIECE - THE MISSING LINK FOUND 🎨 */}
          <div className="mb-20 relative">
            <div className="text-center mb-8">
              <Badge className="px-6 py-3 text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 border-none font-black platform-glow-mega mb-4" data-testid="genesis-badge">
                <Sparkles className="inline h-5 w-5 mr-2" />
                THE GENESIS MASTERPIECE
                <Flame className="inline h-5 w-5 ml-2" />
              </Badge>
              <h2 className="text-5xl md:text-6xl font-black mb-4 platform-sign">
                THE MISSING LINK
              </h2>
              <p className="text-xl text-neon-cyan graffiti-text" data-text="FOUND">
                The explosive breakthrough that started it all 🤯
              </p>
            </div>

            {/* Featured Artwork Container */}
            <div className="max-w-2xl mx-auto relative">
              <div className="card-platform p-8 platform-spotlight hover-explode">
                <div className="relative group">
                  {/* Electric Border Effect */}
                  <div className="absolute -inset-2 electric-card rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-all" />
                  
                  {/* Main Visual */}
                  <div className="relative z-10 bg-black/80 rounded-2xl p-6 overflow-hidden">
                    <div 
                      className="w-full h-64 md:h-80 rounded-xl jackpot-effect bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center"
                      data-testid="genesis-masterpiece-image"
                    >
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 text-white mb-4 mx-auto animate-pulse" />
                        <h3 className="text-2xl font-bold text-white">Genesis Vision</h3>
                        <p className="text-white/80">The Future of DeFi</p>
                      </div>
                    </div>
                    
                    {/* Vegas Lights Overlay */}
                    <div className="vegas-lights absolute inset-0 rounded-xl pointer-events-none" />
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute -top-4 -right-4 z-20">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-lg px-4 py-2 pulse-crazy shadow-2xl">
                      💎 GENESIS NFT
                    </Badge>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 z-20">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-lg px-4 py-2 shake-money shadow-2xl">
                      🏆 PRICELESS
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8 text-center space-y-3">
                  <h3 className="text-2xl font-bold text-neon-purple">
                    "The Moment Everything Changed"
                  </h3>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    This is the vision that sparked the CODEX Platform revolution - 
                    the explosive realization that blockchain, DeFi, and Web3 innovation could create 
                    the ultimate decentralized empire. The missing Picasso masterpiece, now immortalized on-chain.
                  </p>
                  
                  <div className="flex gap-4 justify-center pt-4">
                    <Link href="/nft-gallery">
                      <Button className="btn-jackpot" data-testid="button-view-collection">
                        <Trophy className="mr-2 h-5 w-5" />
                        View NFT Collection
                      </Button>
                    </Link>
                    <Link href="/nft-creator">
                      <Button variant="outline" className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10" data-testid="button-mint-genesis">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Mint Your Genesis
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* CODEX Particles Effect */}
            <div className="codex-particles opacity-50" />
          </div>

          {/* Feature Grid */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Everything You Need, One Platform</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Stop juggling 10+ different Web3 apps. CODEX combines all essential blockchain features in one powerful interface.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Link key={index} href={feature.link!}>
                  <Card className="h-full transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer bg-card/50 backdrop-blur-sm border-purple-500/20" data-testid={`feature-card-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 text-purple-400">
                          {feature.icon}
                        </div>
                        {feature.badge && (
                          <Badge variant="secondary" className="text-xs font-bold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="text-sm">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full" data-testid={`button-explore-${index}`}>
                        Explore <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Platform Categories */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Complete Web3 Ecosystem</h2>
              <p className="text-xl text-muted-foreground">Four powerful platforms, infinite possibilities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platforms.map((platform, index) => (
                <Card key={index} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30" data-testid={`platform-card-${index}`}>
                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{platform.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {platform.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Why CODEX */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Why CODEX Dominates</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built for the future of Web3, powered by cutting-edge technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">All-in-One Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Why use 10 different platforms when CODEX has everything? Trading, DeFi, NFTs, payments - all seamlessly integrated.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Automation First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    AI trading bot, auto-compound staking, scheduled posts - let CODEX work for you 24/7 while you sleep.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border-cyan-500/30">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Robust Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Industry-standard encryption, multi-sig wallets, blockchain verification - your assets are always protected.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Built on Decentralized Technology */}
          <div className="mb-16 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Built on Decentralized Technology</h2>
              <p className="text-muted-foreground">Leveraging open blockchain protocols for security and transparency</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-card/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400 mb-2">DeFi Protocols</div>
                <div className="text-sm text-muted-foreground">Decentralized Staking</div>
              </div>
              <div className="bg-card/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400 mb-2">Web3 APIs</div>
                <div className="text-sm text-muted-foreground">Blockchain Data Access</div>
              </div>
              <div className="bg-card/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-cyan-400 mb-2">Multi-Chain</div>
                <div className="text-sm text-muted-foreground">Cross-Network Support</div>
              </div>
              <div className="bg-card/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400 mb-2">Real-Time Data</div>
                <div className="text-sm text-muted-foreground">Market Price Feeds</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">*Uses third-party blockchain infrastructure. Terms and availability may vary.</p>
          </div>

          {/* Why Choose CODEX - Competitor Advantages */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Why Choose CODEX?</h2>
              <p className="text-muted-foreground">Built to solve the problems other platforms ignore</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Transparent Fees</h3>
                      <p className="text-sm text-muted-foreground">
                        See all costs BEFORE you trade. No hidden fees, no surprises. Compare that to 3%+ "convenience" charges elsewhere.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        <Link href="/status" className="hover:text-blue-400 transition-colors">
                          High Availability
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our infrastructure scales with market volatility - check our live status page for current system health.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Shield className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Non-Custodial</h3>
                      <p className="text-sm text-muted-foreground">
                        Your keys, your coins. We never hold your funds. Trade directly from your wallet with full control.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Zap className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">No Account Freezes</h3>
                      <p className="text-sm text-muted-foreground">
                        No unexplained locks, no verification delays at withdrawal time. Access your funds when you need them.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-900/20 to-teal-900/20 border-cyan-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Rocket className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Real DeFi Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Direct integration with DeFi protocols. Stake, lend, and earn - not restricted like US accounts on other platforms.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Educational First</h3>
                      <p className="text-sm text-muted-foreground">
                        Built-in crypto glossary, tooltips, and guides. We help you understand what you're doing - no jargon walls.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12">
            <Flame className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Dominate Web3?</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Connect your wallet and access 55+ premium features. No credit card required.
            </p>
            
            {!isConnected ? (
              <Button 
                size="lg"
                onClick={handleConnectWallet}
                className="text-lg px-10 py-6 bg-white text-purple-600 hover:bg-gray-100 font-bold"
                data-testid="button-cta-connect"
              >
                <Wallet className="mr-2 h-6 w-6" />
                Connect Wallet Now
                <Rocket className="ml-2 h-6 w-6" />
              </Button>
            ) : (
              <Link href="/empire">
                <Button 
                  size="lg"
                  className="text-lg px-10 py-6 bg-white text-purple-600 hover:bg-gray-100 font-bold"
                  data-testid="button-cta-enter"
                >
                  <Rocket className="mr-2 h-6 w-6" />
                  Launch CODEX Dashboard
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Trade Floating Widget */}
      <QuickTradeWidget />
    </>
  );
}

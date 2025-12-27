import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/seo";
import { APP_STORE_CONFIG } from "@/config/app-store-urls";
import {
  Smartphone,
  Zap,
  Bell,
  Shield,
  TrendingUp,
  Wallet,
  QrCode,
  Globe,
  Lock,
  Activity,
  CheckCircle,
  Download,
} from "lucide-react";

export default function MobileAppPage() {
  const features = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Multi-Chain Wallet",
      description: "Manage assets across 6+ blockchain networks in one secure mobile wallet",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-Time Trading",
      description: "Execute trades instantly with our AI-powered trading bot on the go",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Push Notifications",
      description: "Get instant alerts for transactions, price changes, and yield opportunities",
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR Code Payments",
      description: "Accept crypto payments in-person with built-in QR code scanner",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Biometric Security",
      description: "Face ID & fingerprint authentication for maximum protection",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Offline Mode",
      description: "View portfolio and transaction history even without internet",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Direct Settlements*",
      description: "Crypto payments to your mobile wallet",
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Live Analytics",
      description: "Track portfolio performance with real-time charts and insights",
    },
  ];

  const merchantFeatures = [
    "Monitor all CODEX Pay transactions",
    "Manage payment links and invoices",
    "View revenue analytics and reports",
    "Configure webhook notifications",
    "Settlement tracking",
    "Multi-currency support",
  ];

  return (
    <>
      <SEO
        title="Mobile App - CODEX Wallet | Crypto Payments on the Go"
        description="Download the CODEX Wallet mobile app for Android and iOS. Manage your crypto portfolio, accept payments, and trade from anywhere with enterprise-grade security."
        keywords={["crypto mobile app", "blockchain wallet app", "mobile crypto payments", "defi mobile", "crypto trading app"]}
        canonicalUrl="/mobile-app"
      />

      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-6 py-2 text-lg">
              📱 {APP_STORE_CONFIG.googlePlay.enabled || APP_STORE_CONFIG.appStore.enabled ? 'Now Available' : 'Coming Soon'}
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 text-transparent bg-clip-text">
              CODEX Wallet Mobile
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Your complete Web3 ecosystem in your pocket. Trade, stake, accept payments, and manage your crypto portfolio from anywhere.
            </p>

            {/* Download Badges */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {/* Google Play */}
              <a
                href={APP_STORE_CONFIG.googlePlay.enabled ? APP_STORE_CONFIG.googlePlay.url : '#'}
                className={`inline-block ${!APP_STORE_CONFIG.googlePlay.enabled && 'opacity-50 cursor-not-allowed'}`}
                onClick={(e) => !APP_STORE_CONFIG.googlePlay.enabled && e.preventDefault()}
                target={APP_STORE_CONFIG.googlePlay.enabled ? '_blank' : undefined}
                rel={APP_STORE_CONFIG.googlePlay.enabled ? 'noopener noreferrer' : undefined}
                data-testid="download-google-play"
              >
                <div className="bg-black rounded-lg px-8 py-4 border border-gray-700 hover:border-purple-500 transition-colors">
                  <div className="flex items-center gap-4">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                      <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#00D9FF"/>
                      <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#FFCE00"/>
                      <path d="M14.54 11.15L6.05 2.66L16.81 8.88L14.54 11.15Z" fill="#00F076"/>
                      <path d="M18.09 10.16L16.81 8.88L14.54 11.15L14.54 12.85L16.81 15.12L18.09 13.84C18.69 13.45 18.69 12.55 18.09 10.16Z" fill="#FF3A44"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">GET IT ON</div>
                      <div className="text-xl font-semibold text-white">Google Play</div>
                    </div>
                  </div>
                </div>
              </a>

              {/* App Store */}
              <a
                href={APP_STORE_CONFIG.appStore.enabled ? APP_STORE_CONFIG.appStore.url : '#'}
                className={`inline-block ${!APP_STORE_CONFIG.appStore.enabled && 'opacity-50 cursor-not-allowed'}`}
                onClick={(e) => !APP_STORE_CONFIG.appStore.enabled && e.preventDefault()}
                target={APP_STORE_CONFIG.appStore.enabled ? '_blank' : undefined}
                rel={APP_STORE_CONFIG.appStore.enabled ? 'noopener noreferrer' : undefined}
                data-testid="download-app-store"
              >
                <div className="bg-black rounded-lg px-8 py-4 border border-gray-700 hover:border-purple-500 transition-colors">
                  <div className="flex items-center gap-4">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
                      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Download on the</div>
                      <div className="text-xl font-semibold text-white">App Store</div>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {!APP_STORE_CONFIG.googlePlay.enabled && !APP_STORE_CONFIG.appStore.enabled && (
              <p className="text-sm text-gray-500 mt-4">
                Apps pending store approval. Check back soon!
              </p>
            )}
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl text-center p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">55+</div>
              <div className="text-sm text-gray-400">Features</div>
            </Card>
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl text-center p-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">6</div>
              <div className="text-sm text-gray-400">Blockchains</div>
            </Card>
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl text-center p-6">
              <div className="text-4xl font-bold text-green-400 mb-2">300+</div>
              <div className="text-sm text-gray-400">Cryptocurrencies</div>
            </Card>
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl text-center p-6">
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-sm text-gray-400">Trading</div>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Everything You Need on Mobile</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                All the power of our Web3 platform, optimized for your smartphone
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-black/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/50 transition-colors"
                  data-testid={`feature-${index}`}
                >
                  <CardHeader>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit mb-3 text-purple-400">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">*Features and availability may vary by region and platform.</p>
          </div>

          {/* Merchant Features */}
          <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Smartphone className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-white">CODEX Pay Merchant App</CardTitle>
                  <p className="text-gray-400 mt-1">Manage your payment processing business from anywhere</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchantFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Mobile Security</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your assets are protected with the same security standards as Fortune 500 companies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/40 border-purple-500/20 text-center p-6">
                <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Biometric Auth</h3>
                <p className="text-sm text-gray-400">Face ID and fingerprint protection</p>
              </Card>

              <Card className="bg-black/40 border-purple-500/20 text-center p-6">
                <Lock className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">End-to-End Encryption</h3>
                <p className="text-sm text-gray-400">Military-grade AES-256 encryption</p>
              </Card>

              <Card className="bg-black/40 border-purple-500/20 text-center p-6">
                <Activity className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Real-Time Monitoring</h3>
                <p className="text-sm text-gray-400">AI-powered fraud detection</p>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12">
            <Download className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">
              {APP_STORE_CONFIG.googlePlay.enabled || APP_STORE_CONFIG.appStore.enabled
                ? 'Download Now'
                : 'Get Notified at Launch'}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {APP_STORE_CONFIG.googlePlay.enabled || APP_STORE_CONFIG.appStore.enabled
                ? 'Start managing your crypto portfolio on the go'
                : 'Be the first to know when our mobile apps go live'}
            </p>

            {APP_STORE_CONFIG.googlePlay.enabled || APP_STORE_CONFIG.appStore.enabled ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {APP_STORE_CONFIG.googlePlay.enabled && (
                  <Button
                    size="lg"
                    asChild
                    className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
                  >
                    <a href={APP_STORE_CONFIG.googlePlay.url} target="_blank" rel="noopener noreferrer">
                      Download for Android
                    </a>
                  </Button>
                )}
                {APP_STORE_CONFIG.appStore.enabled && (
                  <Button
                    size="lg"
                    asChild
                    className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
                  >
                    <a href={APP_STORE_CONFIG.appStore.url} target="_blank" rel="noopener noreferrer">
                      Download for iOS
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <Button
                size="lg"
                asChild
                className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                <a href="/codex-pay/beta">Join Beta Program</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Check, Zap, Globe, Shield, Code, TrendingDown, ArrowRight, DollarSign } from "lucide-react";

export default function GetCodexPay() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
            <span className="text-purple-300 font-semibold">Crypto-Native Payment Processing</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6">
            Accept Crypto Payments.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Direct to Your Wallet.
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The payment processor built for modern merchants. Competitive fees, crypto-native settlements, and a developer-friendly API. Join our beta program today.
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => setLocation("/codex-pay")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8"
              data-testid="button-start-free"
            >
              Start Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation("/webhooks")}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-lg px-8"
              data-testid="button-view-docs"
            >
              View Documentation
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  Direct Settlement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400 mb-2">Crypto-Native*</div>
                <p className="text-gray-400">Payments settle directly to your wallet</p>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-400" />
                  Competitive Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400 mb-2">Beta Pricing*</div>
                <p className="text-gray-400">Contact us for current fee structure</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-purple-300 font-semibold text-lg">
              💡 *Features and fees may vary. Contact us for details. Beta program terms apply.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything You Need. Nothing You Don't.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <Zap className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Direct Settlements*</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                Crypto payments settle directly to your wallet. No traditional banking intermediaries required.
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <Globe className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Multi-Currency Support*</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                Accept popular cryptocurrencies including ETH, USDC, and more. Expanding currency support.
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <Shield className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                CCSS-grade security, fraud detection, and blockchain transaction verification. Your payments are safe.
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <Code className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Developer-Friendly API</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                Stripe-compatible API design. Migrate in hours, not weeks. Comprehensive docs and code examples.
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">No Chargebacks</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                Blockchain finality means no chargebacks. Once paid, it's yours. No more losing disputes.
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <Globe className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Global Access</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                No country restrictions. Accept payments from anywhere in the world without geo-blocks.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Get Started in 3 Simple Steps
          </h2>
          
          <div className="space-y-6">
            <Card className="bg-black/40 border-purple-500/30">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Create Merchant Account</h3>
                  <p className="text-gray-300">
                    Sign up and get started.* Contact us for current fee information.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Integrate Your Store</h3>
                  <p className="text-gray-300">
                    Use our API or payment links. Works with any website, app, or e-commerce platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/30">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start Accepting Payments</h3>
                  <p className="text-gray-300">
                    Receive crypto payments directly to your wallet.* Monitor transactions in real-time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">*Features and availability may vary. Contact us for current terms.</p>
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Merchants Choose Get CODEX Pay
          </h2>
          
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 pb-4 border-b border-purple-500/30">
                  <div className="font-semibold text-white">Feature</div>
                  <div className="font-semibold text-gray-400 text-center">Traditional</div>
                  <div className="font-semibold text-green-400 text-center">Get CODEX Pay</div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-gray-300">Transaction Fees</div>
                  <div className="text-gray-400 text-center">~2.9% + fees</div>
                  <div className="text-green-300 text-center font-semibold">Competitive*</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-gray-300">Settlement</div>
                  <div className="text-gray-400 text-center">Days</div>
                  <div className="text-green-300 text-center font-semibold">Direct*</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-gray-300">Chargebacks</div>
                  <div className="text-gray-400 text-center">Possible</div>
                  <div className="text-green-300 text-center font-semibold">Blockchain Finality*</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-gray-300">Setup/Monthly Fee</div>
                  <div className="text-gray-400 text-center">Varies</div>
                  <div className="text-green-300 text-center font-semibold">Contact Us*</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-gray-300">Crypto Support</div>
                  <div className="text-gray-400 text-center">Limited</div>
                  <div className="text-green-300 text-center font-semibold">Multiple*</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">*Features and availability may vary. Contact us for current terms.</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/50">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Save 83% on Payment Fees?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join the beta program and get priority support. No credit card required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={() => setLocation("/codex-pay")}
                  className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-10"
                  data-testid="button-signup-merchant"
                >
                  Create Merchant Account
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setLocation("/webhooks")}
                  className="border-white/50 text-white hover:bg-white/10 text-lg px-10"
                  data-testid="button-read-docs"
                >
                  Read Documentation
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  No setup fees
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  No monthly fees
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Links */}
        <div className="mt-16 text-center space-y-4">
          <div className="flex justify-center gap-6 text-gray-400">
            <button 
              onClick={() => setLocation("/privacy")}
              className="hover:text-purple-400 transition-colors"
              data-testid="link-privacy"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setLocation("/terms")}
              className="hover:text-purple-400 transition-colors"
              data-testid="link-terms"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setLocation("/webhooks")}
              className="hover:text-purple-400 transition-colors"
              data-testid="link-webhooks"
            >
              Developer Docs
            </button>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 Get CODEX Pay - OMNIVERSE SYNDICATE LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

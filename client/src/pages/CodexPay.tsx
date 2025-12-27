import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Zap, Globe, Shield, TrendingDown, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function CodexPay() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Above the fold */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
              <span className="text-purple-300 text-sm font-semibold">🚀 CRYPTO-NATIVE PAYMENT PROCESSING</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Accept Crypto Payments<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Direct to Your Wallet
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              CODEX Pay offers competitive fees with crypto-native settlements.
              Simple API integration, join our beta program today.
            </p>

            {/* Beta Program Info */}
            <div className="mb-12 flex justify-center gap-8 text-gray-400">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">Beta</div>
                <div className="text-sm">Program</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">Crypto</div>
                <div className="text-sm">Native</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">Direct</div>
                <div className="text-sm">Settlement*</div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl"
                data-testid="button-get-started"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Free - Get $50 Demo
              </Button>
              <Button 
                onClick={() => setLocation("/docs/webhooks")}
                variant="outline" 
                size="lg"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 px-8 py-6 text-lg rounded-xl"
                data-testid="button-view-docs"
              >
                View API Docs
              </Button>
            </div>
          </div>

          {/* Why Crypto Payments */}
          <Card className="bg-black/40 border-purple-500/30 mb-16 backdrop-blur">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Crypto Payments?</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-purple-500/30">
                      <th className="pb-4 text-gray-400">Feature</th>
                      <th className="pb-4 text-center">
                        <div className="text-2xl font-bold text-gray-400">Traditional</div>
                      </th>
                      <th className="pb-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">CODEX Pay</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    <tr className="border-b border-purple-500/20">
                      <td className="py-4 text-gray-300">Fees</td>
                      <td className="py-4 text-center text-gray-400">~2.9% + per-txn</td>
                      <td className="py-4 text-center text-purple-400 font-bold">Competitive*</td>
                    </tr>
                    <tr className="border-b border-purple-500/20">
                      <td className="py-4 text-gray-300">Settlement</td>
                      <td className="py-4 text-center text-gray-400">Days</td>
                      <td className="py-4 text-center text-purple-400 font-bold">Direct*</td>
                    </tr>
                    <tr className="border-b border-purple-500/20">
                      <td className="py-4 text-gray-300">Chargebacks</td>
                      <td className="py-4 text-center text-gray-400">Possible</td>
                      <td className="py-4 text-center text-purple-400 font-bold">Blockchain Finality*</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-gray-300">Intermediaries</td>
                      <td className="py-4 text-center text-gray-400">Multiple</td>
                      <td className="py-4 text-center text-purple-400 font-bold">Peer-to-Peer*</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">*Features and availability may vary. Contact us for current terms.</p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <TrendingDown className="h-8 w-8 text-purple-400" />,
                title: "Competitive Fees*",
                description: "Potentially lower fees than traditional payment processors."
              },
              {
                icon: <Clock className="h-8 w-8 text-purple-400" />,
                title: "Direct Settlement*",
                description: "Crypto payments settle to your wallet without bank intermediaries."
              },
              {
                icon: <Globe className="h-8 w-8 text-purple-400" />,
                title: "Multi-Currency Support*",
                description: "Accept popular cryptocurrencies. Expanding currency support."
              },
              {
                icon: <Shield className="h-8 w-8 text-purple-400" />,
                title: "Blockchain Security*",
                description: "Transactions verified on-chain for added security."
              },
              {
                icon: <Zap className="h-8 w-8 text-purple-400" />,
                title: "Developer-Friendly API",
                description: "Modern REST API with comprehensive documentation."
              },
              {
                icon: <Check className="h-8 w-8 text-purple-400" />,
                title: "Expanding Access*",
                description: "Growing global coverage. Contact us for availability."
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-black/40 border-purple-500/30 hover:border-purple-500/50 transition-colors backdrop-blur" data-testid={`card-feature-${i}`}>
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <Card className="bg-black/40 border-purple-500/30 mb-16 backdrop-blur">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-400 border border-purple-500/30">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Sign Up</h3>
                  <p className="text-gray-400">Create your merchant account in 2 minutes. Get API keys instantly.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-400 border border-purple-500/30">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Integrate</h3>
                  <p className="text-gray-400">Drop-in replacement for Stripe. Same API, 83% cheaper fees.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-400 border border-purple-500/30">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Get Paid</h3>
                  <p className="text-gray-400">Instant crypto settlements to your wallet. No waiting, no chargebacks.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beta Offer */}
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 mb-16 backdrop-blur">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">🎉 Beta Launch Special</h2>
              <p className="text-xl text-gray-300 mb-6">
                First 100 merchants get <span className="text-purple-400 font-bold">0% fees for the first month</span> + priority support
              </p>
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
                data-testid="button-claim-beta-offer"
              >
                Claim Your Beta Spot
              </Button>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {[
                {
                  q: "How do you charge 83% less than Stripe?",
                  a: "Blockchain payments eliminate intermediaries. No payment processors, no banks, no 7-day holds. Just peer-to-peer transfers with instant settlement."
                },
                {
                  q: "What about crypto price volatility?",
                  a: "We auto-convert to stablecoins (USDC). You get the USD equivalent instantly. Zero price risk."
                },
                {
                  q: "Is this legal and compliant?",
                  a: "Yes. We comply with FinCEN regulations and implement AML/KYC for merchants processing over $1K/month."
                },
                {
                  q: "Can customers pay with credit cards?",
                  a: "Yes! Customers can pay with Web3 wallets, credit cards (via crypto on-ramps), or direct crypto transfers."
                },
                {
                  q: "How long does integration take?",
                  a: "Most merchants integrate in under 30 minutes. Our API is Stripe-compatible with detailed docs and code examples."
                }
              ].map((faq, i) => (
                <Card key={i} className="bg-black/40 border-purple-500/30 hover:border-purple-500/50 transition-colors backdrop-blur" data-testid={`card-faq-${i}`}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                    <p className="text-gray-400">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Save 83%?</h2>
              <p className="text-xl text-white/90 mb-8">
                Join the payment revolution. Start saving today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold"
                  data-testid="button-final-cta"
                >
                  Get Started Free
                </Button>
                <Button 
                  onClick={() => setLocation("/contact")}
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                  data-testid="button-contact-sales"
                >
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

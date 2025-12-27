import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Rocket, Code, Zap, Shield, Globe, CheckCircle2 } from "lucide-react";

export default function EmpireAPISignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    website: "",
    description: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest({
        method: "POST",
        url: "/api/empire/developer/signup",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Developer Account Created!",
        description: "Welcome to Empire API Platform",
      });
      navigate("/empire-api-portal");
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create developer account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Empire API Platform
          </h1>
          <p className="text-2xl text-slate-300 mb-8">
            Build the future with our comprehensive Web3 API
          </p>
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-slate-400">Free Forever Tier</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-slate-400">60 RPM / 10K Monthly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-slate-400">5 Endpoints</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Why Empire API?</h2>
            
            <div className="flex gap-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Rocket className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Production Ready</h3>
                <p className="text-slate-400">
                  Enterprise-grade infrastructure with 99.9% uptime, atomic rate limiting, and zero race conditions
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Code className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Simple Integration</h3>
                <p className="text-slate-400">
                  RESTful API with comprehensive documentation, code examples, and SDKs in multiple languages
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Zap className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-slate-400">
                  Optimized for speed with average response times under 100ms, perfect for real-time applications
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure by Default</h3>
                <p className="text-slate-400">
                  bcrypt-hashed API keys, HTTPS-only webhooks, PostgreSQL row-level locking, and comprehensive analytics
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-pink-500/20 p-3 rounded-lg">
                <Globe className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Complete Ecosystem</h3>
                <p className="text-slate-400">
                  Access wallets, trading, NFTs, CODEX Pay payments, staking, and more - all through one unified API
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-slate-900/50 backdrop-blur border border-purple-500/20 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Available Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <code className="text-purple-400">GET /api/v1/wallets</code>
                  <span className="text-slate-400">- Wallet management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <code className="text-blue-400">GET /api/v1/transactions</code>
                  <span className="text-slate-400">- Transaction history</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <code className="text-green-400">GET /api/v1/trading</code>
                  <span className="text-slate-400">- Trading bots & copy trading</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <code className="text-yellow-400">GET /api/v1/nfts</code>
                  <span className="text-slate-400">- NFT marketplace</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <code className="text-pink-400">POST /api/v1/payment-intents</code>
                  <span className="text-slate-400">- CODEX Pay integration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div>
            <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Create Developer Account</CardTitle>
                <CardDescription>Start building with Empire API in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="developer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-950 border-purple-500/20 text-white"
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyName" className="text-white">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Inc."
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="bg-slate-950 border-purple-500/20 text-white"
                      data-testid="input-company"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-white">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="bg-slate-950 border-purple-500/20 text-white"
                      data-testid="input-website"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Project Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your project..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-slate-950 border-purple-500/20 text-white min-h-[100px]"
                      data-testid="input-description"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={signupMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
                    data-testid="button-signup"
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Create Developer Account"}
                  </Button>

                  <div className="text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link href="/empire-api-portal" className="text-purple-400 hover:text-purple-300">
                      Go to Portal
                    </Link>
                  </div>

                  <div className="text-center text-sm text-slate-400">
                    <Link href="/" className="text-purple-400 hover:text-purple-300">
                      ← Back to Platform
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Pricing Tiers */}
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur border border-purple-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Pricing Tiers</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">FREE</span>
                  <span className="text-white font-semibold">$0/mo - 60 RPM, 10K/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">PRO</span>
                  <span className="text-white font-semibold">$99/mo - 300 RPM, 100K/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">ENTERPRISE</span>
                  <span className="text-white font-semibold">$499/mo - 1000 RPM, 1M/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

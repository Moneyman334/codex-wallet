import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  CheckCircle2,
  Rocket,
  DollarSign,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SavingsCalculator } from "@/components/savings-calculator";
import { ComplianceDisclaimer } from "@/components/ui/compliance-disclaimer";

const betaSignupSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  monthlyVolume: z.string().min(1, "Please select monthly volume"),
  businessType: z.string().min(1, "Please select business type"),
  useCase: z.string().min(10, "Please describe your use case (at least 10 characters)"),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

export default function CodexPayBetaPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      monthlyVolume: "",
      businessType: "",
      useCase: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: BetaSignupForm) => {
      const response = await fetch("/api/codex-pay/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Submission failed");
      }
      return response.json();
    },
    onSuccess: (response) => {
      setSubmitted(true);
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'beta_signup', {
          event_category: 'codex_pay',
          event_label: response.autoApproved ? 'auto_approved_merchant' : 'pending_merchant_application',
          value: response.autoApproved ? 10 : 1
        });
      }
      
      toast({
        title: "Application Submitted! 🎉",
        description: "Thank you for applying. We'll review your application and follow up via email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BetaSignupForm) => {
    signupMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 border-purple-500/20 backdrop-blur-xl p-8 text-center space-y-6">
          <div className="inline-block p-6 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">
            Application Received!
          </h1>
          <p className="text-xl text-gray-300">
            Thank you for applying to the CODEX Pay Beta Program!
          </p>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-purple-300">What Happens Next?</h3>
            <ul className="space-y-3 text-left text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>We'll review your application and respond promptly</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Approved merchants receive API credentials via email</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Beta participants may qualify for promotional pricing</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Competitive fee structure compared to traditional processors</span>
              </li>
            </ul>
          </div>
          <Button
            onClick={() => window.location.href = "/"}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-back-home"
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-4 py-2 text-lg">
            Beta Program - Limited Availability
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-blue-400 text-transparent bg-clip-text">
            Join CODEX Pay Beta
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Apply for early access to our crypto payment processing platform.
            <br/>
            Beta participants may qualify for promotional pricing.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
              Early Access
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
              Beta Features
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
              Limited Spots
            </Badge>
          </div>
        </div>

        {/* Beta Disclaimer */}
        <ComplianceDisclaimer type="beta" />

        {/* Mobile App Promo */}
        <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30 backdrop-blur-xl p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <Badge className="mb-3 bg-green-500/20 text-green-300 border-green-500/30">
                📱 Mobile App Coming Soon
              </Badge>
              <h3 className="text-2xl font-bold text-white mb-2">
                Manage Payments on the Go
              </h3>
              <p className="text-gray-300 mb-4">
                Android & iOS apps launching soon! Monitor transactions, manage settlements, and track revenue from anywhere.
              </p>
              <div className="flex gap-3">
                <div className="bg-black/40 rounded px-3 py-2 border border-gray-700 opacity-50">
                  <span className="text-xs text-gray-400">Google Play</span>
                </div>
                <div className="bg-black/40 rounded px-3 py-2 border border-gray-700 opacity-50">
                  <span className="text-xs text-gray-400">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 w-fit">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Beta Pricing</h3>
              <p className="text-gray-400">Promotional rates available for qualified beta participants</p>
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Competitive Fees</h3>
              <p className="text-gray-400">Lower transaction fees compared to traditional payment processors*</p>
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Fast Settlement</h3>
              <p className="text-gray-400">Crypto payments typically settle faster than traditional methods</p>
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 w-fit">
                <Globe className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Multi-Currency</h3>
              <p className="text-gray-400">Support for various cryptocurrencies (availability varies)</p>
            </div>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl overflow-hidden">
          <div className="p-6 border-b border-purple-500/20">
            <h2 className="text-3xl font-bold text-white text-center">Feature Comparison</h2>
            <p className="text-center text-gray-400 text-sm mt-2">*Fees and features may vary. Contact us for current pricing.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left p-4 text-gray-400 font-semibold">Feature</th>
                  <th className="text-center p-4 text-purple-300 font-bold">CODEX Pay</th>
                  <th className="text-center p-4 text-gray-500 font-semibold">Stripe</th>
                  <th className="text-center p-4 text-gray-500 font-semibold">PayPal</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-gray-300">Transaction Fees</td>
                  <td className="p-4 text-center text-green-400 font-bold">Competitive*</td>
                  <td className="p-4 text-center text-gray-400">2.9% + $0.30</td>
                  <td className="p-4 text-center text-gray-400">3.49% + $0.49</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-gray-300">Settlement</td>
                  <td className="p-4 text-center text-green-400 font-bold">Direct*</td>
                  <td className="p-4 text-center text-gray-400">7 days</td>
                  <td className="p-4 text-center text-gray-400">1-3 days</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-gray-300">Crypto Support</td>
                  <td className="p-4 text-center text-green-400 font-bold">Multiple*</td>
                  <td className="p-4 text-center text-gray-400">Limited</td>
                  <td className="p-4 text-center text-gray-400">Limited</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-300">Global Access</td>
                  <td className="p-4 text-center text-green-400 font-bold">Expanding*</td>
                  <td className="p-4 text-center text-gray-400">Restricted</td>
                  <td className="p-4 text-center text-gray-400">Restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Savings Calculator Widget */}
        <SavingsCalculator />

        {/* Application Form */}
        <Card id="beta-application-form" className="bg-black/40 border-purple-500/20 backdrop-blur-xl p-8" data-testid="beta-application-form">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Apply for Beta Access</h2>
              <p className="text-gray-400">Join our beta program for early access</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Acme Corp"
                            className="bg-black/40 border-purple-500/20"
                            data-testid="input-business-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John Doe"
                            className="bg-black/40 border-purple-500/20"
                            data-testid="input-contact-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john@acme.com"
                            className="bg-black/40 border-purple-500/20"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+1 (555) 123-4567"
                            className="bg-black/40 border-purple-500/20"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://acme.com"
                            className="bg-black/40 border-purple-500/20"
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Monthly Volume *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 rounded-md bg-black/40 border border-purple-500/20 text-white"
                            data-testid="select-monthly-volume"
                          >
                            <option value="">Select volume...</option>
                            <option value="0-10k">$0 - $10,000</option>
                            <option value="10k-50k">$10,000 - $50,000</option>
                            <option value="50k-100k">$50,000 - $100,000</option>
                            <option value="100k-500k">$100,000 - $500,000</option>
                            <option value="500k+">$500,000+</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 rounded-md bg-black/40 border border-purple-500/20 text-white"
                            data-testid="select-business-type"
                          >
                            <option value="">Select type...</option>
                            <option value="ecommerce">E-commerce</option>
                            <option value="saas">SaaS</option>
                            <option value="marketplace">Marketplace</option>
                            <option value="gaming">Gaming</option>
                            <option value="nft">NFT/Digital Assets</option>
                            <option value="consulting">Consulting/Services</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="useCase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe Your Use Case *</FormLabel>
                      <FormDescription>
                        Tell us how you plan to use CODEX Pay and what makes your business unique
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="We sell digital products and want to accept crypto payments globally..."
                          className="bg-black/40 border-purple-500/20 min-h-[120px]"
                          data-testid="textarea-use-case"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6"
                  disabled={signupMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {signupMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      Apply for Beta Access
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl text-center">
            <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Enterprise Security</h3>
            <p className="text-sm text-gray-400">CCSS & SOC 2 Type II compliant infrastructure</p>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl text-center">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">24/7 Support</h3>
            <p className="text-sm text-gray-400">Dedicated support for all beta merchants</p>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6 backdrop-blur-xl text-center">
            <Sparkles className="w-12 h-12 text-pink-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Priority Features</h3>
            <p className="text-sm text-gray-400">Beta merchants get early access to new features</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

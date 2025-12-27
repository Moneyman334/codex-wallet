import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Zap, Rocket, Shield, Globe, ArrowRight, Check, Copy } from "lucide-react";

const merchantSignupSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  businessType: z.enum(["individual", "company", "non_profit"], {
    required_error: "Please select a business type",
  }),
  country: z.string().min(2, "Country is required"),
});

type MerchantSignupForm = z.infer<typeof merchantSignupSchema>;

export default function ChaosPaySignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<{ publishable: string; secret: string } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const form = useForm<MerchantSignupForm>({
    resolver: zodResolver(merchantSignupSchema),
    defaultValues: {
      businessName: "",
      email: "",
      website: "",
      walletAddress: "",
      businessType: undefined,
      country: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: MerchantSignupForm) => {
      return await apiRequest("/api/codex-pay/merchant/signup", "POST", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "🎉 Merchant Account Created!",
        description: "Your CODEX Pay merchant account is now active!",
      });
      setApiKeys(data.apiKeys);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "Failed to create merchant account",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const onSubmit = (data: MerchantSignupForm) => {
    signupMutation.mutate(data);
  };

  if (apiKeys) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Welcome to CODEX Pay! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              Your merchant account is live and ready to process payments!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Keys */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Your API Keys</h3>
              </div>
              
              {/* Publishable Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Publishable Key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={apiKeys.publishable}
                    className="font-mono text-sm"
                    data-testid="input-publishable-key"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKeys.publishable, "Publishable key")}
                    data-testid="button-copy-publishable"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Safe to use in your frontend code</p>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Secret Key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    type={showSecretKey ? "text" : "password"}
                    value={apiKeys.secret}
                    className="font-mono text-sm"
                    data-testid="input-secret-key"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    data-testid="button-toggle-secret"
                  >
                    {showSecretKey ? "🙈" : "👁️"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKeys.secret, "Secret key")}
                    data-testid="button-copy-secret"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ Never share this key or expose it in client-side code
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg bg-accent/50">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-green-600">Beta</div>
                <div className="text-xs text-muted-foreground">Program</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-blue-600">Direct*</div>
                <div className="text-xs text-muted-foreground">Settlements</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-purple-600">Crypto</div>
                <div className="text-xs text-muted-foreground">Native</div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate("/codex-pay")}
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <Zap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Join CODEX Pay
            </h1>
          </div>
          <CardDescription className="text-lg">
            Crypto-native payment processing. Join our beta program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Rocket className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Competitive Fees*</h3>
                <p className="text-sm text-muted-foreground">Contact us for current pricing</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Shield className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold">Direct Settlement*</h3>
                <p className="text-sm text-muted-foreground">Crypto-native payments</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Globe className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold">Expanding Access*</h3>
                <p className="text-sm text-muted-foreground">Growing global coverage</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Check className="w-5 h-5 text-pink-600 mt-1" />
              <div>
                <h3 className="font-semibold">Blockchain Security*</h3>
                <p className="text-sm text-muted-foreground">On-chain verification</p>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} data-testid="input-business-name" />
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
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@acme.com" {...field} data-testid="input-email" />
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
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://acme.com" {...field} data-testid="input-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} data-testid="input-wallet-address" />
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
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-business-type">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="non_profit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={signupMutation.isPending}
                data-testid="button-submit-signup"
              >
                {signupMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Merchant Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

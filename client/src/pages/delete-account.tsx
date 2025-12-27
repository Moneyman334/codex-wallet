import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Trash2, CheckCircle, ArrowLeft } from "lucide-react";
import SEO from "@/components/seo";

export default function DeleteAccountPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    reason: "",
    confirmation: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.confirmation.toLowerCase() !== "delete my account") {
      toast({
        title: "Confirmation Required",
        description: 'Please type "DELETE MY ACCOUNT" to confirm',
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/account/delete-request", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      setSuccess(true);
      toast({
        title: "Deletion Request Submitted",
        description: "We'll process your request within 30 days and send confirmation to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit deletion request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO 
          title="Account Deletion Request Submitted | CODEX Wallet"
          description="Your account deletion request has been submitted successfully. We will process it within 30 days."
          canonicalUrl="/delete-account"
        />
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 p-4">
          <div className="container max-w-2xl mx-auto pt-20">
            <Card className="bg-black/60 border-cyan-500/30 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-2xl text-white">Request Submitted Successfully</CardTitle>
                <CardDescription className="text-gray-300">
                  Your account deletion request has been received
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <p>We've received your account deletion request. Here's what happens next:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>We'll process your request within 30 days</li>
                  <li>All your data will be permanently deleted</li>
                  <li>You'll receive a confirmation email once complete</li>
                  <li>This action cannot be undone</li>
                </ul>
                <Alert className="bg-cyan-500/10 border-cyan-500/30">
                  <AlertDescription className="text-cyan-300">
                    Request ID: {new Date().getTime().toString(36).toUpperCase()}
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setLocation("/")}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  data-testid="button-return-home"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Delete Account | CODEX Wallet"
        description="Request permanent deletion of your CODEX Wallet account and all associated data. This action is permanent and cannot be undone."
        canonicalUrl="/delete-account"
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 p-4">
        <div className="container max-w-2xl mx-auto pt-20">
        <Card className="bg-black/60 border-red-500/30 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Delete Account</CardTitle>
                <CardDescription className="text-gray-300">
                  Request permanent deletion of your account and data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <strong className="font-bold">Warning:</strong> This action is permanent and cannot be undone. All your data will be deleted within 30 days.
              </AlertDescription>
            </Alert>

            <div className="bg-black/40 border border-purple-500/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-white">What will be deleted:</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Your user account and login credentials</li>
                <li>All connected wallet addresses</li>
                <li>Transaction history and balances</li>
                <li>Personal preferences and settings</li>
                <li>Analytics and activity data</li>
                <li>NFTs, tokens, and marketplace data</li>
                <li>Trading bot configurations and history</li>
                <li>All other personal information</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-black/40 border-purple-500/30 text-white"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-white">Reason for Deletion (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by telling us why you're leaving..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="bg-black/40 border-purple-500/30 text-white"
                  rows={3}
                  data-testid="input-reason"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-white">
                  Type "DELETE MY ACCOUNT" to confirm
                </Label>
                <Input
                  id="confirmation"
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={formData.confirmation}
                  onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
                  required
                  className="bg-black/40 border-red-500/30 text-white font-mono"
                  data-testid="input-confirmation"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1 border-purple-500/30 text-white hover:bg-purple-500/20"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  data-testid="button-submit-delete"
                >
                  {loading ? "Processing..." : "Delete My Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact us at{" "}
            <a href="mailto:omniversesyndicate@gmail.com" className="text-cyan-400 hover:text-cyan-300">
              omniversesyndicate@gmail.com
            </a>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

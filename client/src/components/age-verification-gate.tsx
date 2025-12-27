import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AGE_VERIFICATION_KEY = "codex-age-verified";

interface AgeVerificationGateProps {
  children: React.ReactNode;
}

export default function AgeVerificationGate({ children }: AgeVerificationGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showDeniedMessage, setShowDeniedMessage] = useState(false);

  useEffect(() => {
    // 🔓 BYPASS: Allow legal/compliance pages to skip age gate for app store crawlers
    const legalPages = ['/privacy', '/terms', '/support', '/faq', '/delete-account'];
    const isLegalPage = legalPages.some(page => 
      window.location.pathname === page || window.location.pathname.startsWith(page + '/')
    );
    
    if (isLegalPage) {
      setIsVerified(true);
      return;
    }
    
    // Check if user has already verified their age
    try {
      const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
      setIsVerified(verified === "true");
    } catch (error) {
      // localStorage disabled or unavailable - deny access
      console.error("localStorage unavailable, denying access", error);
      setIsVerified(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(AGE_VERIFICATION_KEY, "true");
      setIsVerified(true);
    } catch (error) {
      // localStorage unavailable - show error
      console.error("Cannot save age verification", error);
      alert("Browser storage is required to use this application. Please enable cookies and local storage.");
    }
  };

  const handleDeny = () => {
    setShowDeniedMessage(true);
  };

  // Loading state
  if (isVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  // Already verified - show app
  if (isVerified) {
    return <>{children}</>;
  }

  // Show denied message
  if (showDeniedMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="border-red-500/50 bg-black/50 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-white">Access Denied</CardTitle>
              <CardDescription className="text-gray-400">
                You must be 18 years or older to access this platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  This platform contains cryptocurrency payment processing, digital asset trading, NFT marketplace features, and financial content restricted to adults only.
                </p>
                <div className="text-sm text-gray-400 space-y-2">
                  <p className="font-semibold text-red-400">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>If you are under 18, you must uninstall this application immediately</li>
                    <li>This content is not suitable for minors</li>
                    <li>Access to this platform is restricted by law</li>
                    <li>Continuing to use this application may violate applicable laws and regulations</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-400 mb-2">Need Help or Have Questions?</p>
                <p className="text-sm text-gray-400 mb-3">
                  If you believe this message is shown in error or have questions about age requirements, please contact our support team.
                </p>
                <div className="space-y-2">
                  <a 
                    href="/faq" 
                    className="block text-sm text-blue-400 hover:text-blue-300 underline"
                    data-testid="link-faq"
                  >
                    → View FAQ & Support
                  </a>
                  <a 
                    href="mailto:omniversesyndicate@gmail.com" 
                    className="block text-sm text-blue-400 hover:text-blue-300 underline"
                    data-testid="link-support-email"
                  >
                    → Email Support: omniversesyndicate@gmail.com
                  </a>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Please close this browser tab and uninstall the application if you are under 18 years of age.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show age verification gate
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg w-full relative z-10"
        >
          <Card className="border-purple-500/50 bg-black/70 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Age Verification Required
              </CardTitle>
              <CardDescription className="text-gray-300 text-base mt-2">
                Welcome to CODEX Wallet
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="font-semibold text-yellow-500">18+ Only - Legal Requirement</p>
                    <p>This platform contains:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Cryptocurrency payment processing and digital wallets</li>
                      <li>NFT marketplace and digital collectibles</li>
                      <li>Advanced crypto trading and DeFi protocols</li>
                      <li>Entertainment features with financial elements</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-center">
                <p className="text-white font-medium text-lg">
                  Are you 18 years of age or older?
                </p>
                <p className="text-sm text-gray-400">
                  By confirming, you certify that you meet the minimum age requirement and accept all associated risks.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={handleDeny}
                  className="w-full border-red-500/50 hover:bg-red-500/20 hover:border-red-500 text-red-400"
                  data-testid="button-deny-age"
                >
                  No, I'm Under 18
                </Button>
                <Button
                  onClick={handleAccept}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  data-testid="button-confirm-age"
                >
                  Yes, I'm 18+
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Your age verification is stored locally and will be remembered on this device.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

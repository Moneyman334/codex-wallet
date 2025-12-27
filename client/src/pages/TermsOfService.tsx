import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button 
          onClick={() => setLocation("/")}
          variant="ghost" 
          className="mb-8 text-purple-400 hover:text-purple-300"
          data-testid="button-back-home"
        >
          ← Back to Home
        </Button>

        <Card className="bg-black/40 border-purple-500/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-white">Terms of Service</CardTitle>
            <p className="text-gray-400 mt-2">Last Updated: October 31, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using Get CODEX Pay ("Platform" or "Service"), operated by OMNIVERSE SYNDICATE LLC, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Services</h2>
                <p>Get CODEX Pay is a cryptocurrency payment processing platform that enables merchants to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Accept Payments:</strong> Process cryptocurrency and fiat payments (fees vary, contact us for current rates)</li>
                  <li><strong>Direct Settlements:</strong> Receive crypto payments to your settlement wallet</li>
                  <li><strong>API Integration:</strong> Use our developer-friendly API with comprehensive documentation</li>
                  <li><strong>Payment Links:</strong> Create shareable payment pages for quick checkout</li>
                  <li><strong>Webhooks:</strong> Receive real-time notifications for payment events</li>
                  <li><strong>Customer Management:</strong> Track customers, transactions, and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Eligibility</h2>
                <p>To use our Platform, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Be at least 18 years of age</li>
                  <li>Have the legal capacity to enter into binding contracts</li>
                  <li>Not be located in a restricted jurisdiction (see Section 12)</li>
                  <li>Comply with all applicable local, state, and federal laws</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Account Registration</h2>
                <p>When creating an account, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Financial Services</h2>
                
                <h3 className="text-xl font-semibold text-white mb-2">5.1 Get CODEX Pay (Merchant Services)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transaction fees vary by plan and volume (contact us for current rates)</li>
                  <li>Blockchain settlements are direct and benefit from blockchain finality</li>
                  <li>Merchants processing over $1,000/month must complete KYC verification</li>
                  <li>We comply with FinCEN regulations and AML/KYC requirements</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">5.2 Additional Platform Features</h3>
                <p className="text-sm text-gray-400 mb-2">
                  In addition to payment processing, our platform offers optional features for users:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
                  <li>NFT marketplace, trading tools, and DeFi services (optional, not required for merchants)</li>
                  <li>These features are separate from Get CODEX Pay merchant services</li>
                  <li>See individual feature terms for details if you choose to use them</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Fees and Payments</h2>
                <p><strong>Get CODEX Pay Transaction Fees:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transaction fees vary by plan and are disclosed during signup</li>
                  <li>Contact us for current fee structures and any applicable promotions</li>
                  <li>Fees are deducted automatically before settlement to your wallet</li>
                  <li>All fees are non-refundable once a transaction is processed</li>
                </ul>
                <p className="mt-4 text-sm text-gray-400">
                  Additional platform features (if used) may have separate fee structures. See individual feature documentation for details.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Prohibited Activities</h2>
                <p>You may NOT:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use Get CODEX Pay for illegal activities or money laundering</li>
                  <li>Process fraudulent or unauthorized payments</li>
                  <li>Reverse engineer, decompile, or hack the Platform</li>
                  <li>Create multiple merchant accounts to abuse promotions</li>
                  <li>Impersonate others or provide false business information</li>
                  <li>Violate intellectual property rights</li>
                  <li>Spam, phish, or distribute malware</li>
                  <li>Violate KYC/AML requirements or sanctions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
                <p>
                  All content on the Platform, including logos, text, graphics, and software, is owned by OMNIVERSE SYNDICATE LLC or our licensors. You may not use, reproduce, or distribute our content without written permission.
                </p>
                <p className="mt-4">
                  <strong>Trademarks:</strong> "Get CODEX Pay" and our logos are trademarks of OMNIVERSE SYNDICATE LLC.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimers</h2>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 my-4">
                  <p className="text-yellow-300 font-semibold mb-2">IMPORTANT RISK DISCLOSURES:</p>
                  <ul className="list-disc pl-6 space-y-2 text-yellow-200">
                    <li>Cryptocurrency payments involve price volatility risk (mitigated by stablecoin auto-conversion)</li>
                    <li>Blockchain transactions are irreversible - no chargebacks possible</li>
                    <li>Network congestion may cause payment delays</li>
                    <li>You are responsible for securing your settlement wallet</li>
                  </ul>
                </div>

                <p className="mt-4">
                  THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, ACCURACY OF PRICING DATA, OR FITNESS FOR A PARTICULAR PURPOSE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, OMNIVERSE SYNDICATE LLC SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Loss of profits, revenue, or data</li>
                  <li>Indirect, special, or consequential damages</li>
                  <li>Failed payment transactions due to network issues</li>
                  <li>Security breaches beyond our reasonable control</li>
                  <li>Third-party actions or blockchain network failures</li>
                  <li>Customer disputes related to your products or services</li>
                </ul>
                <p className="mt-4">
                  Our total liability shall not exceed the fees you paid in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless OMNIVERSE SYNDICATE LLC, its officers, directors, and employees from any claims, damages, or expenses arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any law or regulation</li>
                  <li>Your infringement of third-party rights</li>
                  <li>Your use of the Platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Restricted Jurisdictions</h2>
                <p>
                  The Platform is not available to residents of the following jurisdictions:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Countries subject to U.S. sanctions (Iran, North Korea, Syria, Cuba, Crimea)</li>
                  <li>Jurisdictions where cryptocurrency services are prohibited</li>
                  <li>Regions where we are not licensed to operate</li>
                </ul>
                <p className="mt-4">
                  By using the Platform, you represent that you are not in a restricted jurisdiction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">13. Dispute Resolution</h2>
                
                <h3 className="text-xl font-semibold text-white mb-2">13.1 Arbitration Agreement</h3>
                <p>
                  Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration, except for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Claims in small claims court (under $10,000)</li>
                  <li>Intellectual property disputes</li>
                  <li>Injunctive relief</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">13.2 Class Action Waiver</h3>
                <p>
                  You agree to resolve disputes individually and waive your right to participate in class action lawsuits.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">14. Termination</h2>
                <p>
                  We may suspend or terminate your account at any time for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violation of these Terms</li>
                  <li>Suspicious or fraudulent activity</li>
                  <li>Legal or regulatory requirements</li>
                  <li>Extended period of inactivity</li>
                </ul>
                <p className="mt-4">
                  Upon termination, you may withdraw your funds (subject to verification requirements). We are not liable for losses resulting from account termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">15. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. Material changes will be notified via email or platform notification. Your continued use of the Platform after changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">16. Governing Law</h2>
                <p>
                  These Terms shall be governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">17. Contact Information</h2>
                <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p><strong>Get CODEX Pay - OMNIVERSE SYNDICATE LLC</strong></p>
                  <p>Email: <a href="mailto:legal@getcodexpay.com" className="text-purple-400 hover:text-purple-300">legal@getcodexpay.com</a></p>
                  <p>Website: <a href="https://getcodexpay.com" className="text-purple-400 hover:text-purple-300">getcodexpay.com</a></p>
                </div>
              </section>

              <section className="border-t border-purple-500/30 pt-8">
                <p className="text-sm text-gray-400">
                  By using Get CODEX Pay, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
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
            <CardTitle className="text-4xl font-bold text-white">Privacy Policy</CardTitle>
            <p className="text-gray-400 mt-2">Last Updated: October 31, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                <p>
                  Welcome to Get CODEX Pay ("we," "our," or "us"), a payment processing platform operated by OMNIVERSE SYNDICATE LLC. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website getcodexpay.com and use our payment processing services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-white mb-2">2.1 Personal Information</h3>
                <p>We collect the following types of personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Username, email address, password (encrypted)</li>
                  <li><strong>Merchant Information:</strong> Business details, tax information (EIN/SSN), settlement wallet addresses</li>
                  <li><strong>Transaction Data:</strong> Payment history, transaction volumes, customer payments</li>
                  <li><strong>KYC Information:</strong> For merchants processing over $1,000/month, we collect identity verification documents as required by law</li>
                  <li><strong>Customer Information:</strong> Email addresses and wallet addresses of your customers (processed on your behalf)</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">2.2 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                  <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns</li>
                  <li><strong>Blockchain Data:</strong> On-chain transaction hashes, wallet addresses (publicly available)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                <p>We use your information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Payment Processing:</strong> Process customer payments, manage settlements, handle refunds</li>
                  <li><strong>Security:</strong> Prevent fraud, detect suspicious activity, protect against security threats</li>
                  <li><strong>Compliance:</strong> Meet legal obligations including AML/KYC requirements and FinCEN regulations</li>
                  <li><strong>Communication:</strong> Send payment confirmations, settlement notifications, security alerts</li>
                  <li><strong>Improvement:</strong> Analyze transaction patterns to improve our payment processing platform</li>
                  <li><strong>Support:</strong> Provide customer service and technical integration assistance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
                <p>We do NOT sell your personal information. We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> Third-party companies that help us operate our platform (payment processors, cloud hosting, analytics)</li>
                  <li><strong>Blockchain Networks:</strong> Transaction data is publicly recorded on blockchains (Ethereum, Polygon, etc.)</li>
                  <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>HTTPS encryption for all data transmission</li>
                  <li>Bcrypt password hashing (passwords never stored in plain text)</li>
                  <li>Multi-layer fraud detection and transaction monitoring</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>CCSS-compliant infrastructure for cryptocurrency storage</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
                  <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at: <a href="mailto:privacy@getcodexpay.com" className="text-purple-400 hover:text-purple-300">privacy@getcodexpay.com</a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
                <p>
                  We use cookies and similar tracking technologies to enhance your experience:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for platform functionality (sessions, authentication)</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="mt-4">
                  You can control cookies through your browser settings, but disabling them may limit platform functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Services</h2>
                <p>
                  Our payment processing platform integrates with third-party services that have their own privacy policies:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cryptocurrency Wallets:</strong> Web3 wallet providers for payment acceptance</li>
                  <li><strong>Blockchain Networks:</strong> Ethereum, Polygon, Arbitrum, Base (transactions are public on-chain)</li>
                  <li><strong>Price Data:</strong> Real-time cryptocurrency pricing and conversion rates</li>
                  <li><strong>Cloud Infrastructure:</strong> Secure hosting and data storage providers</li>
                </ul>
                <p className="mt-4">
                  We are not responsible for the privacy practices of these third parties. Please review their privacy policies separately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                <p>
                  Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our platform, you consent to such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the platform after changes constitute acceptance of the updated Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                <p>
                  If you have questions or concerns about this Privacy Policy, please contact us:
                </p>
                <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p><strong>Get CODEX Pay - OMNIVERSE SYNDICATE LLC</strong></p>
                  <p>Email: <a href="mailto:privacy@getcodexpay.com" className="text-purple-400 hover:text-purple-300">privacy@getcodexpay.com</a></p>
                  <p>Website: <a href="https://getcodexpay.com" className="text-purple-400 hover:text-purple-300">getcodexpay.com</a></p>
                </div>
              </section>

              <section className="border-t border-purple-500/30 pt-8">
                <p className="text-sm text-gray-400">
                  This Privacy Policy complies with GDPR, CCPA, and other applicable data protection regulations. For region-specific privacy rights, please refer to Section 6 or contact us directly.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

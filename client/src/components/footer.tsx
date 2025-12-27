import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Twitter, Github, MessageCircle, Send, Globe } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
              CODEX
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The dominant blockchain platform with 55+ production features. Trade, stake, create NFTs, and more.
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" asChild data-testid="button-twitter">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="ghost" asChild data-testid="button-discord">
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="ghost" asChild data-testid="button-telegram">
                <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <Send className="h-4 w-4" />
                </a>
              </Button>
              <Button size="icon" variant="ghost" asChild data-testid="button-github">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sentinel-bot" className="hover:text-foreground transition-colors block" data-testid="link-trading-bot">
                  Trading Bot
                </Link>
              </li>
              <li>
                <Link href="/yield-farming" className="hover:text-foreground transition-colors block" data-testid="link-staking">
                  Staking & Farming
                </Link>
              </li>
              <li>
                <Link href="/nft-creator" className="hover:text-foreground transition-colors block" data-testid="link-nft-creator">
                  NFT Creator
                </Link>
              </li>
              <li>
                <Link href="/crypto-payments" className="hover:text-foreground transition-colors block" data-testid="link-payments">
                  Crypto Payments
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-foreground transition-colors block" data-testid="link-marketplace">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/supreme-command" className="hover:text-foreground transition-colors block" data-testid="link-supreme-command">
                  Supreme Command
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors block" data-testid="link-faq">
                  FAQ & Help
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-foreground transition-colors block" data-testid="link-analytics">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="hover:text-foreground transition-colors block" data-testid="link-portfolio">
                  Portfolio Tracker
                </Link>
              </li>
              <li>
                <Link href="/achievements" className="hover:text-foreground transition-colors block" data-testid="link-achievements">
                  Achievements
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-foreground transition-colors block" data-testid="link-notifications">
                  Notifications
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-semibold mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors block" data-testid="link-terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors block" data-testid="link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:omniversesyndicate@gmail.com"
                  className="hover:text-foreground transition-colors block"
                  data-testid="link-contact-support"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/ethereum/EIPs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                  data-testid="link-smart-contracts"
                >
                  Smart Contracts
                  <Globe className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link href="/owner-analytics" className="hover:text-foreground transition-colors block" data-testid="link-owner-dashboard">
                  Owner Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © {currentYear} CODEX. All rights reserved. Built on blockchain technology.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              All Systems Operational
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>55+ Features</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Multi-Chain Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

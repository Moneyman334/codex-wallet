import SEO from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Wrench, Fuel, Activity, Shield, BarChart3, Bell, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import GasTracker from "@/components/gas-tracker";
import BlockchainNetworkStatus from "@/components/blockchain-network-status";
import TokenApprovalManager from "@/components/token-approval-manager";
import WalletAnalytics from "@/components/wallet-analytics";
import PriceAlerts from "@/components/price-alerts";

export default function BlockchainToolsPage() {
  return (
    <>
      <SEO
        title="Blockchain Tools | CODEX"
        description="Essential blockchain utilities: gas tracker, network status, token approvals, wallet analytics, and price alerts."
        keywords={["blockchain tools", "gas tracker", "network status", "token approvals", "wallet analytics", "price alerts", "crypto tools"]}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm px-4 py-2">
              <Wrench className="inline h-4 w-4 mr-2" />
              Blockchain Utilities
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Blockchain Tools
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Essential utilities for monitoring networks, managing approvals, tracking gas prices, and analyzing your wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-8">
              <WalletAnalytics />
              <TokenApprovalManager />
            </div>

            <div className="space-y-8">
              <GasTracker />
              <PriceAlerts />
            </div>
          </div>

          <div className="mb-8">
            <BlockchainNetworkStatus />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-600/10 to-orange-900/10 border border-orange-500/20">
              <Fuel className="w-10 h-10 text-orange-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Gas Optimization</h3>
              <p className="text-gray-400 text-sm">
                Real-time gas prices across multiple networks. Time your transactions for the lowest fees.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-600/10 to-cyan-900/10 border border-cyan-500/20">
              <Activity className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Network Monitoring</h3>
              <p className="text-gray-400 text-sm">
                Live status of major blockchain networks including block times, TPS, and validator counts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-600/10 to-purple-900/10 border border-purple-500/20">
              <Shield className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Security Management</h3>
              <p className="text-gray-400 text-sm">
                Review and revoke token approvals to protect your assets from unauthorized access.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-900/10 border border-blue-500/20">
              <BarChart3 className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Wallet Insights</h3>
              <p className="text-gray-400 text-sm">
                Comprehensive analytics on your portfolio including allocation, activity, and performance.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-600/10 to-yellow-900/10 border border-yellow-500/20">
              <Bell className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Price Alerts</h3>
              <p className="text-gray-400 text-sm">
                Set custom price alerts and get notified when tokens hit your target prices.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-green-600/10 to-green-900/10 border border-green-500/20">
              <Wrench className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">More Tools Coming</h3>
              <p className="text-gray-400 text-sm">
                Contract verification, transaction decoder, ENS lookup, and more utilities in development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

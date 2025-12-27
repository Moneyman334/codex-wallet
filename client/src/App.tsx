import { useState, useEffect, Suspense, lazy, ComponentType } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import { PageTracker } from "@/components/page-tracker";
import { useWeb3 } from "@/hooks/use-web3";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { ErrorBoundary } from "@/components/error-boundary";
import LoadingOverlay from "@/components/loading-overlay";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NativeAppProvider } from "@/components/native-features";
import { MobileTabBar, MobileTabBarSpacer } from "@/components/mobile-tab-bar";
import { IOSLiteBanner } from "@/components/ios-feature-gate";
import { IOSRouteGuard } from "@/components/ios-route-guard";
import { IOSAppGate } from "@/components/ios-app-gate";
import { Capacitor } from "@capacitor/core";
import { DemoModeProvider } from "@/hooks/use-demo-mode";
import { WalletNexusProvider } from "@/lib/wallet-nexus";
import { ProtectedRoute } from "@/components/protected-route";
import { useDevAutoLogin } from "@/hooks/use-dev-auto-login";
import { useDevWalletAutoConnect } from "@/hooks/use-dev-wallet-auto-connect";
import AgeVerificationGate from "@/components/age-verification-gate";
import { BlockchainProvider } from "@/components/providers/BlockchainProvider";
import Footer from "@/components/footer";
import { Loader2 } from "lucide-react";
import { IOSNativeOnboarding, checkOnboardingComplete } from "@/components/ios-native-onboarding";
import { BiometricGuard } from "@/components/biometric-guard";
import { EnhancedOfflineBanner } from "@/components/enhanced-offline-banner";
import { useKonamiCode } from "@/hooks/use-konami-code";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Lazy route wrapper
function LazyRoute({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// iOS-guarded lazy route wrapper for regulated features
function IOSGuardedRoute({ component: Component, featureId }: { component: ComponentType; featureId: string }) {
  return (
    <IOSRouteGuard featureId={featureId}>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </IOSRouteGuard>
  );
}

// ============================================
// LAZY LOADED PAGES - Split by feature groups
// ============================================

// Core Pages (commonly accessed)
const HomePage = lazy(() => import("@/pages/home"));
const IOSHomePage = lazy(() => import("@/pages/ios-home"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Wallet & Tokens
const WalletPage = lazy(() => import("@/pages/wallet"));
const TokensPage = lazy(() => import("@/pages/tokens"));
const TransactionsPage = lazy(() => import("@/pages/transactions"));
const ContractsPage = lazy(() => import("@/pages/contracts"));
const WalletNexusPage = lazy(() => import("@/pages/wallet-nexus"));
const PortfolioPage = lazy(() => import("@/pages/portfolio"));

// NFT & Collections
const NFTsPage = lazy(() => import("@/pages/nfts"));
const NFTGalleryPage = lazy(() => import("@/pages/nft-gallery"));
const NFTCreatorPage = lazy(() => import("@/pages/nft-creator"));
const PersonalCollectionPage = lazy(() => import("@/pages/personal-collection"));
const NFTMarketplacePage = lazy(() => import("@/pages/nft-marketplace"));
const MarketplacePage = lazy(() => import("@/pages/marketplace"));
const LiveBlockchainPage = lazy(() => import("@/pages/live-blockchain"));

// Trading & Finance
const TradePage = lazy(() => import("@/pages/trade"));
const LiveTradingPage = lazy(() => import("@/pages/live-trading"));
const SwapPage = lazy(() => import("@/pages/swap"));
const BridgePage = lazy(() => import("@/pages/bridge"));
const MarginTradingPage = lazy(() => import("@/pages/margin-trading"));
const SocialTradingPage = lazy(() => import("@/pages/social-trading"));
const CopyTradingPage = lazy(() => import("@/pages/copy-trading"));
const DexAggregatorPage = lazy(() => import("@/pages/dex-aggregator"));
const TradingBotPage = lazy(() => import("@/pages/trading-bot"));

// Staking & DeFi
const StakingPage = lazy(() => import("@/pages/staking"));
const RealStakingPage = lazy(() => import("@/pages/real-staking"));
const YieldFarmingPage = lazy(() => import("@/pages/yield-farming"));
const P2PLendingPage = lazy(() => import("@/pages/p2p-lending"));
const AutoCompoundPage = lazy(() => import("@/pages/auto-compound"));

// Payments & Commerce
const DepositsPage = lazy(() => import("@/pages/deposits"));
const CryptoPaymentsPage = lazy(() => import("@/pages/crypto-payments"));
const CheckoutPage = lazy(() => import("@/pages/checkout"));
const OrdersPage = lazy(() => import("@/pages/orders"));
const CartPage = lazy(() => import("@/pages/cart"));
const CartRecoveryPage = lazy(() => import("@/pages/cart-recovery"));
const ProductsPage = lazy(() => import("@/pages/products"));
const ProductDetailPage = lazy(() => import("@/pages/product-detail"));
const WishlistPage = lazy(() => import("@/pages/wishlist"));
const InvoicesPage = lazy(() => import("@/pages/invoices"));
const InstantSettlementPage = lazy(() => import("@/pages/instant-settlement"));
const GiftCardsPage = lazy(() => import("@/pages/gift-cards"));
const LoyaltyPage = lazy(() => import("@/pages/loyalty"));

// CODEX Pay (Payment Processing)
const CodexPayDashboard = lazy(() => import("@/pages/codex-pay-dashboard"));
const CodexPaySignup = lazy(() => import("@/pages/codex-pay-signup"));
const CodexPayBetaPage = lazy(() => import("@/pages/codex-pay-beta"));
const CodexPayCheckout = lazy(() => import("@/pages/codex-pay-checkout"));
const CodexPayAdminPage = lazy(() => import("@/pages/codex-pay-admin"));
const CodexPay = lazy(() => import("@/pages/CodexPay"));
const GetCodexPay = lazy(() => import("@/pages/GetCodexPay"));
const CodexATMPage = lazy(() => import("@/pages/codex-atm"));
const MerchantAcquisitionDashboard = lazy(() => import("@/pages/merchant-acquisition-dashboard"));

// Empire & Admin
const EmpireDashboard = lazy(() => import("@/pages/empire-dashboard"));
const EmpireOwnerDashboard = lazy(() => import("@/pages/empire-owner-dashboard"));
const EmpireVaultPage = lazy(() => import("@/pages/empire-vault"));
const EmpirePassPage = lazy(() => import("@/pages/empire-pass"));
const EmpireAPIPortal = lazy(() => import("@/pages/empire-api-portal"));
const EmpireAPISignup = lazy(() => import("@/pages/empire-api-signup"));
const HouseVaultsPage = lazy(() => import("@/pages/house-vaults"));
const RevenueDashboardPage = lazy(() => import("@/pages/revenue-dashboard"));
const OwnerAnalyticsPage = lazy(() => import("@/pages/owner-analytics"));
const SupremeCommandPage = lazy(() => import("@/pages/supreme-command"));
const CommandCenterPage = lazy(() => import("@/pages/command-center"));

// Codex Ecosystem
const CodexTokenDashboard = lazy(() => import("@/pages/codex-token-dashboard"));
const CodexNftsPage = lazy(() => import("@/pages/codex-nfts"));
const CodexAchievementsPage = lazy(() => import("@/pages/codex-achievements"));
const CodexStakingPage = lazy(() => import("@/pages/codex-staking"));
const CodexRelicsPage = lazy(() => import("@/pages/codex-relics"));
const CodexEcosystemPage = lazy(() => import("@/pages/codex-ecosystem"));

// Bots & Automation
const SentinelBotPage = lazy(() => import("@/pages/sentinel-bot"));
const BotDashboardPage = lazy(() => import("@/pages/bot-dashboard"));
const BotConfigPage = lazy(() => import("@/pages/bot-config"));
const BotSubscriptionPage = lazy(() => import("@/pages/bot-subscription"));
const AutoTradingBotPage = lazy(() => import("@/pages/auto-trading-bot"));
const SocialAutomationPage = lazy(() => import("@/pages/social-automation"));

// Marketing & Analytics
const MarketingDashboardPage = lazy(() => import("@/pages/marketing-dashboard"));
const MarketingOverviewPage = lazy(() => import("@/pages/marketing-overview"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const VisitorAnalyticsPage = lazy(() => import("@/pages/visitor-analytics"));

// Admin & Settings
const AdminDiscountsPage = lazy(() => import("@/pages/admin-discounts"));
const AdminFlashSalesPage = lazy(() => import("@/pages/admin-flash-sales"));
const AdminSecurityDashboard = lazy(() => import("@/pages/admin-security-dashboard"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const StatusPage = lazy(() => import("@/pages/status"));

// Subscriptions & Affiliates
const SubscriptionsPage = lazy(() => import("@/pages/subscriptions"));
const AffiliateDashboardPage = lazy(() => import("@/pages/affiliate-dashboard"));
const ReferralsPage = lazy(() => import("@/pages/referrals"));

// Security & Compliance
const SecurityCenter = lazy(() => import("@/pages/security-center"));
const ProofOfReservesPage = lazy(() => import("@/pages/proof-of-reserves"));
const RateLimitsMonitor = lazy(() => import("@/pages/rate-limits-monitor"));
const TransparencyHub = lazy(() => import("@/pages/transparency-hub"));

// Token & Contract Creation
const TokenCreatorPage = lazy(() => import("@/pages/token-creator"));
const AutoDeployPage = lazy(() => import("@/pages/auto-deploy"));
const TokenLaunchpadPage = lazy(() => import("@/pages/token-launchpad"));
const BlockchainToolsPage = lazy(() => import("@/pages/blockchain-tools"));

// DAO & Governance
const DAOGovernancePage = lazy(() => import("@/pages/dao-governance"));
const PredictionMarketsPage = lazy(() => import("@/pages/prediction-markets"));

// User Features
const CustomerDashboardPage = lazy(() => import("@/pages/customer-dashboard"));
const ReviewsPage = lazy(() => import("@/pages/reviews"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const PriceAlertsPage = lazy(() => import("@/pages/price-alerts"));
const AchievementsPage = lazy(() => import("@/pages/achievements"));

// Multi-Chain
const MultiChainDashboard = lazy(() => import("@/pages/MultiChainDashboard"));
const BillionaireModePage = lazy(() => import("@/pages/billionaire-mode"));

// Competitive & Social Features (Standout)
const LeaderboardPage = lazy(() => import("@/pages/leaderboard"));
const WhaleTrackerPage = lazy(() => import("@/pages/whale-tracker"));
const AISentimentPage = lazy(() => import("@/pages/ai-sentiment"));
const PaperTradingPage = lazy(() => import("@/pages/paper-trading"));
const TradingCompetitionsPage = lazy(() => import("@/pages/trading-competitions"));
const LiveActivityPage = lazy(() => import("@/pages/live-activity"));

// Legal & Info Pages
const TermsPage = lazy(() => import("@/pages/terms"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const FAQPage = lazy(() => import("@/pages/faq"));
const DeleteAccountPage = lazy(() => import("@/pages/delete-account"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const WebhooksDoc = lazy(() => import("@/pages/WebhooksDoc"));

// Mobile & Downloads
const MobileAppPage = lazy(() => import("@/pages/mobile-app"));
const DownloadAndroid = lazy(() => import("@/pages/download-android"));

// Special Pages
const KingFrankensteinQRPage = lazy(() => import("@/pages/king-frankenstein-qr"));
const MemoryOfTheManyPage = lazy(() => import("@/pages/memory-of-the-many"));

// Lazy-loaded components that are heavy
const EnhancedConnectionModal = lazy(() => import("@/components/enhanced-connection-modal"));
const CosmicCursor = lazy(() => import("@/components/cosmic-cursor"));
const EmpireOracle = lazy(() => import("@/components/empire-oracle"));
const WalletHealthMonitor = lazy(() => import("@/components/wallet-health-monitor"));
const WalletActivityIndicator = lazy(() => import("@/components/wallet-activity-indicator"));
const NetworkStatus = lazy(() => import("@/components/network-status"));
const OnboardingTour = lazy(() => import("@/components/onboarding-tour"));
const LaunchBanner = lazy(() => import("@/components/launch-banner"));

function detectIsIOS(): boolean {
  if (Capacitor.getPlatform() === 'ios') {
    return true;
  }
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && !/Windows/.test(ua);
  }
  return false;
}

function IOSAwareHomePage() {
  const isIOS = detectIsIOS();
  return <LazyRoute component={isIOS ? IOSHomePage : HomePage} />;
}

function Router() {
  return (
    <Switch>
      {/* Core */}
      <Route path="/" component={IOSAwareHomePage} />
      
      {/* Multi-Chain & Settlement - iOS Guarded */}
      <Route path="/multi-chain" component={() => <LazyRoute component={MultiChainDashboard} />} />
      <Route path="/instant-settlement" component={() => <IOSGuardedRoute component={InstantSettlementPage} featureId="instant-settlement" />} />
      
      {/* Empire - iOS Guarded */}
      <Route path="/empire" component={() => <IOSGuardedRoute component={EmpireDashboard} featureId="empire" />} />
      <Route path="/vaults" component={() => <IOSGuardedRoute component={HouseVaultsPage} featureId="house-vaults" />} />
      <Route path="/auto-compound" component={() => <IOSGuardedRoute component={AutoCompoundPage} featureId="auto-compound" />} />
      <Route path="/empire-vault" component={() => <IOSGuardedRoute component={EmpireVaultPage} featureId="empire-vault" />} />
      <Route path="/billionaire-mode" component={() => <LazyRoute component={BillionaireModePage} />} />
      <Route path="/auto-trading-bot" component={() => <IOSGuardedRoute component={AutoTradingBotPage} featureId="auto-trading-bot" />} />
      
      {/* Competitive & Social Features (Standout) */}
      <Route path="/leaderboard" component={() => <LazyRoute component={LeaderboardPage} />} />
      <Route path="/whale-tracker" component={() => <LazyRoute component={WhaleTrackerPage} />} />
      <Route path="/ai-sentiment" component={() => <LazyRoute component={AISentimentPage} />} />
      <Route path="/paper-trading" component={() => <LazyRoute component={PaperTradingPage} />} />
      <Route path="/trading-competitions" component={() => <LazyRoute component={TradingCompetitionsPage} />} />
      <Route path="/live-activity" component={() => <LazyRoute component={LiveActivityPage} />} />
      
      {/* Wallet & Tokens */}
      <Route path="/wallet" component={() => <LazyRoute component={WalletPage} />} />
      <Route path="/tokens" component={() => <LazyRoute component={TokensPage} />} />
      <Route path="/transactions" component={() => <LazyRoute component={TransactionsPage} />} />
      <Route path="/contracts" component={() => <LazyRoute component={ContractsPage} />} />
      <Route path="/nfts" component={() => <LazyRoute component={NFTsPage} />} />
      
      {/* Payments - iOS Guarded */}
      <Route path="/deposits" component={() => <IOSGuardedRoute component={DepositsPage} featureId="deposits" />} />
      <Route path="/crypto-payments" component={() => <IOSGuardedRoute component={CryptoPaymentsPage} featureId="crypto-payments" />} />
      <Route path="/checkout" component={() => <IOSGuardedRoute component={CheckoutPage} featureId="checkout" />} />
      <Route path="/orders" component={() => <LazyRoute component={OrdersPage} />} />
      
      {/* Token & NFT Creation - iOS Guarded */}
      <Route path="/token-creator" component={() => <IOSGuardedRoute component={TokenCreatorPage} featureId="token-creator" />} />
      <Route path="/nft-creator" component={() => <IOSGuardedRoute component={NFTCreatorPage} featureId="nft-creator" />} />
      <Route path="/personal-collection" component={() => <LazyRoute component={PersonalCollectionPage} />} />
      <Route path="/auto-deploy" component={() => <IOSGuardedRoute component={AutoDeployPage} featureId="auto-deploy" />} />
      
      {/* Trading - iOS Guarded */}
      <Route path="/trade" component={() => <IOSGuardedRoute component={TradePage} featureId="trading" />} />
      <Route path="/live-trading" component={() => <IOSGuardedRoute component={LiveTradingPage} featureId="trading" />} />
      
      {/* Bots - iOS Guarded */}
      <Route path="/sentinel-bot" component={() => <IOSGuardedRoute component={SentinelBotPage} featureId="sentinel-bot" />} />
      <Route path="/bot-dashboard" component={() => <IOSGuardedRoute component={BotDashboardPage} featureId="trading-bot" />} />
      <Route path="/bot-config" component={() => <IOSGuardedRoute component={BotConfigPage} featureId="trading-bot" />} />
      <Route path="/bot-subscription" component={() => <IOSGuardedRoute component={BotSubscriptionPage} featureId="trading-bot" />} />
      
      {/* Protected Routes */}
      <Route path="/social-automation">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><SocialAutomationPage /></Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/marketing">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><MarketingDashboardPage /></Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/marketing-overview">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><MarketingOverviewPage /></Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/command-center">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><CommandCenterPage /></Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/discounts">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><AdminDiscountsPage /></Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/flash-sales">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><AdminFlashSalesPage /></Suspense>
        </ProtectedRoute>
      </Route>
      
      {/* Subscriptions */}
      <Route path="/subscriptions" component={() => <LazyRoute component={SubscriptionsPage} />} />
      <Route path="/empire-pass" component={() => <LazyRoute component={EmpirePassPage} />} />
      <Route path="/revenue-dashboard" component={() => <LazyRoute component={RevenueDashboardPage} />} />
      <Route path="/affiliate" component={() => <LazyRoute component={AffiliateDashboardPage} />} />
      <Route path="/gift-cards" component={() => <LazyRoute component={GiftCardsPage} />} />
      <Route path="/loyalty" component={() => <LazyRoute component={LoyaltyPage} />} />
      
      {/* Codex */}
      <Route path="/codex-dashboard" component={() => <LazyRoute component={CodexTokenDashboard} />} />
      <Route path="/codex-nfts" component={() => <LazyRoute component={CodexNftsPage} />} />
      <Route path="/codex-achievements" component={() => <LazyRoute component={CodexAchievementsPage} />} />
      <Route path="/codex-staking" component={() => <IOSGuardedRoute component={CodexStakingPage} featureId="staking" />} />
      <Route path="/codex-relics" component={() => <LazyRoute component={CodexRelicsPage} />} />
      
      {/* Shopping */}
      <Route path="/cart" component={() => <LazyRoute component={CartPage} />} />
      <Route path="/cart-recovery" component={() => <LazyRoute component={CartRecoveryPage} />} />
      <Route path="/products" component={() => <LazyRoute component={ProductsPage} />} />
      <Route path="/product/:id" component={() => <LazyRoute component={ProductDetailPage} />} />
      <Route path="/wishlist" component={() => <LazyRoute component={WishlistPage} />} />
      <Route path="/dashboard" component={() => <LazyRoute component={CustomerDashboardPage} />} />
      <Route path="/reviews" component={() => <LazyRoute component={ReviewsPage} />} />
      <Route path="/invoices" component={() => <LazyRoute component={InvoicesPage} />} />
      
      {/* Analytics */}
      <Route path="/analytics" component={() => <LazyRoute component={AnalyticsPage} />} />
      <Route path="/visitor-analytics" component={() => <LazyRoute component={VisitorAnalyticsPage} />} />
      <Route path="/portfolio" component={() => <LazyRoute component={PortfolioPage} />} />
      <Route path="/notifications" component={() => <LazyRoute component={NotificationsPage} />} />
      <Route path="/price-alerts" component={() => <LazyRoute component={PriceAlertsPage} />} />
      <Route path="/achievements" component={() => <LazyRoute component={AchievementsPage} />} />
      
      {/* Marketplace & Staking - iOS Guarded */}
      <Route path="/marketplace" component={() => <IOSGuardedRoute component={MarketplacePage} featureId="nft-marketplace" />} />
      <Route path="/staking" component={() => <IOSGuardedRoute component={StakingPage} featureId="staking" />} />
      <Route path="/real-staking" component={() => <IOSGuardedRoute component={RealStakingPage} featureId="staking" />} />
      
      {/* Security */}
      <Route path="/security-center" component={() => <LazyRoute component={SecurityCenter} />} />
      <Route path="/proof-of-reserves" component={() => <LazyRoute component={ProofOfReservesPage} />} />
      <Route path="/rate-limits" component={() => <LazyRoute component={RateLimitsMonitor} />} />
      <Route path="/transparency" component={() => <LazyRoute component={TransparencyHub} />} />
      
      {/* CODEX Pay - iOS Guarded */}
      <Route path="/codex-pay" component={() => <IOSGuardedRoute component={CodexPayDashboard} featureId="codex-pay" />} />
      <Route path="/codex-pay/signup" component={() => <IOSGuardedRoute component={CodexPaySignup} featureId="codex-pay" />} />
      <Route path="/codex-pay/beta" component={() => <IOSGuardedRoute component={CodexPayBetaPage} featureId="codex-pay" />} />
      <Route path="/codex-pay/checkout/:intentId" component={() => <IOSGuardedRoute component={CodexPayCheckout} featureId="codex-pay" />} />
      <Route path="/mobile-app" component={() => <LazyRoute component={MobileAppPage} />} />
      <Route path="/codex-pay/admin">
        <IOSRouteGuard featureId="codex-pay">
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><CodexPayAdminPage /></Suspense>
          </ProtectedRoute>
        </IOSRouteGuard>
      </Route>
      <Route path="/merchant-acquisition">
        <IOSRouteGuard featureId="codex-pay">
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><MerchantAcquisitionDashboard /></Suspense>
          </ProtectedRoute>
        </IOSRouteGuard>
      </Route>
      <Route path="/codex-atm" component={() => <IOSGuardedRoute component={CodexATMPage} featureId="codex-atm" />} />
      <Route path="/download-android" component={() => <LazyRoute component={DownloadAndroid} />} />
      
      {/* DEX & Trading - iOS Guarded */}
      <Route path="/dex-aggregator" component={() => <IOSGuardedRoute component={DexAggregatorPage} featureId="dex" />} />
      <Route path="/trading-bot" component={() => <IOSGuardedRoute component={TradingBotPage} featureId="trading-bot" />} />
      <Route path="/copy-trading" component={() => <IOSGuardedRoute component={CopyTradingPage} featureId="copy-trading" />} />
      <Route path="/nft-marketplace" component={() => <IOSGuardedRoute component={NFTMarketplacePage} featureId="nft-marketplace" />} />
      <Route path="/live-blockchain" component={() => <IOSGuardedRoute component={LiveBlockchainPage} featureId="nft-marketplace" />} />
      <Route path="/memory-of-the-many" component={() => <LazyRoute component={MemoryOfTheManyPage} />} />
      <Route path="/admin/security-dashboard" component={() => <LazyRoute component={AdminSecurityDashboard} />} />
      
      {/* DeFi - iOS Guarded */}
      <Route path="/referrals" component={() => <LazyRoute component={ReferralsPage} />} />
      <Route path="/swap" component={() => <IOSGuardedRoute component={SwapPage} featureId="swap" />} />
      <Route path="/bridge" component={() => <IOSGuardedRoute component={BridgePage} featureId="bridge" />} />
      <Route path="/nft-gallery" component={() => <LazyRoute component={NFTGalleryPage} />} />
      <Route path="/dao" component={() => <IOSGuardedRoute component={DAOGovernancePage} featureId="dao" />} />
      <Route path="/lending" component={() => <IOSGuardedRoute component={P2PLendingPage} featureId="p2p-lending" />} />
      <Route path="/prediction-markets" component={() => <IOSGuardedRoute component={PredictionMarketsPage} featureId="prediction-markets" />} />
      <Route path="/yield-farming" component={() => <IOSGuardedRoute component={YieldFarmingPage} featureId="yield-farming" />} />
      <Route path="/social-trading" component={() => <IOSGuardedRoute component={SocialTradingPage} featureId="social-trading" />} />
      <Route path="/margin-trading" component={() => <IOSGuardedRoute component={MarginTradingPage} featureId="margin-trading" />} />
      <Route path="/token-launchpad" component={() => <IOSGuardedRoute component={TokenLaunchpadPage} featureId="token-launchpad" />} />
      <Route path="/blockchain-tools" component={() => <LazyRoute component={BlockchainToolsPage} />} />
      
      {/* Advanced */}
      <Route path="/supreme-command" component={() => <LazyRoute component={SupremeCommandPage} />} />
      <Route path="/wallet-nexus" component={() => <LazyRoute component={WalletNexusPage} />} />
      <Route path="/settings" component={() => <LazyRoute component={SettingsPage} />} />
      <Route path="/status" component={() => <LazyRoute component={StatusPage} />} />
      <Route path="/codex-pay-landing" component={() => <LazyRoute component={CodexPay} />} />
      <Route path="/get-codex-pay" component={() => <LazyRoute component={GetCodexPay} />} />
      <Route path="/empire-api-portal" component={() => <IOSGuardedRoute component={EmpireAPIPortal} featureId="empire-api" />} />
      <Route path="/empire-api-signup" component={() => <IOSGuardedRoute component={EmpireAPISignup} featureId="empire-api" />} />
      <Route path="/codex-ecosystem" component={() => <LazyRoute component={CodexEcosystemPage} />} />
      <Route path="/king-frankenstein-qr" component={() => <LazyRoute component={KingFrankensteinQRPage} />} />
      <Route path="/webhooks" component={() => <LazyRoute component={WebhooksDoc} />} />
      <Route path="/docs/webhooks" component={() => <LazyRoute component={WebhooksDoc} />} />
      
      {/* Legal */}
      <Route path="/terms" component={() => <LazyRoute component={TermsOfService} />} />
      <Route path="/privacy" component={() => <LazyRoute component={PrivacyPolicy} />} />
      <Route path="/faq" component={() => <LazyRoute component={FAQPage} />} />
      <Route path="/delete-account" component={() => <LazyRoute component={DeleteAccountPage} />} />
      
      {/* Owner Protected */}
      <Route path="/owner-analytics">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><OwnerAnalyticsPage /></Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/empire-owner">
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}><EmpireOwnerDashboard /></Suspense>
        </ProtectedRoute>
      </Route>
      
      {/* 404 */}
      <Route component={() => <LazyRoute component={NotFound} />} />
    </Switch>
  );
}

function AppContent() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { connectWallet, disconnectWallet, chainId } = useWeb3();

  useDevAutoLogin();
  useDevWalletAutoConnect();
  useWalletSession();
  const { isFounderMode } = useKonamiCode();

  const handleConnect = () => {
    setShowConnectionModal(true);
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleConnectMetaMask = async () => {
    try {
      await connectWallet();
      setShowConnectionModal(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <LoadingOverlay />
        <OfflineIndicator />
        <div className="bg-background text-foreground min-h-screen">
          <Suspense fallback={null}><CosmicCursor /></Suspense>
          <Toaster />
          <PageTracker />
          <Suspense fallback={null}><LaunchBanner /></Suspense>
          <Navigation
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
          <IOSLiteBanner />

          <Suspense fallback={null}>
            <div className="fixed top-20 right-4 z-40 hidden md:flex flex-col gap-2">
              <WalletHealthMonitor />
              <NetworkStatus />
            </div>
          </Suspense>

          <Suspense fallback={null}><WalletActivityIndicator /></Suspense>

          <Router />

          <MobileTabBarSpacer />
          <Footer />
          <MobileTabBar />

          <Suspense fallback={null}>
            <EnhancedConnectionModal
              isOpen={showConnectionModal}
              onClose={() => setShowConnectionModal(false)}
              onConnectMetaMask={handleConnectMetaMask}
              selectedNetwork={chainId}
            />
          </Suspense>

          <Suspense fallback={null}><EmpireOracle /></Suspense>
          <Suspense fallback={null}><OnboardingTour /></Suspense>
          
          {/* Founder Mode Badge - Easter Egg */}
          {isFounderMode && (
            <div className="fixed bottom-4 left-4 z-50 founder-badge" data-testid="founder-badge">
              <span className="founder-crown">👑</span>
              <span>FOUNDER</span>
            </div>
          )}
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

function IOSNativeWrapper({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (isNative) {
      checkOnboardingComplete().then((complete) => {
        setShowOnboarding(!complete);
        setOnboardingChecked(true);
      });
    } else {
      setOnboardingChecked(true);
    }
  }, [isNative]);

  if (!onboardingChecked) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (showOnboarding && isNative) {
    return <IOSNativeOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (isNative) {
    return (
      <BiometricGuard enabled={isIOS}>
        <EnhancedOfflineBanner />
        {children}
      </BiometricGuard>
    );
  }

  return <>{children}</>;
}

function App() {
  const isGoogleVerificationFile = /^\/google[\w-]+\.html$/.test(window.location.pathname);
  const legalPages = ['/privacy', '/terms', '/support', '/faq', '/delete-account'];
  const isLegalPage = legalPages.some(page => window.location.pathname === page || window.location.pathname.startsWith(page + '/'));
  const shouldBypassAgeGate = isGoogleVerificationFile || isLegalPage;
  
  return (
    <QueryClientProvider client={queryClient}>
      <BlockchainProvider>
        <DemoModeProvider>
          <WalletNexusProvider>
            <NativeAppProvider>
              <IOSAppGate>
                <IOSNativeWrapper>
                  {shouldBypassAgeGate ? (
                    <AppContent />
                  ) : (
                    <AgeVerificationGate>
                      <AppContent />
                    </AgeVerificationGate>
                  )}
                </IOSNativeWrapper>
              </IOSAppGate>
            </NativeAppProvider>
          </WalletNexusProvider>
        </DemoModeProvider>
      </BlockchainProvider>
    </QueryClientProvider>
  );
}

export default App;
